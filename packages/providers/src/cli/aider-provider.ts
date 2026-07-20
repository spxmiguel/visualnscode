import type { AgentInput, ProviderDescriptor } from '../types';
import { CliProvider, type CliProviderOptions } from './cli-provider';

export class AiderProvider extends CliProvider {
  constructor(descriptor: ProviderDescriptor, options?: CliProviderOptions) {
    super(descriptor, 'aider', options);
  }

  protected buildArguments(prompt: string, input: AgentInput): readonly string[] {
    return [
      '--dry-run',
      '--yes-always',
      ...(input.model !== 'default' ? ['--model', input.model] : []),
      '--message',
      prompt,
    ];
  }
}
