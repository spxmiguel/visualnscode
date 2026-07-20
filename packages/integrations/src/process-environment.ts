const SAFE_PROCESS_ENVIRONMENT_KEYS = [
  'PATH',
  'HOME',
  'USERPROFILE',
  'APPDATA',
  'LOCALAPPDATA',
  'SHELL',
  'COMSPEC',
  'SystemRoot',
  'WINDIR',
  'PATHEXT',
  'TMPDIR',
  'TMP',
  'TEMP',
  'USER',
  'LOGNAME',
  'LANG',
  'LANGUAGE',
  'LC_ALL',
  'TERM',
  'COLORTERM',
  'SSH_AUTH_SOCK',
  'GPG_TTY',
] as const;

/**
 * Builds the environment passed to local tools and workspace processes.
 *
 * Inheriting `process.env` would expose API keys and CI credentials to package
 * lifecycle scripts or an untrusted project. Keep this list intentionally
 * narrow; integrations that need credentials must use their authenticated CLI
 * store or the operating system credential vault.
 */
export const createSafeProcessEnvironment = (
  source: NodeJS.ProcessEnv = process.env,
  overrides: Readonly<Record<string, string | undefined>> = {},
): NodeJS.ProcessEnv => {
  const safe = Object.fromEntries(
    SAFE_PROCESS_ENVIRONMENT_KEYS.flatMap((key) =>
      source[key] === undefined ? [] : [[key, source[key]]],
    ),
  );
  const home = source.HOME ?? source.USERPROFILE ?? '';
  const nvmBins = (() => {
    if (!home || process.platform === 'win32') return [];
    try {
      return readdirSync(join(home, '.nvm', 'versions', 'node'))
        .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }))
        .map((version) => join(home, '.nvm', 'versions', 'node', version, 'bin'));
    } catch {
      return [];
    }
  })();
  const common =
    process.platform === 'win32'
      ? [source.APPDATA ? join(source.APPDATA, 'npm') : '', join(home, '.local', 'bin')]
      : [
          '/opt/homebrew/bin',
          '/usr/local/bin',
          '/usr/bin',
          '/bin',
          join(home, '.local', 'bin'),
          join(home, '.volta', 'bin'),
          join(home, '.asdf', 'shims'),
          join(home, '.bun', 'bin'),
          join(home, 'Library', 'pnpm'),
          join(home, '.local', 'share', 'pnpm'),
          ...nvmBins,
        ];
  safe.PATH = [...(source.PATH ?? '').split(delimiter), ...common]
    .filter(Boolean)
    .filter((entry, index, entries) => entries.indexOf(entry) === index)
    .join(delimiter);
  return {
    ...safe,
    ...Object.fromEntries(
      Object.entries(overrides).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    ),
  };
};
import { readdirSync } from 'node:fs';
import { delimiter, join } from 'node:path';
