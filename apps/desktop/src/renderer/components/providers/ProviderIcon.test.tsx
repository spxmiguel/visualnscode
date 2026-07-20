// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProviderIcon } from './ProviderIcon';

afterEach(() => cleanup());

describe('ProviderIcon', () => {
  it.each([
    'openai',
    'anthropic',
    'gemini',
    'openrouter',
    'ollama',
    'lmstudio',
    'openai-compatible',
    'claude-cli',
    'codex-cli',
    'gemini-cli',
    'opencode',
  ])('usa a marca correspondente para %s', (providerId) => {
    const { container } = render(<ProviderIcon providerId={providerId} />);
    expect(container.querySelector(`span[data-provider-icon="${providerId}"]`)).not.toBeNull();
  });

  it('usa o ícone de terminal para CLIs sem marca disponível', () => {
    const { container } = render(<ProviderIcon providerId="aider" />);
    expect(container.querySelector('svg[data-provider-icon="aider"]')).not.toBeNull();
  });
});
