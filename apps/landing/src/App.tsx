import { useState } from 'react';

/* ─── constants ───────────────────────────────────────────────── */
const GITHUB = 'https://github.com/spxmiguel/visualnscode';

/* ─── tiny helpers ────────────────────────────────────────────── */
function Badge({ children }: { readonly children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-0.5 text-xs font-medium text-violet-300">
      {children}
    </span>
  );
}

function SectionLabel({ children }: { readonly children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">
      {children}
    </p>
  );
}

function GradientText({ children }: { readonly children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-300 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

/* ─── Navigation ──────────────────────────────────────────────── */
function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <a className="flex items-center gap-2.5" href="#">
          <LogoMark />
          <span className="text-sm font-semibold tracking-tight text-white">VisualnsCode</span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {['Features', 'Agents', 'Roadmap', 'FAQ'].map((item) => (
            <a
              className="text-sm text-zinc-400 transition hover:text-white"
              href={`#${item.toLowerCase()}`}
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 md:flex"
            href={GITHUB}
            rel="noopener noreferrer"
            target="_blank"
          >
            <GitHubIcon />
            GitHub
          </a>
          <button
            className="flex size-9 items-center justify-center rounded-lg text-zinc-400 md:hidden"
            onClick={() => setOpen(!open)}
            type="button"
          >
            <svg fill="none" height="18" viewBox="0 0 18 18" width="18">
              <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/5 bg-zinc-950 px-5 py-4 md:hidden">
          {['Features', 'Agents', 'Roadmap', 'FAQ', 'GitHub'].map((item) => (
            <a
              className="block py-2.5 text-sm text-zinc-400"
              href={item === 'GitHub' ? GITHUB : `#${item.toLowerCase()}`}
              key={item}
              onClick={() => setOpen(false)}
            >
              {item}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  );
}

/* ─── Hero ────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-28 md:pb-28 md:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,92,246,0.18) 0%, transparent 70%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: 'auto, 56px 56px, 56px 56px',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <Badge>
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Open source · Em desenvolvimento ativo
            </Badge>
          </div>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
            Build with every AI. <GradientText>Manage everything from one place.</GradientText>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            VisualnsCode unifica agentes de IA, modelos locais, ferramentas de deploy e um editor
            poderoso em um único workspace — com modo simples para quem está começando e controle
            total para quem quer ir fundo.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-500 sm:w-auto"
              href={GITHUB}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GitHubIcon />
              Ver no GitHub
            </a>
            <a
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              href="#features"
            >
              Ver funcionalidades →
            </a>
          </div>
        </div>

        <div className="relative mt-16 md:mt-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 rounded-3xl"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(124,92,246,0.15) 0%, transparent 60%)',
            }}
          />
          <IDEMockup />
        </div>
      </div>
    </section>
  );
}

/* ─── IDE Mockup ──────────────────────────────────────────────── */
function IDEMockup() {
  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50">
      <div className="flex h-10 items-center gap-2 border-b border-white/5 bg-zinc-950/80 px-4">
        <span className="size-3 rounded-full bg-red-500/80" />
        <span className="size-3 rounded-full bg-amber-500/80" />
        <span className="size-3 rounded-full bg-emerald-500/80" />
        <div className="mx-auto flex items-center gap-2 rounded-md bg-zinc-800/60 px-3 py-1">
          <span className="text-[10px] text-zinc-400">spxmiguel / meu-projeto</span>
        </div>
      </div>

      <div className="flex h-[420px] md:h-[460px]">
        <div className="flex w-12 flex-col items-center gap-1 border-r border-white/5 bg-zinc-950/50 pt-2">
          {[MockFilesIcon, MockSearchIcon, MockGitIcon, MockSettingsIcon].map((Icon, i) => (
            <button
              className={`flex size-9 items-center justify-center rounded-lg transition ${i === 0 ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
              key={i}
              type="button"
            >
              <Icon />
            </button>
          ))}
        </div>

        <div className="hidden w-44 shrink-0 border-r border-white/5 bg-zinc-950/30 p-2 font-mono text-[11px] sm:block">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Explorer
          </p>
          {[
            { label: 'src', indent: 0, folder: true, open: true },
            { label: 'App.tsx', indent: 1, active: true },
            { label: 'index.ts', indent: 1 },
            { label: 'styles.css', indent: 1 },
            { label: 'components', indent: 1, folder: true },
            { label: 'Hero.tsx', indent: 2 },
            { label: 'package.json', indent: 0 },
          ].map((f, i) => (
            <div
              className={`flex items-center gap-1.5 rounded py-0.5 ${f.active ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-600'}`}
              key={i}
              style={{ paddingLeft: f.indent * 10 + 8 }}
            >
              {f.folder ? (
                <span className="text-violet-500">{f.open ? '▾' : '▸'}</span>
              ) : (
                <span className="size-1 shrink-0 rounded-full bg-current opacity-40" />
              )}
              {f.label}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1 overflow-hidden bg-zinc-900 font-mono text-[12px] leading-6">
          <div className="flex h-9 items-center gap-0 border-b border-white/5">
            <div className="flex h-full items-center gap-2 border-r border-violet-500/40 bg-zinc-950/50 px-4 text-[11px] text-violet-300">
              App.tsx
            </div>
            <div className="flex h-full items-center gap-2 px-4 text-[11px] text-zinc-600">
              package.json
            </div>
          </div>
          <div className="overflow-hidden p-4">
            {[
              { n: 1, segs: [{ t: "import { useState } from 'react'", c: 'text-zinc-500' }] },
              {
                n: 2,
                segs: [{ t: "import { AIProvider } from './providers'", c: 'text-zinc-500' }],
              },
              { n: 3, segs: [{ t: '', c: '' }] },
              {
                n: 4,
                segs: [
                  { t: 'export function ', c: 'text-violet-400' },
                  { t: 'App', c: 'text-cyan-300' },
                  { t: '() {', c: 'text-zinc-400' },
                ],
              },
              {
                n: 5,
                segs: [
                  { t: '  const ', c: 'text-violet-400' },
                  { t: '[msg, setMsg]', c: 'text-cyan-300' },
                  { t: ' = ', c: 'text-zinc-500' },
                  { t: 'useState', c: 'text-yellow-300' },
                  { t: "('')", c: 'text-zinc-500' },
                ],
              },
              {
                n: 6,
                segs: [
                  { t: '  const ', c: 'text-violet-400' },
                  { t: 'ai', c: 'text-cyan-300' },
                  { t: ' = new ', c: 'text-zinc-500' },
                  { t: 'AIProvider', c: 'text-yellow-300' },
                  { t: '({ model: ', c: 'text-zinc-500' },
                  { t: "'claude-sonnet'", c: 'text-emerald-400' },
                  { t: ' })', c: 'text-zinc-500' },
                ],
              },
              { n: 7, segs: [{ t: '', c: '' }] },
              {
                n: 8,
                segs: [
                  { t: '  return ', c: 'text-violet-400' },
                  { t: '<App ', c: 'text-red-400' },
                  { t: 'ai', c: 'text-cyan-300' },
                  { t: '={ai} />', c: 'text-red-400' },
                ],
              },
              { n: 9, segs: [{ t: '}', c: 'text-zinc-500' }] },
            ].map((line) => (
              <div className="flex gap-4" key={line.n}>
                <span className="w-4 shrink-0 select-none text-right text-zinc-700">{line.n}</span>
                <span>
                  {line.segs.map((seg, i) => (
                    <span className={seg.c} key={i}>
                      {seg.t}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden w-64 shrink-0 flex-col border-l border-white/5 bg-zinc-950/50 lg:flex">
          <div className="flex h-9 items-center gap-1 border-b border-white/5 p-1">
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-zinc-800 py-1 text-[11px] text-white">
              <MockBotIcon /> Chat
            </button>
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-[11px] text-zinc-600">
              <MockEyeIcon /> Preview
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-hidden p-3">
            <div className="flex gap-2">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white">
                AI
              </span>
              <div className="rounded-xl rounded-tl-sm bg-zinc-800/80 px-3 py-2 text-[11px] leading-5 text-zinc-300">
                Detectei React 19. Quer que eu revise a estrutura do componente?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="rounded-xl rounded-tr-sm bg-violet-600/80 px-3 py-2 text-[11px] leading-5 text-white">
                Sim, adiciona tipagem TypeScript.
              </div>
            </div>
            <div className="flex gap-2">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white">
                AI
              </span>
              <div className="rounded-xl rounded-tl-sm bg-zinc-800/80 px-3 py-2 text-[11px] leading-5 text-zinc-300">
                <span className="mb-1 block text-[10px] text-violet-400">3 arquivos editados</span>
                Tipagem adicionada. Zero any, tudo estrito.
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 p-2">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2">
              <span className="min-w-0 flex-1 text-[11px] text-zinc-600">Pergunte ao agente…</span>
              <span className="text-[10px] text-violet-400">⌘↵</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-6 items-center justify-between border-t border-white/5 bg-violet-700/80 px-3 font-mono text-[10px] text-white/90">
        <div className="flex items-center gap-3">
          <span>main</span>
          <span>✓ 0 errors</span>
        </div>
        <div className="flex items-center gap-3">
          <span>TypeScript</span>
          <span>Claude Sonnet</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Integrations ────────────────────────────────────────────── */
const integrations = [
  { name: 'Claude', color: '#D97706' },
  { name: 'GPT-4o', color: '#10B981' },
  { name: 'Gemini', color: '#3B82F6' },
  { name: 'Ollama', color: '#8B5CF6' },
  { name: 'OpenRouter', color: '#EC4899' },
  { name: 'GitHub', color: '#94A3B8' },
  { name: 'Firebase', color: '#F59E0B' },
  { name: 'Supabase', color: '#22C55E' },
  { name: 'Vercel', color: '#E2E8F0' },
  { name: 'Aider', color: '#06B6D4' },
  { name: 'Codex CLI', color: '#84CC16' },
  { name: 'LM Studio', color: '#A78BFA' },
];

function Integrations() {
  const doubled = [...integrations, ...integrations];

  return (
    <section className="border-y border-white/5 bg-zinc-950/60 py-12">
      <p className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-zinc-600">
        Conecta com as ferramentas que você já usa
      </p>
      <div className="overflow-hidden">
        <div
          className="flex gap-3"
          style={{ animation: 'ticker 32s linear infinite', width: 'max-content' }}
        >
          {doubled.map((tool, i) => (
            <div
              className="flex shrink-0 items-center gap-2 rounded-xl border border-white/5 bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-400"
              key={i}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: tool.color }} />
              {tool.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ────────────────────────────────────────────────── */
const features = [
  {
    icon: '⚡',
    title: 'Multi-provider, zero lock-in',
    desc: 'Troque entre Claude, GPT, Gemini, Ollama e qualquer API compatível com OpenAI sem mudar uma linha do seu código.',
  },
  {
    icon: '🤖',
    title: 'Sistema de agentes',
    desc: 'Monte equipes de IA com papéis especializados — Architect, Frontend Dev, Reviewer, Tester — rodando em sequência ou em paralelo.',
  },
  {
    icon: '🎛️',
    title: 'Modo simples e avançado',
    desc: 'Iniciantes veem o essencial. Experientes acessam terminal, Git, diffs, logs e permissões — tudo de uma vez.',
  },
  {
    icon: '🔒',
    title: 'Segurança por padrão',
    desc: 'IA nunca altera arquivos silenciosamente. Cada mudança passa por diff, aprovação e checkpoint antes de ser gravada.',
  },
  {
    icon: '🚀',
    title: 'Deploy integrado',
    desc: 'Vercel, Firebase, Supabase e GitHub Pages num fluxo único — do build ao link de produção, com confirmação explícita.',
  },
  {
    icon: '🛠️',
    title: 'Onboarding automático',
    desc: 'Detecta Git, Node, pnpm, CLIs e providers de IA instalados e guia o usuário pelo ambiente sem comandos manuais.',
  },
];

function Features() {
  return (
    <section className="py-24" id="features">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Funcionalidades</SectionLabel>
          <h2 className="text-4xl font-bold tracking-tight text-white">
            Tudo o que você precisa, <GradientText>em um lugar só</GradientText>
          </h2>
          <p className="mt-4 text-zinc-400">
            Do setup do ambiente ao deploy em produção, sem trocar de janela.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60 p-6 transition hover:border-violet-500/30 hover:bg-zinc-900"
              key={f.title}
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(ellipse at 0% 0%, rgba(124,92,246,0.07) 0%, transparent 70%)',
                }}
              />
              <div className="relative">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Modes ───────────────────────────────────────────────────── */
const simpleItems = [
  'Editor de código limpo',
  'Chat com IA integrado',
  'Preview em tempo real',
  'Botão de executar',
  'Desfazer alterações',
];
const advancedItems = [
  'Terminal com node-pty',
  'Painel Git com histórico',
  'Diff lado a lado',
  'Logs e painel de tasks',
  'Agentes e workflows',
  'Permissões granulares',
  'Deploy via CLI',
];

function Modes() {
  const [active, setActive] = useState<'simple' | 'advanced'>('simple');

  return (
    <section className="py-24" id="modes">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Modos</SectionLabel>
          <h2 className="text-4xl font-bold tracking-tight text-white">
            Simples pra começar. <GradientText>Poderoso pra escalar.</GradientText>
          </h2>
          <p className="mt-4 text-zinc-400">
            Um botão muda tudo — sem forçar o usuário a aprender o que ele não precisa agora.
          </p>
        </div>

        <div className="mt-12">
          <div className="mx-auto mb-8 flex w-fit rounded-xl border border-white/10 bg-zinc-900/60 p-1">
            {(['simple', 'advanced'] as const).map((m) => (
              <button
                className={`rounded-lg px-6 py-2 text-sm font-medium transition ${active === m ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                key={m}
                onClick={() => setActive(m)}
                type="button"
              >
                {m === 'simple' ? 'Modo Simples' : 'Modo Avançado'}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
            <div className="border-b border-white/5 bg-zinc-950/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${active === 'simple' ? 'bg-emerald-400' : 'bg-violet-400'}`}
                />
                <span className="text-sm font-medium text-white">
                  {active === 'simple' ? 'Modo Simples' : 'Modo Avançado'}
                </span>
              </div>
            </div>
            <ul className="grid gap-2 p-6 sm:grid-cols-2">
              {(active === 'simple' ? simpleItems : advancedItems).map((item) => (
                <li className="flex items-center gap-3 text-sm text-zinc-300" key={item}>
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs ${active === 'simple' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-violet-500/15 text-violet-400'}`}
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Agents ──────────────────────────────────────────────────── */
const agentFlow = [
  { role: 'Architect', color: 'violet', desc: 'Define estrutura e decisões técnicas', emoji: '🏛️' },
  { role: 'Frontend Dev', color: 'blue', desc: 'Implementa componentes e UI', emoji: '⚛️' },
  { role: 'Reviewer', color: 'cyan', desc: 'Revisa código e aponta melhorias', emoji: '🔍' },
  { role: 'Tester', color: 'emerald', desc: 'Escreve e executa testes', emoji: '🧪' },
  { role: 'Docs Writer', color: 'amber', desc: 'Documenta o que foi construído', emoji: '📝' },
];

const agentColorCls: Record<string, string> = {
  violet: 'border-violet-500/30 bg-violet-500/8 text-violet-300',
  blue: 'border-blue-500/30 bg-blue-500/8 text-blue-300',
  cyan: 'border-cyan-500/30 bg-cyan-500/8 text-cyan-300',
  emerald: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-300',
  amber: 'border-amber-500/30 bg-amber-500/8 text-amber-300',
};

function Agents() {
  return (
    <section className="py-24" id="agents">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Sistema de Agentes</SectionLabel>
          <h2 className="text-4xl font-bold tracking-tight text-white">
            Monte sua própria <GradientText>equipe de IA</GradientText>
          </h2>
          <p className="mt-4 text-zinc-400">
            Agentes especializados trabalhando em sequência ou em paralelo, cada um com suas
            permissões, prompt de sistema e nível de autonomia.
          </p>
        </div>

        <div className="mt-16 flex flex-col items-center gap-3">
          {agentFlow.map((agent, i) => (
            <div className="flex w-full max-w-lg flex-col items-center gap-3" key={agent.role}>
              <div
                className={`flex w-full items-start gap-4 rounded-2xl border p-5 ${agentColorCls[agent.color]}`}
              >
                <span className="text-2xl">{agent.emoji}</span>
                <div>
                  <p className="font-semibold">{agent.role}</p>
                  <p className="mt-0.5 text-xs opacity-60">{agent.desc}</p>
                </div>
              </div>
              {i < agentFlow.length - 1 ? (
                <svg fill="none" height="20" viewBox="0 0 20 20" width="20">
                  <path d="M10 2v14M4 12l6 6 6-6" stroke="#4B5563" strokeWidth="1.5" />
                </svg>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-6 sm:grid-cols-3">
          {[
            { label: 'Ask', desc: 'Pede aprovação para cada ação', emoji: '🙋' },
            { label: 'Guided', desc: 'Executa o seguro, pergunta o importante', emoji: '🧭' },
            { label: 'Autonomous', desc: 'Executa dentro das permissões definidas', emoji: '🚗' },
          ].map((level) => (
            <div className="text-center" key={level.label}>
              <span className="text-3xl">{level.emoji}</span>
              <p className="mt-2 font-semibold text-white">{level.label}</p>
              <p className="mt-1 text-sm text-zinc-400">{level.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Security ────────────────────────────────────────────────── */
const securityItems = [
  'IA nunca altera arquivos sem diff e aprovação explícita',
  'Chaves e tokens armazenados no vault do sistema operacional',
  'Secrets redacted antes de enviar contexto para APIs remotas',
  'Comandos classificados como seguros, confirmação obrigatória, perigosos ou bloqueados',
  'Modo YOLO com aviso explícito — comandos destrutivos sempre bloqueados',
  'Proteção contra path traversal e acesso fora do workspace',
];

function Security() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950">
          <div className="grid gap-12 p-8 md:grid-cols-2 md:p-12 lg:p-16">
            <div>
              <SectionLabel>Segurança</SectionLabel>
              <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
                Você sempre está <GradientText>no controle</GradientText>
              </h2>
              <p className="mt-4 text-zinc-400">
                A IA propõe. Você decide. Sem surpresas, sem alterações silenciosas, sem segredos
                vazando para APIs remotas.
              </p>
            </div>
            <ul className="space-y-4">
              {securityItems.map((item) => (
                <li className="flex items-start gap-3 text-sm text-zinc-300" key={item}>
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Roadmap ─────────────────────────────────────────────────── */
const phases = [
  {
    phase: 'Fase 1–2',
    title: 'Fundação & Agentes',
    status: 'done',
    items: [
      'Monorepo e toolchain',
      'UI e design system',
      'Sistema de providers',
      'Chat streaming',
      'Agentes e workflows',
    ],
  },
  {
    phase: 'Fase 3',
    title: 'Editor & Git',
    status: 'current',
    items: [
      'Diff side-by-side',
      'Checkpoints e rollback',
      'Git integrado',
      'Terminal com node-pty',
    ],
  },
  {
    phase: 'Fase 4',
    title: 'Deploy & Preview',
    status: 'upcoming',
    items: [
      'Preview embutido',
      'Vercel, Firebase, Supabase',
      'Templates de projeto',
      'GitHub Pages',
    ],
  },
  {
    phase: 'Fase 5',
    title: 'Polimento & OSS',
    status: 'upcoming',
    items: ['Extensibilidade via plugins', 'Landing page completa', 'Documentação', 'Release 1.0'],
  },
];

function Roadmap() {
  return (
    <section className="py-24" id="roadmap">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Roadmap</SectionLabel>
          <h2 className="text-4xl font-bold tracking-tight text-white">
            O que está sendo <GradientText>construído</GradientText>
          </h2>
          <p className="mt-4 text-zinc-400">
            Cada fase funcional antes de avançar. Sem features pela metade.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((phase) => (
            <div
              className={`relative overflow-hidden rounded-2xl border p-5 ${
                phase.status === 'done'
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : phase.status === 'current'
                    ? 'border-violet-500/30 bg-violet-500/8'
                    : 'border-white/5 bg-zinc-900/40'
              }`}
              key={phase.phase}
            >
              <div className="mb-4 flex items-center justify-between">
                <span
                  className={`text-xs font-semibold ${phase.status === 'done' ? 'text-emerald-400' : phase.status === 'current' ? 'text-violet-400' : 'text-zinc-600'}`}
                >
                  {phase.phase}
                </span>
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs ${phase.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' : phase.status === 'current' ? 'bg-violet-500/20 text-violet-400' : 'bg-zinc-800 text-zinc-600'}`}
                >
                  {phase.status === 'done' ? '✓' : phase.status === 'current' ? '→' : '○'}
                </span>
              </div>
              <h3 className="mb-3 font-semibold text-white">{phase.title}</h3>
              <ul className="space-y-1.5">
                {phase.items.map((item) => (
                  <li
                    className={`text-xs ${phase.status === 'upcoming' ? 'text-zinc-600' : 'text-zinc-400'}`}
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─────────────────────────────────────────────────────── */
const faqs = [
  {
    q: 'VisualnsCode substitui o VS Code?',
    a: 'Não — é um ambiente diferente, focado em centralizar IA e automações. Para quem quer uma IDE orientada por agentes, funciona muito bem. Mas você pode continuar usando o VS Code para qualquer coisa.',
  },
  {
    q: 'Preciso pagar por API de IA?',
    a: 'Depende do provider. Ollama e LM Studio rodam localmente, sem custo. OpenAI, Anthropic e Gemini têm planos pagos por uso. O VisualnsCode em si não cobra nada além disso.',
  },
  {
    q: 'Funciona em Windows e Linux?',
    a: 'O roadmap prevê macOS arm64, macOS x64, Windows x64 e Linux x64. Atualmente o foco de testes é macOS; Windows e Linux virão nas próximas releases.',
  },
  {
    q: 'Como posso contribuir?',
    a: 'Abra issues, envie pull requests, escreva docs ou reporte bugs. O CONTRIBUTING.md no repositório explica o processo completo.',
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24" id="faq">
      <div className="mx-auto max-w-3xl px-5">
        <div className="text-center">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-4xl font-bold tracking-tight text-white">Perguntas frequentes</h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => (
            <div
              className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60"
              key={i}
            >
              <button
                className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-white"
                onClick={() => setOpen(open === i ? null : i)}
                type="button"
              >
                {faq.q}
                <span
                  className={`ml-4 shrink-0 text-lg text-zinc-400 transition-transform ${open === i ? 'rotate-45' : ''}`}
                >
                  +
                </span>
              </button>
              {open === i ? (
                <div className="border-t border-white/5 px-6 pb-5 pt-3 text-sm leading-6 text-zinc-400">
                  {faq.a}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-16 text-center md:px-16"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,92,246,0.18) 0%, rgba(6,182,212,0.08) 100%)',
            border: '1px solid rgba(124,92,246,0.25)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(124,92,246,0.22) 0%, transparent 60%)',
            }}
          />
          <div className="relative">
            <h2 className="text-4xl font-bold tracking-tight text-white lg:text-5xl">
              Pronto para codar <GradientText>diferente?</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
              Código aberto, sem lock-in, direto no seu ambiente.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500"
                href={GITHUB}
                rel="noopener noreferrer"
                target="_blank"
              >
                <GitHubIcon />
                Ver no GitHub
              </a>
              <a
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
                href={`${GITHUB}/issues`}
                rel="noopener noreferrer"
                target="_blank"
              >
                Abrir issue
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-sm font-semibold text-white">VisualnsCode</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-600">
            <a
              className="transition hover:text-white"
              href={GITHUB}
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
            <a
              className="transition hover:text-white"
              href={`${GITHUB}/issues`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Issues
            </a>
            <a
              className="transition hover:text-white"
              href={`${GITHUB}/blob/main/LICENSE`}
              rel="noopener noreferrer"
              target="_blank"
            >
              MIT License
            </a>
          </div>
          <p className="text-sm text-zinc-600">
            Built by{' '}
            <a
              className="text-zinc-400 transition hover:text-white"
              href="https://github.com/spxmiguel"
              rel="noopener noreferrer"
              target="_blank"
            >
              @spxmiguel
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── SVG icons ───────────────────────────────────────────────── */
function LogoMark() {
  return (
    <svg fill="none" height="28" viewBox="0 0 28 28" width="28">
      <rect fill="#7C5CFC" height="28" rx="8" width="28" />
      <path
        d="M8 10l4 4-4 4M14 18h6"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg fill="currentColor" height="16" viewBox="0 0 16 16" width="16">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function MockFilesIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function MockSearchIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MockGitIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <circle cx="4" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 5.5v5M5.5 4h5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function MockSettingsIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.6 3.6l1 1M11.4 11.4l1 1M12.4 3.6l-1 1M4.6 11.4l-1 1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function MockBotIcon() {
  return (
    <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1" width="10" x="1" y="4" />
      <circle cx="6" cy="2" r="1" stroke="currentColor" strokeWidth="1" />
      <path d="M6 3v1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <circle cx="4" cy="7.5" r=".7" fill="currentColor" />
      <circle cx="8" cy="7.5" r=".7" fill="currentColor" />
    </svg>
  );
}

function MockEyeIcon() {
  return (
    <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
      <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1" />
      <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/* ─── App ─────────────────────────────────────────────────────── */
export function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <Nav />
      <Hero />
      <Integrations />
      <Features />
      <Modes />
      <Agents />
      <Security />
      <Roadmap />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
