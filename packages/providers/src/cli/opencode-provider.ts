import type { AgentInput, ProviderDescriptor } from '../types';
import { CliProvider, type CliProviderOptions } from './cli-provider';

export class OpenCodeProvider extends CliProvider {
  constructor(descriptor: ProviderDescriptor, options?: CliProviderOptions) {
    super(descriptor, 'opencode', options);
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
