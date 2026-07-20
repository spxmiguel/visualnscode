import anthropicIcon from '@lobehub/icons-static-svg/icons/claude.svg';
import claudeCodeIcon from '@lobehub/icons-static-svg/icons/claudecode.svg';
import codexIcon from '@lobehub/icons-static-svg/icons/codex.svg';
import geminiIcon from '@lobehub/icons-static-svg/icons/gemini.svg';
import geminiCliIcon from '@lobehub/icons-static-svg/icons/geminicli.svg';
import lmStudioIcon from '@lobehub/icons-static-svg/icons/lmstudio.svg';
import ollamaIcon from '@lobehub/icons-static-svg/icons/ollama.svg';
import openAiIcon from '@lobehub/icons-static-svg/icons/openai.svg';
import openCodeIcon from '@lobehub/icons-static-svg/icons/opencode.svg';
import openRouterIcon from '@lobehub/icons-static-svg/icons/openrouter.svg';
import { TerminalSquare } from 'lucide-react';

const providerIcons: Readonly<Record<string, string>> = {
  anthropic: anthropicIcon,
  'claude-cli': claudeCodeIcon,
  'codex-cli': codexIcon,
  gemini: geminiIcon,
  'gemini-cli': geminiCliIcon,
  lmstudio: lmStudioIcon,
  ollama: ollamaIcon,
  openai: openAiIcon,
  'openai-compatible': openAiIcon,
  opencode: openCodeIcon,
  openrouter: openRouterIcon,
};

interface ProviderIconProps {
  readonly className?: string;
  readonly providerId?: string | undefined;
}

export function ProviderIcon({ className = 'size-4', providerId = '' }: ProviderIconProps) {
  const icon = providerIcons[providerId];

  if (!icon) {
    return (
      <TerminalSquare
        aria-hidden="true"
        className={className}
        data-provider-icon={providerId || 'generic'}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      data-provider-icon={providerId}
      style={{
        maskImage: `url("${icon}")`,
        maskPosition: 'center',
        maskRepeat: 'no-repeat',
        maskSize: 'contain',
      }}
    />
  );
}
