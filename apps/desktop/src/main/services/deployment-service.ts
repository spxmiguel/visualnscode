import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { createSafeProcessEnvironment } from '@visualnscode/integrations';
import type {
  DeployEvent,
  DeployPlan,
  DeployProvider,
  DeployRecord,
  DeployRequest,
} from '../../shared/deployment';
import { redactContent } from './secret-scanner';
import type { RunnerService } from './runner-service';

const execFileAsync = promisify(execFile);
const URL_RE = /https?:\/\/[^\s"']+/iu;
const SENSITIVE_QUERY = /token|secret|key|code|password|signature/iu;

const sanitizeUrl = (input: string | null): string | null => {
  if (!input) return null;
  try {
    const url = new URL(input);
    url.username = '';
    url.password = '';
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_QUERY.test(key)) url.searchParams.set(key, '[REDACTED]');
    }
    return url.toString();
  } catch {
    return null;
  }
};

export interface DeploymentCommandRunner {
  run(
    executable: string,
    args: readonly string[],
    cwd: string,
  ): Promise<{ code: number; output: string }>;
}

export class SystemDeploymentCommandRunner implements DeploymentCommandRunner {
  async run(executable: string, args: readonly string[], cwd: string) {
    try {
      const { stdout, stderr } = await execFileAsync(executable, [...args], {
        cwd,
        encoding: 'utf8',
        env: createSafeProcessEnvironment(),
        maxBuffer: 2 * 1024 * 1024,
        timeout: 15 * 60_000,
        windowsHide: true,
      });
      return { code: 0, output: redactContent(`${stdout}\n${stderr}`.trim()) };
    } catch (error) {
      const failure = error as {
        code?: number;
        stdout?: string;
        stderr?: string;
        message?: string;
      };
      return {
        code: typeof failure.code === 'number' ? failure.code : 1,
        output: redactContent(
          `${failure.stdout ?? ''}\n${failure.stderr ?? failure.message ?? ''}`.trim(),
        ),
      };
    }
  }
}

const providerNames: Readonly<Record<DeployProvider, string>> = {
  vercel: 'Vercel',
  firebase: 'Firebase Hosting',
  supabase: 'Supabase Edge Functions',
  'github-pages': 'GitHub Pages',
};

export class DeploymentService {
  constructor(
    private readonly runnerService: RunnerService,
    private readonly commandRunner: DeploymentCommandRunner = new SystemDeploymentCommandRunner(),
  ) {}

  plan(request: Pick<DeployRequest, 'provider' | 'environment' | 'config'>): DeployPlan {
    const production = request.environment === 'production';
    const name = providerNames[request.provider];
    const requiredFields: DeployPlan['requiredFields'] =
      request.provider === 'supabase'
        ? ['projectRef', 'functionName']
        : request.provider === 'github-pages'
          ? ['pagesWorkflow']
          : [];
    return {
      provider: request.provider,
      environment: request.environment,
      title: `${name} · ${production ? 'produção' : 'preview'}`,
      explanation: production
        ? 'Publica para usuários reais. A confirmação será verificada novamente antes do comando.'
        : 'Cria uma versão de revisão separada da produção.',
      command: this.commandFor(request).display,
      requiresBuild: request.provider !== 'supabase',
      requiresConfirmation: true,
      requiredFields,
    };
  }

  async deploy(
    workspacePath: string,
    request: DeployRequest,
    onEvent: (event: DeployEvent) => void,
  ): Promise<DeployRecord> {
    const plan = this.plan(request);
    if (!request.confirmed) throw new Error('Confirme este deploy antes de continuar.');
    for (const field of plan.requiredFields) {
      if (!request.config[field]?.trim()) throw new Error(`Preencha ${field} para continuar.`);
    }

    const deploymentId = randomUUID();
    const startedAt = new Date().toISOString();
    onEvent({ deploymentId, type: 'status', payload: 'Validando o projeto…' });
    try {
      if (plan.requiresBuild) {
        const runtime = await this.runnerService.detectProject(workspacePath);
        const build = runtime.commands.build?.display;
        if (build) {
          onEvent({
            deploymentId,
            type: 'status',
            payload: 'Gerando uma versão otimizada do projeto…',
          });
          const [executable, ...args] = build.split(/\s+/u);
          const result = await this.commandRunner.run(executable!, args, workspacePath);
          const safeOutput = redactContent(result.output);
          if (result.output)
            onEvent({ deploymentId, type: result.code ? 'error' : 'log', payload: safeOutput });
          if (result.code) throw new Error('O build falhou. Revise os detalhes antes de publicar.');
        }
      }

      const command = this.commandFor(request);
      onEvent({ deploymentId, type: 'status', payload: plan.explanation });
      const result = await this.commandRunner.run(command.executable, command.args, workspacePath);
      const safeOutput = redactContent(result.output);
      if (result.output)
        onEvent({ deploymentId, type: result.code ? 'error' : 'log', payload: safeOutput });
      if (result.code) throw new Error(`${providerNames[request.provider]} não concluiu o deploy.`);
      const url = sanitizeUrl(safeOutput.match(URL_RE)?.[0] ?? this.knownUrl(request));
      const record = this.record(
        deploymentId,
        request,
        'succeeded',
        url,
        startedAt,
        'Deploy concluído.',
      );
      await this.save(workspacePath, record);
      onEvent({
        deploymentId,
        type: 'complete',
        payload: url ?? 'Deploy concluído sem URL retornada.',
      });
      return record;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'O deploy não pôde ser concluído.';
      const record = this.record(deploymentId, request, 'failed', null, startedAt, message);
      await this.save(workspacePath, record);
      onEvent({ deploymentId, type: 'error', payload: message });
      return record;
    }
  }

  async history(workspacePath: string): Promise<readonly DeployRecord[]> {
    try {
      return JSON.parse(
        await fs.readFile(this.historyPath(workspacePath), 'utf8'),
      ) as DeployRecord[];
    } catch {
      return [];
    }
  }

  private commandFor(request: Pick<DeployRequest, 'provider' | 'environment' | 'config'>) {
    const production = request.environment === 'production';
    if (request.provider === 'vercel') {
      const args = ['deploy', '--yes', ...(production ? ['--prod'] : [])];
      return { executable: 'vercel', args, display: `vercel ${args.join(' ')}` };
    }
    if (request.provider === 'firebase') {
      const args = production
        ? ['deploy', '--only', 'hosting', '--non-interactive']
        : [
            'hosting:channel:deploy',
            `visualnscode-${Date.now().toString(36)}`,
            '--non-interactive',
          ];
      return { executable: 'firebase', args, display: `firebase ${args.join(' ')}` };
    }
    if (request.provider === 'supabase') {
      const args = [
        'functions',
        'deploy',
        request.config.functionName ?? '',
        '--project-ref',
        request.config.projectRef ?? '',
      ];
      return {
        executable: 'supabase',
        args,
        display: 'supabase functions deploy <function> --project-ref <project>',
      };
    }
    const args = [
      'workflow',
      'run',
      request.config.pagesWorkflow ?? '',
      '-f',
      `environment=${request.environment}`,
    ];
    return { executable: 'gh', args, display: 'gh workflow run <pages-workflow>' };
  }

  private knownUrl(request: DeployRequest): string | null {
    if (
      request.provider === 'supabase' &&
      request.config.projectRef &&
      request.config.functionName
    ) {
      return `https://${request.config.projectRef}.supabase.co/functions/v1/${request.config.functionName}`;
    }
    return null;
  }

  private record(
    id: string,
    request: DeployRequest,
    status: DeployRecord['status'],
    url: string | null,
    startedAt: string,
    summary: string,
  ): DeployRecord {
    return {
      id,
      provider: request.provider,
      environment: request.environment,
      status,
      url,
      startedAt,
      finishedAt: new Date().toISOString(),
      summary,
    };
  }

  private historyPath(workspacePath: string): string {
    return path.join(workspacePath, '.visualnscode', 'deploy-history.json');
  }

  private async save(workspacePath: string, record: DeployRecord): Promise<void> {
    const destination = this.historyPath(workspacePath);
    await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    const previous = await this.history(workspacePath);
    await fs.writeFile(
      destination,
      `${JSON.stringify([record, ...previous].slice(0, 100), null, 2)}\n`,
      { mode: 0o600 },
    );
  }
}
