import { DiffEditor } from '@monaco-editor/react';
import { Check, X } from 'lucide-react';
import { Button } from '@visualnscode/ui';
import { useAppStore } from '../store';

interface DiffViewerProps {
  readonly originalPath: string;
  readonly original: string;
  readonly modified: string;
  readonly onAccept: (content: string) => void;
  readonly onReject: () => void;
}

export function DiffViewer({ originalPath, original, modified, onAccept, onReject }: DiffViewerProps) {
  const theme = useAppStore((s) => s.theme);
  const ext = originalPath.split('.').pop() ?? 'plaintext';
  const languageMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', css: 'css', md: 'markdown', html: 'html', py: 'python',
  };
  const language = languageMap[ext] ?? 'plaintext';

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3">
        <span className="text-xs text-[rgb(var(--text-muted))]">
          Revisão de alterações — <span className="font-mono text-[rgb(var(--text))]">{originalPath}</span>
        </span>
        <div className="flex gap-2">
          <Button onClick={onReject} size="sm" variant="secondary">
            <X className="size-3" /> Rejeitar
          </Button>
          <Button onClick={() => onAccept(modified)} size="sm">
            <Check className="size-3" /> Aceitar
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <DiffEditor
          language={language}
          modified={modified}
          options={{
            automaticLayout: true,
            fontFamily: 'SFMono-Regular, Consolas, monospace',
            fontSize: 13,
            lineHeight: 21,
            readOnly: true,
            renderSideBySide: true,
          }}
          original={original}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
        />
      </div>
    </div>
  );
}
