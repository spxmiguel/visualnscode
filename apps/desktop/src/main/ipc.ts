import { ipcMain, shell } from 'electron';
import {
  getToolDefinition,
  type PermissionId,
  type ToolActionRequest,
} from '@visualnscode/integrations';
import {
  getProviderDescriptor,
  providerCatalog,
  type AgentInput,
  type ProviderSettings,
} from '@visualnscode/providers';
import { EnvironmentService } from './services/environment-service';
import { ProviderService } from './services/provider-service';
import { SecureStorage } from './services/secure-storage';

const service = new EnvironmentService();
const secureStorage = new SecureStorage();
const providerService = new ProviderService(secureStorage);
const providerIds = new Set(
  providerCatalog.filter(({ type }) => type === 'api').map(({ id }) => id),
);

const isValidAgentInput = (value: unknown): value is AgentInput => {
  if (!value || typeof value !== 'object') return false;
  const input = value as Partial<AgentInput>;
  if (!Array.isArray(input.messages) || !Array.isArray(input.contextFiles ?? [])) return false;
  const contextLength = (input.contextFiles ?? []).reduce(
    (total, file) => total + (typeof file.content === 'string' ? file.content.length : 0),
    0,
  );
  return (
    typeof input.requestId === 'string' &&
    input.requestId.length >= 8 &&
    input.requestId.length <= 100 &&
    typeof input.model === 'string' &&
    input.model.length <= 200 &&
    input.messages.length > 0 &&
    input.messages.length <= 100 &&
    input.messages.every(
      (message) =>
        Boolean(message) &&
        typeof message.id === 'string' &&
        ['system', 'user', 'assistant'].includes(message.role) &&
        typeof message.content === 'string' &&
        message.content.length <= 200_000,
    ) &&
    (input.contextFiles ?? []).every(
      (file) => Boolean(file) && typeof file.path === 'string' && typeof file.content === 'string',
    ) &&
    (input.contextFiles?.length ?? 0) <= 20 &&
    contextLength <= 1_000_000
  );
};

export const registerEnvironmentIpc = (): void => {
  ipcMain.handle('environment:detect-all', () => service.detectAll());
  ipcMain.handle('environment:detect', (_event, toolId: string) => service.detect(toolId));
  ipcMain.handle('environment:perform', (_event, request: ToolActionRequest) =>
    service.perform(request),
  );
  ipcMain.handle('environment:permissions', () => service.permissions.list());
  ipcMain.handle('environment:set-permission', (_event, id: PermissionId, granted: boolean) => {
    service.setPermission(id, granted);
    return service.permissions.list();
  });
  ipcMain.handle('environment:open-docs', async (_event, toolId: string) => {
    const definition = getToolDefinition(toolId);
    if (!definition) return false;
    await shell.openExternal(definition.documentationUrl);
    return true;
  });
  ipcMain.handle('environment:secret-status', async (_event, providerId: string) => ({
    available: secureStorage.isSecureAvailable(),
    configured:
      providerIds.has(providerId) && Boolean(await secureStorage.get(`provider:${providerId}`)),
  }));
  ipcMain.handle('environment:store-secret', async (_event, providerId: string, secret: string) => {
    if (!providerIds.has(providerId) || !service.permissions.has('credentials')) return false;
    if (secret.length < 8 || secret.length > 4096) return false;
    await secureStorage.set(`provider:${providerId}`, secret);
    return true;
  });
  ipcMain.handle('environment:remove-secret', async (_event, providerId: string) => {
    if (!providerIds.has(providerId) || !service.permissions.has('credentials')) return false;
    await secureStorage.remove(`provider:${providerId}`);
    return true;
  });

  ipcMain.handle('providers:list', () => providerService.list());
  ipcMain.handle('providers:update', (_event, settings: ProviderSettings) =>
    providerService.update(settings),
  );
  ipcMain.handle('providers:test', (_event, providerId: string) =>
    getProviderDescriptor(providerId)
      ? providerService.test(providerId)
      : { ok: false, message: 'Provider desconhecido.', models: [] },
  );
  ipcMain.handle('providers:models', (_event, providerId: string) =>
    getProviderDescriptor(providerId) ? providerService.models(providerId) : [],
  );
  ipcMain.on('chat:start', (event, payload: unknown) => {
    const send = (chunk: unknown): void => event.sender.send('chat:chunk', chunk);
    const candidate = payload as { providerId?: unknown; input?: unknown } | null;
    if (
      !candidate ||
      typeof candidate.providerId !== 'string' ||
      !getProviderDescriptor(candidate.providerId) ||
      !isValidAgentInput(candidate.input)
    ) {
      send({
        type: 'error',
        requestId:
          candidate?.input &&
          typeof candidate.input === 'object' &&
          'requestId' in candidate.input &&
          typeof candidate.input.requestId === 'string'
            ? candidate.input.requestId
            : 'invalid-request',
        message: 'A solicitação do chat é inválida.',
      });
      return;
    }
    const input = candidate.input;
    const providerId = candidate.providerId;
    void providerService.stream(providerId, input, send).catch((error: unknown) =>
      send({
        type: 'error',
        requestId: input.requestId,
        message: error instanceof Error ? error.message : 'Falha ao iniciar o chat.',
      }),
    );
  });
  ipcMain.handle('chat:cancel', (_event, requestId: string) => providerService.cancel(requestId));
};
