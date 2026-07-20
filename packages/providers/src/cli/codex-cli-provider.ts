import type { AgentInput, ProviderDescriptor } from '../types';
import { CliProvider, type CliProviderOptions } from './cli-provider';

export class CodexCliProvider extends CliProvider {
  constructor(descriptor: ProviderDescriptor, options?: CliProviderOptions) {
    super(descriptor, 'codex', options);
  }

  protected buildArguments(prompt: string, input: AgentInput): readonly string[] {
    return [
      'exec',
      '--json',
      '--sandbox',
      'read-only',
      '--ephemeral',
      '--color',
      'never',
      ...(input.model !== 'default' ? ['--model', input.model] : []),
      prompt,
    ];
  }
}
