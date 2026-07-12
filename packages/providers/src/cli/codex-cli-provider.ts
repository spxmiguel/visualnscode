import type { AgentInput, ProviderDescriptor } from '../types';
import { CliProvider } from './cli-provider';

export class CodexCliProvider extends CliProvider {
  constructor(descriptor: ProviderDescriptor) {
    super(descriptor, 'codex');
  }

  protected buildArguments(prompt: string, input: AgentInput): readonly string[] {
    return [
      'exec',
      '--json',
      '--sandbox',
      'read-only',
      ...(input.model !== 'default' ? ['--model', input.model] : []),
      prompt,
    ];
  }
}
