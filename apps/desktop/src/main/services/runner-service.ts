import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createSafeProcessEnvironment } from '@visualnscode/integrations';
import type {
  PackageManager,
  ProjectRuntime,
  RunnerEvent,
  RuntimeAction,
} from '../../shared/runtime';

interface PackageJson {
  readonly scripts?: Readonly<Record<string, string>>;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly packageManager?: string;
}

interface CommandSpec {
  readonly executable: string;
  readonly args: readonly string[];
  readonly display: string;
}

const URL_RE = /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?[^\s"']*/iu;
const STATIC_SERVER = String.raw`
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=process.cwd(),port=Number(process.argv[1]);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const target=path.resolve(root,'.'+pathname);if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403).end('Forbidden');return}fs.stat(target,(error,stat)=>{let file=target;if(!error&&stat.isDirectory())file=path.join(target,'index.html');fs.readFile(file,(readError,data)=>{if(readError){fs.readFile(path.join(root,'index.html'),(fallbackError,fallback)=>{if(fallbackError)res.writeHead(404).end('Not found');else res.writeHead(200,{'content-type':'text/html; charset=utf-8'}).end(fallback)})}else res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'}).end(data)})})}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));
`;

const exists = (filePath: string): Promise<boolean> =>
  fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

const publicCommand = (action: RuntimeAction, display: string) => ({
  action,
  display,
  label: {
    install: 'Instalar dependências',
    dev: 'Iniciar projeto',
    build: 'Gerar build',
    test: 'Executar testes',
  }[action],
});

const parsePort = (command: string, fallback: number): number => {
  const match = command.match(/(?:--port(?:=|\s+)|(?:^|\s)-p\s+|PORT=)(\d{2,5})/u);
  return match?.[1] ? Number(match[1]) : fallback;
};

export class RunnerService {
  private readonly processes = new Map<string, ChildProcess>();
  private readonly listeners = new Map<string, (event: RunnerEvent) => void>();

  async detectProject(workspacePath: string): Promise<ProjectRuntime> {
    const packagePath = path.join(workspacePath, 'package.json');
    if (await exists(packagePath)) return this.detectNode(workspacePath, packagePath);

    const python = await this.detectPython(workspacePath);
    if (python) return python;

    if (await exists(path.join(workspacePath, 'index.html'))) {
      const display = 'VisualnsCode static preview';
      return this.result('static', 'none', 'Static HTML', 4173, {
        dev: publicCommand('dev', display),
      });
    }

    return this.result('unknown', 'none', null, null, {});
  }

  async start(
    processId: string,
    workspacePath: string,
    action: RuntimeAction,
    onEvent: (event: RunnerEvent) => void,
  ): Promise<void> {
    await this.stop(processId);
    const runtime = await this.detectProject(workspacePath);
    const spec = this.resolveCommand(runtime, action);
    if (!spec) {
      onEvent({
        type: 'error',
        processId,
        payload: `Ação ${action} não disponível neste projeto.`,
      });
      return;
    }

    const child = spawn(spec.executable, [...spec.args], {
      cwd: workspacePath,
      env: createSafeProcessEnvironment(process.env, {
        FORCE_COLOR: '1',
        ELECTRON_RUN_AS_NODE: runtime.kind === 'static' ? '1' : undefined,
      }),
      shell: false,
      windowsHide: true,
    });
    this.processes.set(processId, child);
    this.listeners.set(processId, onEvent);
    onEvent({ type: 'started', processId, payload: spec.display });

    const output = (type: 'log' | 'error', data: Buffer): void => {
      const payload = data.toString();
      onEvent({ type, processId, payload });
      const url = payload.match(URL_RE)?.[0];
      if (url) onEvent({ type: 'url', processId, payload: url });
    };
    child.stdout?.on('data', (data: Buffer) => output('log', data));
    child.stderr?.on('data', (data: Buffer) => output('error', data));
    child.on('error', (error) => output('error', Buffer.from(error.message)));
    child.on('close', (code) => {
      if (this.processes.get(processId) === child) {
        this.processes.delete(processId);
        this.listeners.delete(processId);
      }
      onEvent({ type: 'stopped', processId, payload: String(code ?? 0) });
    });
  }

  async restart(processId: string, workspacePath: string, action: RuntimeAction): Promise<void> {
    const listener = this.listeners.get(processId);
    if (!listener) throw new Error('O processo ainda não foi iniciado.');
    await this.start(processId, workspacePath, action, listener);
  }

  async stop(processId: string): Promise<void> {
    const child = this.processes.get(processId);
    if (!child) return;
    this.processes.delete(processId);
    this.listeners.delete(processId);
    child.kill('SIGTERM');
  }

  async stopAll(): Promise<void> {
    await Promise.all([...this.processes.keys()].map((id) => this.stop(id)));
  }

  isRunning(processId: string): boolean {
    return this.processes.has(processId);
  }

  private async detectNode(workspacePath: string, packagePath: string): Promise<ProjectRuntime> {
    const pkg = JSON.parse(await fs.readFile(packagePath, 'utf8')) as PackageJson;
    const scripts = pkg.scripts ?? {};
    const manager = await this.detectManager(workspacePath, pkg.packageManager);
    const prefix = manager === 'npm' ? 'npm run' : `${manager} run`;
    const install = `${manager} install`;
    const devScript = scripts['dev'] ? 'dev' : scripts['start'] ? 'start' : null;
    const dev = devScript ? `${prefix} ${devScript}` : '';
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const framework = allDeps['next']
      ? 'Next.js'
      : allDeps['vite']
        ? 'Vite'
        : allDeps['astro']
          ? 'Astro'
          : allDeps['react-scripts']
            ? 'Create React App'
            : 'Node.js';
    const fallbackPort = framework === 'Vite' ? 5173 : framework === 'Astro' ? 4321 : 3000;
    const commands: ProjectRuntime['commands'] = {
      install: publicCommand('install', install),
      ...(dev ? { dev: publicCommand('dev', dev) } : {}),
      ...(scripts['build'] ? { build: publicCommand('build', `${prefix} build`) } : {}),
      ...(scripts['test'] ? { test: publicCommand('test', `${prefix} test`) } : {}),
    };
    return this.result(
      'node',
      manager,
      framework,
      dev ? parsePort(scripts[devScript!] ?? '', fallbackPort) : null,
      commands,
    );
  }

  private async detectPython(workspacePath: string): Promise<ProjectRuntime | null> {
    const filenames = [
      'pyproject.toml',
      'requirements.txt',
      'Pipfile',
      'manage.py',
      'main.py',
      'app.py',
    ];
    const present = await Promise.all(
      filenames.map((name) => exists(path.join(workspacePath, name))),
    );
    if (!present.some(Boolean)) return null;
    const contents = (
      await Promise.all(
        filenames
          .slice(0, 3)
          .map(async (name) =>
            (await exists(path.join(workspacePath, name)))
              ? fs.readFile(path.join(workspacePath, name), 'utf8').catch(() => '')
              : '',
          ),
      )
    ).join('\n');
    const django = present[3] || /django/iu.test(contents);
    const flask = /flask/iu.test(contents);
    const uvicorn = /uvicorn|fastapi/iu.test(contents);
    const entry = present[4] ? 'main.py' : present[5] ? 'app.py' : null;
    const dev = django
      ? 'python3 manage.py runserver 8000'
      : flask
        ? 'python3 -m flask --app app run --port 5000'
        : uvicorn
          ? 'python3 -m uvicorn main:app --reload --port 8000'
          : entry
            ? `python3 ${entry}`
            : null;
    const port = flask ? 5000 : 8000;
    const install = present[1]
      ? 'python3 -m pip install -r requirements.txt'
      : present[0]
        ? 'python3 -m pip install .'
        : '';
    return this.result(
      'python',
      'python',
      django ? 'Django' : flask ? 'Flask' : uvicorn ? 'FastAPI' : 'Python',
      port,
      {
        ...(install ? { install: publicCommand('install', install) } : {}),
        ...(dev ? { dev: publicCommand('dev', dev) } : {}),
        test: publicCommand('test', 'python3 -m pytest'),
      },
    );
  }

  private async detectManager(workspacePath: string, declared?: string): Promise<PackageManager> {
    if (await exists(path.join(workspacePath, 'pnpm-lock.yaml'))) return 'pnpm';
    if (await exists(path.join(workspacePath, 'yarn.lock'))) return 'yarn';
    if (
      (await exists(path.join(workspacePath, 'bun.lock'))) ||
      (await exists(path.join(workspacePath, 'bun.lockb')))
    )
      return 'bun';
    if (await exists(path.join(workspacePath, 'package-lock.json'))) return 'npm';
    const name = declared?.split('@')[0];
    return name === 'pnpm' || name === 'yarn' || name === 'bun' || name === 'npm' ? name : 'npm';
  }

  private resolveCommand(runtime: ProjectRuntime, action: RuntimeAction): CommandSpec | null {
    const command = runtime.commands[action];
    if (!command) return null;
    if (runtime.kind === 'static' && action === 'dev') {
      return {
        executable: process.execPath,
        args: ['-e', STATIC_SERVER, String(runtime.port ?? 4173)],
        display: command.display,
      };
    }
    const parts = command.display.split(/\s+/u);
    const executable = parts.shift();
    return executable ? { executable, args: parts, display: command.display } : null;
  }

  private result(
    kind: ProjectRuntime['kind'],
    manager: PackageManager,
    framework: string | null,
    port: number | null,
    commands: ProjectRuntime['commands'],
  ): ProjectRuntime {
    return {
      kind,
      manager,
      framework,
      port,
      commands,
      installCommand: commands.install?.display ?? '',
      devCommand: commands.dev?.display ?? '',
      buildCommand: commands.build?.display ?? '',
      testCommand: commands.test?.display ?? '',
    };
  }
}
