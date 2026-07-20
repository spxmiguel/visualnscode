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
): NodeJS.ProcessEnv => ({
  ...Object.fromEntries(
    SAFE_PROCESS_ENVIRONMENT_KEYS.flatMap((key) =>
      source[key] === undefined ? [] : [[key, source[key]]],
    ),
  ),
  ...Object.fromEntries(
    Object.entries(overrides).filter((entry): entry is [string, string] => entry[1] !== undefined),
  ),
});
