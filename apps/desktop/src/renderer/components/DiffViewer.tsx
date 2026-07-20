import Editor, { DiffEditor } from '@monaco-editor/react';
import { Columns2, FilePenLine, Rows3 } from 'lucide-react';
import { Button } from '@visualnscode/ui';
import type { ReviewFileChange } from '../../shared/edit-model';
import { useResolvedTheme } from '../theme';

interface DiffViewerProps {
  readonly file: ReviewFileChange;
  readonly editedContent: string;
  readonly editing: boolean;
  readonly selectedBlockIds: ReadonlySet<string>;
  readonly view: 'side-by-side' | 'unified';
  readonly onEditedContentChange: (content: string) => void;
  readonly onEditingChange: (editing: boolean) => void;
  readonly onToggleBlock: (blockId: string) => void;
  readonly onViewChange: (view: 'side-by-side' | 'unified') => void;
}

const languageForPath = (filePath: string): string => {
  const extension = filePath.split('.').pop() ?? 'plaintext';
  return (
    {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      css: 'css',
      md: 'markdown',
      html: 'html',
      py: 'python',
    }[extension] ?? 'plaintext'
  );
};

export function DiffViewer({
  editedContent,
  editing,
  file,
  onEditedContentChange,
  onEditingChange,
  onToggleBlock,
  onViewChange,
  selectedBlockIds,
  view,
}: DiffViewerProps) {
  const theme = useResolvedTheme();
  const language = languageForPath(file.path);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1">
        <span className="truncate text-xs text-[rgb(var(--text-muted))]">
          Revisando <span className="font-mono text-[rgb(var(--text))]">{file.path}</span>
        </span>
        <div className="flex items-center gap-1">
          <Button
            aria-pressed={view === 'side-by-side'}
            onClick={() => onViewChange('side-by-side')}
            size="sm"
            variant={view === 'side-by-side' ? 'primary' : 'secondary'}
          >
            <Columns2 className="size-3" /> Lado a lado
          </Button>
          <Button
            aria-pressed={view === 'unified'}
            onClick={() => onViewChange('unified')}
            size="sm"
            variant={view === 'unified' ? 'primary' : 'secondary'}
          >
            <Rows3 className="size-3" /> Unificado
          </Button>
          <Button
            aria-pressed={editing}
            onClick={() => onEditingChange(!editing)}
            size="sm"
            variant={editing ? 'primary' : 'secondary'}
          >
            <FilePenLine className="size-3" /> Editar antes
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(150px,210px)_1fr]">
        <aside className="overflow-auto border-r border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))] p-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
            Blocos
          </p>
          <div className="space-y-1.5">
            {file.blocks.map((block, index) => (
              <label
                className="flex cursor-pointer gap-2 rounded-md border border-[rgb(var(--border))] p-2 text-[11px] hover:bg-[rgb(var(--surface-hover))]"
                key={block.id}
              >
                <input
                  aria-label={`Selecionar bloco ${index + 1} de ${file.path}`}
                  checked={selectedBlockIds.has(block.id)}
                  className="mt-0.5 accent-[rgb(var(--accent))]"
                  disabled={editing}
                  onChange={() => onToggleBlock(block.id)}
                  type="checkbox"
                />
                <span>
                  <span className="block font-medium text-[rgb(var(--text))]">
                    Bloco {index + 1}
                  </span>
                  <span className="text-[rgb(var(--text-subtle))]">
                    linha {block.originalStart} · -{block.originalLines.length} +
                    {block.modifiedLines.length}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {editing ? (
            <p className="mt-3 text-[10px] leading-4 text-amber-500">
              A versão editada substitui a seleção por blocos antes de aplicar.
            </p>
          ) : null}
        </aside>

        <div className="min-h-0 overflow-auto bg-[rgb(var(--background))]">
          {editing ? (
            <Editor
              language={language}
              onChange={(value) => onEditedContentChange(value ?? '')}
              options={{
                automaticLayout: true,
                fontFamily: 'SFMono-Regular, Consolas, monospace',
                fontSize: 13,
                lineHeight: 21,
                minimap: { enabled: false },
                padding: { top: 12 },
                scrollBeyondLastLine: false,
              }}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={editedContent}
            />
          ) : view === 'side-by-side' ? (
            <DiffEditor
              language={language}
              modified={file.modified}
              options={{
                automaticLayout: true,
                fontFamily: 'SFMono-Regular, Consolas, monospace',
                fontSize: 13,
                lineHeight: 21,
                readOnly: true,
                renderSideBySide: true,
              }}
              original={file.original}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
            />
          ) : (
            <pre className="min-h-full whitespace-pre-wrap p-4 font-mono text-xs leading-5 text-[rgb(var(--text-muted))]">
              {file.unifiedDiff}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
