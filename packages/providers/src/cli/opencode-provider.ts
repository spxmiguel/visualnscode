import type { AgentInput, ProviderDescriptor } from '../types';
import { CliProvider } from './cli-provider';

export class OpenCodeProvider extends CliProvider {
  constructor(descriptor: ProviderDescriptor) {
    super(descriptor, 'opencode');
  }

  protected buildArguments(prompt: string, input: AgentInput): readonly string[] {
    return [
      'run',
      '--format',
      'json',
      ...(input.model !== 'default' ? ['--model', input.model] : []),
      prompt,
    ];
  }
}
