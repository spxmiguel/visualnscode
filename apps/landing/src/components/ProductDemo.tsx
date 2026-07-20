import {
  Bot,
  ChevronRight,
  CirclePlay,
  Eye,
  FileCode2,
  Folder,
  GitBranch,
  PanelLeft,
  ShieldCheck,
} from 'lucide-react';
import { Container, SectionHeading } from './Primitives';

const code = [
  ["import { createAgent } from '@visualnscode/agents';", 'muted'],
  ['', 'muted'],
  ['const reviewer = createAgent({', 'plain'],
  ["  role: 'Reviewer',", 'accent'],
  ["  autonomy: 'guided',", 'accent'],
  ["  permissions: ['read', 'propose'],", 'accent'],
  ['});', 'plain'],
] as const;

export function ProductDemo() {
  return (
    <section
      className="scroll-mt-20 border-y border-[rgb(var(--line))] py-20 sm:py-28"
      id="product"
    >
      <Container>
        <SectionHeading
          align="center"
          description="Editor, chat, preview e automação trabalham sobre o mesmo projeto — sem esconder o que está acontecendo."
          index="01"
          label="Produto real"
          title="Uma bancada de desenvolvimento, não outra janela de chat."
        />
        <div className="demo-shell mt-12 overflow-hidden border border-[rgb(var(--line-strong))] bg-[rgb(var(--panel))] shadow-2xl shadow-black/10">
          <div className="flex h-11 items-center border-b border-[rgb(var(--line))] px-3">
            <div aria-hidden className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-[#ff6b68]" />
              <span className="size-2.5 rounded-full bg-[#f4bd4f]" />
              <span className="size-2.5 rounded-full bg-[#61c554]" />
            </div>
            <div className="mx-auto flex items-center gap-2 font-mono text-[10px] text-[rgb(var(--subtle))]">
              <ShieldCheck className="size-3" /> workspace / school-notes
            </div>
          </div>
          <div className="grid min-h-[420px] grid-cols-[44px_minmax(0,1fr)] sm:grid-cols-[44px_170px_minmax(0,1fr)] lg:grid-cols-[44px_180px_minmax(0,1fr)_270px]">
            <aside
              aria-label="Ferramentas da demonstração"
              className="flex flex-col items-center gap-1 border-r border-[rgb(var(--line))] py-2 text-[rgb(var(--subtle))]"
            >
              {[PanelLeft, FileCode2, GitBranch, Bot].map((Icon, index) => (
                <span
                  className={`grid size-8 place-items-center rounded-md ${index === 1 ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]' : ''}`}
                  key={index}
                >
                  <Icon className="size-4" />
                </span>
              ))}
            </aside>
            <aside className="hidden border-r border-[rgb(var(--line))] p-3 sm:block">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[rgb(var(--subtle))]">
                Important files
              </p>
              <div className="mt-4 space-y-1 font-mono text-[10px] text-[rgb(var(--muted))]">
                <p className="flex items-center gap-1">
                  <ChevronRight className="size-3" />
                  <Folder className="size-3 text-[rgb(var(--accent))]" /> src
                </p>
                <p className="rounded bg-[rgb(var(--accent-soft))] px-2 py-1 text-[rgb(var(--accent))]">
                  AgentTeam.tsx
                </p>
                <p className="px-2 py-1">providers.ts</p>
                <p className="px-2 py-1">permissions.ts</p>
                <p className="flex items-center gap-1 pt-2">
                  <ChevronRight className="size-3" />
                  <Folder className="size-3" /> tests
                </p>
              </div>
            </aside>
            <div className="min-w-0 bg-[rgb(var(--code))]">
              <div className="flex h-10 items-center border-b border-[rgb(var(--line))] px-4 font-mono text-[10px] text-[rgb(var(--muted))]">
                AgentTeam.tsx{' '}
                <span className="ml-2 size-1.5 rounded-full bg-[rgb(var(--accent))]" />
              </div>
              <div className="p-4 font-mono text-[11px] leading-7 sm:p-6 sm:text-xs">
                {code.map(([line, tone], index) => (
                  <div className="flex gap-4" key={index}>
                    <span className="w-3 select-none text-right text-[rgb(var(--subtle))]">
                      {index + 1}
                    </span>
                    <span
                      className={
                        tone === 'accent'
                          ? 'text-[rgb(var(--accent))]'
                          : tone === 'muted'
                            ? 'text-[rgb(var(--muted))]'
                            : 'text-[rgb(var(--ink))]'
                      }
                    >
                      {line || '\u00a0'}
                    </span>
                  </div>
                ))}
                <div className="mt-7 border-l-2 border-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))] px-4 py-3 text-[10px] leading-5 text-[rgb(var(--muted))]">
                  <span className="text-[rgb(var(--ink))]">Pending review</span>
                  <br />2 files · 4 blocks · $0.04 estimated
                </div>
              </div>
            </div>
            <aside className="hidden border-l border-[rgb(var(--line))] lg:flex lg:flex-col">
              <div className="flex h-10 border-b border-[rgb(var(--line))] font-mono text-[9px]">
                <span className="grid flex-1 place-items-center border-b border-[rgb(var(--accent))] text-[rgb(var(--ink))]">
                  <Bot className="mr-1 inline size-3" /> CHAT
                </span>
                <span className="grid flex-1 place-items-center text-[rgb(var(--subtle))]">
                  <Eye className="mr-1 inline size-3" /> PREVIEW
                </span>
              </div>
              <div className="flex-1 space-y-4 p-4 text-[11px] leading-5">
                <div className="max-w-[90%] border border-[rgb(var(--line))] bg-[rgb(var(--page))] p-3">
                  Vou revisar o fluxo sem editar nenhum arquivo silenciosamente.
                </div>
                <div className="ml-auto max-w-[85%] bg-[rgb(var(--ink))] p-3 text-[rgb(var(--page))]">
                  Valide também as permissões.
                </div>
                <div className="border-l-2 border-emerald-500 bg-emerald-500/5 p-3 text-[rgb(var(--muted))]">
                  Permissões validadas.
                  <br />
                  <span className="font-mono text-[9px] text-emerald-700 dark:text-emerald-400">
                    READY FOR REVIEW
                  </span>
                </div>
              </div>
              <div className="border-t border-[rgb(var(--line))] p-3">
                <div className="flex items-center border border-[rgb(var(--line-strong))] bg-[rgb(var(--page))] px-3 py-2 text-[10px] text-[rgb(var(--subtle))]">
                  Pergunte sobre o projeto…
                  <CirclePlay className="ml-auto size-4 text-[rgb(var(--accent))]" />
                </div>
              </div>
            </aside>
          </div>
          <div className="flex h-7 items-center justify-between bg-[rgb(var(--accent))] px-3 font-mono text-[9px] text-[rgb(var(--page))]">
            <span>main · clean</span>
            <span>Guided mode · Local context</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
