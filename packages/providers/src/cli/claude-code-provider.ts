import type { AgentInput, ProviderDescriptor } from '../types';
import { CliProvider, type CliProviderOptions } from './cli-provider';

export class ClaudeCodeProvider extends CliProvider {
  constructor(descriptor: ProviderDescriptor, options?: CliProviderOptions) {
    super(descriptor, 'claude', options);
  }

  protected buildArguments(prompt: string, input: AgentInput): readonly string[] {
    return [
      '--print',
      '--output-format',
      'stream-json',
      '--include-partial-messages',
      '--verbose',
      '--no-session-persistence',
      '--tools',
      '',
      ...(input.model !== 'default' ? ['--model', input.model] : []),
      prompt,
    ];
  }
}
