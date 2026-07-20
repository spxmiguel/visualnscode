import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cliEnvironment, resolveCliExecutable } from './cli-runtime';

describe('CLI runtime', () => {
  it('accepts an absolute executable path', () => {
    expect(resolveCliExecutable(process.execPath)).toBe(process.execPath);
  });

  it('builds a PATH that includes the resolved executable directory', () => {
    const environment = cliEnvironment(process.execPath);
    expect(environment.PATH?.split(process.platform === 'win32' ? ';' : ':')).toContain(
      dirname(process.execPath),
    );
  });

  it('does not resolve a missing CLI', () => {
    expect(resolveCliExecutable('visualnscode-definitely-missing-cli')).toBeNull();
  });
});
