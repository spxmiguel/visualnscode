import { accessSync, constants, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, dirname, isAbsolute, join } from 'node:path';

const executableExtensions = (): readonly string[] => {
  if (process.platform !== 'win32') return [''];
  const configured = process.env.PATHEXT?.split(delimiter).filter(Boolean) ?? [];
  return configured.length > 0 ? configured : ['.EXE', '.CMD', '.BAT', '.COM'];
};

const nvmBins = (): readonly string[] => {
  try {
    const root = join(homedir(), '.nvm', 'versions', 'node');
    return readdirSync(root)
      .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }))
      .map((version) => join(root, version, 'bin'));
  } catch {
    return [];
  }
};

export const cliSearchDirectories = (): readonly string[] => {
  const home = homedir();
  const configured = (process.env.PATH ?? '').split(delimiter).filter(Boolean);
  const common =
    process.platform === 'win32'
      ? [
          process.env.APPDATA ? join(process.env.APPDATA, 'npm') : '',
          join(home, '.local', 'bin'),
          join(home, '.bun', 'bin'),
        ]
      : [
          '/opt/homebrew/bin',
          '/usr/local/bin',
          '/usr/bin',
          '/bin',
          join(home, '.local', 'bin'),
          join(home, '.npm-global', 'bin'),
          join(home, '.volta', 'bin'),
          join(home, '.asdf', 'shims'),
          join(home, '.bun', 'bin'),
          join(home, 'Library', 'pnpm'),
          join(home, '.local', 'share', 'pnpm'),
          ...nvmBins(),
        ];
  return [...new Set([...configured, ...common].filter(Boolean))];
};

const isExecutable = (candidate: string): boolean => {
  try {
    accessSync(candidate, process.platform === 'win32' ? constants.F_OK : constants.X_OK);
    return statSync(candidate).isFile();
  } catch {
    return false;
  }
};

export const resolveCliExecutable = (command: string): string | null => {
  if (isAbsolute(command) || command.includes('/') || command.includes('\\')) {
    return (
      executableExtensions()
        .map((extension) => `${command}${extension}`)
        .find(isExecutable) ?? null
    );
  }
  for (const directory of cliSearchDirectories()) {
    for (const extension of executableExtensions()) {
      const candidate = join(directory, `${command}${extension}`);
      if (isExecutable(candidate)) return candidate;
    }
  }
  return null;
};

export const cliEnvironment = (executable: string): Record<string, string> => {
  const allowed = [
    'APPDATA',
    'CODEX_HOME',
    'GEMINI_API_KEY',
    'HOME',
    'LANG',
    'LC_ALL',
    'LOCALAPPDATA',
    'OLLAMA_HOST',
    'OPENCODE_CONFIG',
    'SHELL',
    'TERM',
    'TMP',
    'TMPDIR',
    'USER',
    'USERPROFILE',
    'XDG_CONFIG_HOME',
    'XDG_DATA_HOME',
  ];
  const entries = allowed
    .map((key) => [key, process.env[key]] as const)
    .filter((entry): entry is readonly [string, string] => Boolean(entry[1]));
  entries.push([
    'PATH',
    [...new Set([dirname(executable), ...cliSearchDirectories()])].join(delimiter),
  ]);
  return Object.fromEntries(entries);
};
