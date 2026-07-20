import { describe, expect, it } from 'vitest';
import {
  applicationExecutableDirectories,
  createSafeProcessEnvironment,
} from './process-environment';

describe('createSafeProcessEnvironment', () => {
  it('keeps operating system values and removes credentials', () => {
    const result = createSafeProcessEnvironment({
      PATH: '/usr/local/bin',
      HOME: '/Users/tester',
      SSH_AUTH_SOCK: '/tmp/ssh-agent.sock',
      GH_TOKEN: 'github-secret',
      OPENAI_API_KEY: 'openai-secret',
      VERCEL_TOKEN: 'vercel-secret',
    });

    expect(result.HOME).toBe('/Users/tester');
    expect(result.SSH_AUTH_SOCK).toBe('/tmp/ssh-agent.sock');
    expect(result.PATH?.split(process.platform === 'win32' ? ';' : ':')).toContain(
      '/usr/local/bin',
    );
    expect(result).not.toHaveProperty('GH_TOKEN');
    expect(result).not.toHaveProperty('OPENAI_API_KEY');
    expect(result).not.toHaveProperty('VERCEL_TOKEN');
  });

  it('adds only explicit service overrides', () => {
    const result = createSafeProcessEnvironment(
      { PATH: '/bin', SECRET: 'do-not-copy' },
      { CI: '1', FORCE_COLOR: '0', OMITTED: undefined },
    );

    expect(result.PATH?.split(process.platform === 'win32' ? ';' : ':')).toContain('/bin');
    expect(result).toMatchObject({ CI: '1', FORCE_COLOR: '0' });
    expect(result).not.toHaveProperty('SECRET');
  });

  it('adds application-bundled CLIs on macOS without affecting other platforms', () => {
    expect(applicationExecutableDirectories('darwin', '/Users/tester')).toEqual([
      '/Applications/ChatGPT.app/Contents/Resources',
      '/Users/tester/Applications/ChatGPT.app/Contents/Resources',
    ]);
    expect(applicationExecutableDirectories('win32', 'C:\\Users\\tester')).toEqual([]);
  });
});
