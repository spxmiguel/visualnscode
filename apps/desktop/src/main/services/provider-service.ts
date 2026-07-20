import { app } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  createProvider,
  defaultProviderSettings,
  ensureSafeBaseUrl,
  getProviderDescriptor,
  providerCatalog,
  SanitizedLogger,
  type AgentChunk,
  type AgentInput,
  type AIModel,
  type ProviderSettings,
  type ProviderSummary,
  type ProviderConnectionResult,
} from '@visualnscode/providers';
import { SecureStorage } from './secure-storage';
import { prepareRemoteContext, redactContent } from './secret-scanner';

const validateSettings = (settings: ProviderSettings): ProviderSettings => {
  const descriptor = getProviderDescriptor(settings.providerId);
  if (!descriptor) throw new Error('Provider desconhecido.');
  const inputBaseUrl = settings.baseUrl.trim();
  const baseUrl = inputBaseUrl ? ensureSafeBaseUrl(inputBaseUrl, descriptor.execution) : '';
  return {
    providerId: descriptor.id,
    enabled: Boolean(settings.enabled),
    defaultModel: settings.defaultModel.trim().slice(0, 200),
    alias: settings.alias.trim().slice(0, 80),
    baseUrl: baseUrl.slice(0, 2048),
    costLimitUsd:
      settings.costLimitUsd === null
        ? null
        : Math.max(0, Math.min(10_000, Number(settings.costLimitUsd))),
    tokenLimit: Math.max(1, Math.min(1_000_000, Math.floor(settings.tokenLimit))),
    timeoutMs: Math.max(1000, Math.min(600_000, Math.floor(settings.timeoutMs))),
    concurrency: Math.max(1, Math.min(16, Math.floor(settings.concurrency))),
  };
};

export class ProviderService {
  private readonly filePath = join(app.getPath('userData'), 'provider-settings.json');
  private readonly activeCounts = new Map<string, number>();
  private readonly activeProviders = new Map<string, ReturnType<typeof createProvider>>();
  private readonly logger = new SanitizedLogger();

  constructor(private readonly secrets = new SecureStorage()) {}

  async list(): Promise<readonly ProviderSummary[]> {
    const stored = await this.readSettings();
    return Promise.all(
      providerCatalog.map(async (descriptor) => {
        const settings = stored[descriptor.id] ?? defaultProviderSettings(descriptor);
        const secret = await this.secrets.get(`provider:${descriptor.id}`);
        const configured = descriptor.requiresSecret
          ? Boolean(secret)
          : descriptor.type === 'cli' || Boolean(settings.baseUrl);
        let available = false;
        if (configured) {
          try {
            available = await createProvider(descriptor, settings, secret).isAvailable();
          } catch {
            available = false;
          }
        }
        return { ...descriptor, available, configured, settings };
      }),
    );
  }

  async update(settings: ProviderSettings): Promise<ProviderSettings> {
    const validated = validateSettings(settings);
    const stored = await this.readSettings();
    stored[validated.providerId] = validated;
    await this.writeSettings(stored);
    this.logger.info('Configuração de provider atualizada.', {
      providerId: validated.providerId,
      enabled: validated.enabled,
    });
    return validated;
  }

  async models(providerId: string): Promise<readonly AIModel[]> {
    const provider = await this.create(providerId);
    return provider.listModels();
  }

  async test(providerId: string): Promise<ProviderConnectionResult> {
    try {
      const provider = await this.create(providerId);
      const available = await provider.isAvailable();
      if (!available) {
        return {
          ok: false,
          message: 'Não foi possível conectar. Revise chave, login ou endpoint.',
          models: [],
        };
      }
      const models = await provider.listModels();
      return {
        ok: true,
        message: `${provider.name} conectado. ${models.length} modelo(s) encontrado(s).`,
        models,
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Falha ao testar o provider.',
        models: [],
      };
    }
  }

  async stream(
    providerId: string,
    input: AgentInput,
    onChunk: (chunk: AgentChunk) => void,
  ): Promise<void> {
    const settings = (await this.readSettings())[providerId];
    if (!settings?.enabled)
      throw new Error('Ative o provider nas configurações antes de usar o chat.');
    const active = this.activeCounts.get(providerId) ?? 0;
    if (active >= settings.concurrency)
      throw new Error('Limite de conversas simultâneas atingido.');
    if (!input.model.trim()) throw new Error('Selecione um modelo antes de enviar.');

    const provider = await this.create(providerId);
    const descriptor = getProviderDescriptor(providerId);
    const safeInput =
      descriptor?.execution === 'remote'
        ? {
            ...input,
            messages: input.messages.map((message) => ({
              ...message,
              content: redactContent(message.content),
            })),
            contextFiles: prepareRemoteContext(input.contextFiles ?? []).map((file) => ({
              path: file.path,
              content: file.content,
            })),
          }
        : input;
    this.activeCounts.set(providerId, active + 1);
    this.activeProviders.set(input.requestId, provider);
    this.logger.info('Streaming iniciado.', { providerId, requestId: input.requestId });
    try {
      for await (const chunk of provider.streamMessage({
        ...safeInput,
        maxTokens: Math.min(input.maxTokens ?? settings.tokenLimit, settings.tokenLimit),
        timeoutMs: Math.min(input.timeoutMs ?? settings.timeoutMs, settings.timeoutMs),
      })) {
        if (
          chunk.type === 'usage' &&
          settings.costLimitUsd !== null &&
          chunk.usage.estimatedCostUsd !== null &&
          chunk.usage.estimatedCostUsd > settings.costLimitUsd
        ) {
          await provider.cancel(input.requestId);
          onChunk({
            type: 'error',
            requestId: input.requestId,
            message: `Limite de custo de US$ ${settings.costLimitUsd.toFixed(2)} atingido.`,
          });
          break;
        }
        onChunk(chunk);
      }
    } finally {
      this.activeProviders.delete(input.requestId);
      this.activeCounts.set(providerId, Math.max(0, (this.activeCounts.get(providerId) ?? 1) - 1));
    }
  }

  async cancel(requestId: string): Promise<void> {
    await this.activeProviders.get(requestId)?.cancel(requestId);
    this.activeProviders.delete(requestId);
  }

  private async create(providerId: string) {
    const descriptor = getProviderDescriptor(providerId);
    if (!descriptor) throw new Error('Provider desconhecido.');
    const settings = (await this.readSettings())[providerId] ?? defaultProviderSettings(descriptor);
    if (!settings.baseUrl && descriptor.type !== 'cli')
      throw new Error('Configure o endpoint do provider.');
    const secret = await this.secrets.get(`provider:${providerId}`);
    if (descriptor.requiresSecret && !secret)
      throw new Error('Configure a chave no cofre do sistema.');
    return createProvider(descriptor, settings, secret);
  }

  private async readSettings(): Promise<Record<string, ProviderSettings>> {
    try {
      const value = JSON.parse(await readFile(this.filePath, 'utf8')) as Record<
        string,
        ProviderSettings
      >;
      return Object.fromEntries(
        Object.entries(value).flatMap(([id, settings]) => {
          try {
            return [[id, validateSettings(settings)]];
          } catch {
            return [];
          }
        }),
      );
    } catch {
      return {};
    }
  }

  private async writeSettings(settings: Record<string, ProviderSettings>): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(settings, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
  }
}
