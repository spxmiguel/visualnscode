import type { AgentInput, ProviderDescriptor } from '../types';
import { CliProvider } from './cli-provider';

export class AiderProvider extends CliProvider {
  constructor(descriptor: ProviderDescriptor) {
    super(descriptor, 'aider');
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
