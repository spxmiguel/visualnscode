import type { AgentInput, ProviderDescriptor } from '../types';
import { CliProvider } from './cli-provider';

export class GeminiCliProvider extends CliProvider {
  constructor(descriptor: ProviderDescriptor) {
    super(descriptor, 'gemini');
  }

  protected buildArguments(prompt: string, input: AgentInput): readonly string[] {
    return [
      '--output-format',
      'stream-json',
      ...(input.model !== 'default' ? ['--model', input.model] : []),
      prompt,
    ];
  }
}
