import type { AgentInput, ProviderDescriptor } from '../types';
import { CliProvider, type CliProviderOptions } from './cli-provider';

export class GeminiCliProvider extends CliProvider {
  constructor(descriptor: ProviderDescriptor, options?: CliProviderOptions) {
    super(descriptor, 'gemini', options);
  }

  protected buildArguments(prompt: string, input: AgentInput): readonly string[] {
    return [
      '--prompt',
      prompt,
      '--output-format',
      'json',
      ...(input.model !== 'default' ? ['--model', input.model] : []),
    ];
  }
}
