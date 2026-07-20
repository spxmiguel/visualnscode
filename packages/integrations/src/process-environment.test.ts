import { describe, expect, it } from 'vitest';
import { createSafeProcessEnvironment } from './process-environment';

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

    expect(result).toEqual({
      PATH: '/usr/local/bin',
      HOME: '/Users/tester',
      SSH_AUTH_SOCK: '/tmp/ssh-agent.sock',
    });
  });

  it('adds only explicit service overrides', () => {
    const result = createSafeProcessEnvironment(
      { PATH: '/bin', SECRET: 'do-not-copy' },
      { CI: '1', FORCE_COLOR: '0', OMITTED: undefined },
    );

    expect(result).toEqual({ PATH: '/bin', CI: '1', FORCE_COLOR: '0' });
  });
});
