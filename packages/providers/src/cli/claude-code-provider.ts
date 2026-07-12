import type { AgentInput, ProviderDescriptor } from '../types';
import { CliProvider } from './cli-provider';

export class ClaudeCodeProvider extends CliProvider {
  constructor(descriptor: ProviderDescriptor) {
    super(descriptor, 'claude');
  }

  protected buildArguments(prompt: string, input: AgentInput): readonly string[] {
    return [
      '--print',
      '--output-format',
      'stream-json',
      ...(input.model !== 'default' ? ['--model', input.model] : []),
      prompt,
    ];
  }
}
