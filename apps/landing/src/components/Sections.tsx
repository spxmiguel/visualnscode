import {
  ArrowDownToLine,
  Blocks,
  Bot,
  Braces,
  Command,
  FileDiff,
  GitFork,
  KeyRound,
  LockKeyhole,
  Network,
  ScanSearch,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { DOWNLOAD_URL, GITHUB_URL, integrations } from '../constants';
import { Container, ExternalLink, FeatureCard, SectionHeading } from './Primitives';

export function Hero() {
  return (
    <section
      className="grid-background relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-40"
      id="top"
    >
      <Container>
        <div className="max-w-4xl">
          <div className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            <span className="size-2 bg-emerald-500" />
            Open source · active development
          </div>
          <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl lg:text-[88px]">
            Build with every AI.
            <br />
            <span className="text-[rgb(var(--accent))]">Manage everything</span> from one place.
          </h1>
          <p className="mt-8 max-w-2xl text-pretty text-lg leading-8 text-[rgb(var(--muted))]">
            VisualnsCode combines AI agents, local models, developer tools, deployment services and
            a powerful code editor in one simple workspace.
          </p>
          <p className="mt-3 font-mono text-xs text-[rgb(var(--subtle))]">
            Todas as suas IAs, agentes e ferramentas de desenvolvimento em um só lugar.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ExternalLink
              className="button-primary inline-flex justify-center sm:justify-start"
              href={DOWNLOAD_URL}
            >
              <ArrowDownToLine className="size-4" />
              Download
            </ExternalLink>
            <ExternalLink
              className="button-secondary inline-flex justify-center sm:justify-start"
              href={GITHUB_URL}
            >
              <GitFork className="size-4" />
              View on GitHub
            </ExternalLink>
          </div>
          <div className="mt-14 grid max-w-2xl grid-cols-3 border-y border-[rgb(var(--line))] sm:grid-cols-6">
            <Metric value="12" label="providers" />
            <Metric value="10" label="agents" />
            <Metric value="03" label="autonomy" />
            <Metric value="04" label="deploys" />
            <Metric value="13" label="templates" />
            <Metric value="100%" label="open source" />
          </div>
        </div>
      </Container>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-r border-[rgb(var(--line))] px-3 py-4 last:border-r-0">
      <p className="font-mono text-sm font-semibold">{value}</p>
      <p className="mt-1 font-mono text-[8px] uppercase tracking-wider text-[rgb(var(--subtle))]">
        {label}
      </p>
    </div>
  );
}

export function ProblemSection() {
  return (
    <section className="section" id="problem">
      <Container>
        <SectionHeading
          description="Construir com IA virou um mosaico de chats, terminais, dashboards e credenciais. O custo não está só nas ferramentas — está em alternar contexto o tempo todo."
          index="02"
          label="O problema"
          title="Seu ambiente ficou mais fragmentado a cada nova ferramenta."
        />
        <div className="mt-12 grid gap-px bg-[rgb(var(--line))] sm:grid-cols-3">
          <FeatureCard icon={Network} index="01" title="Contexto espalhado">
            Arquivos em um editor, agentes em outro app e histórico preso em conversas que não
            conhecem o projeto.
          </FeatureCard>
          <FeatureCard icon={Wrench} index="02" title="Setup como pré-requisito">
            CLIs, runtimes, autenticação e deploy exigem conhecimento antes mesmo da primeira linha
            de produto.
          </FeatureCard>
          <FeatureCard icon={LockKeyhole} index="03" title="Automação sem clareza">
            Quando uma IA executa ações sem revisão, velocidade vira risco para código, segredos e
            infraestrutura.
          </FeatureCard>
        </div>
      </Container>
    </section>
  );
}

export function SolutionSection() {
  return (
    <section
      className="section border-y border-[rgb(var(--line))] bg-[rgb(var(--panel))]"
      id="solution"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            description="Uma interface local coordena editor, providers, agentes, Git, processos e deploy. Você escolhe quanto detalhe quer ver e quais ações cada ferramenta pode executar."
            index="03"
            label="A solução"
            title="Um workspace, com controle em todas as camadas."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SolutionItem icon={Braces} title="Código e contexto">
              Monaco, arquivos abertos e preview trabalham juntos.
            </SolutionItem>
            <SolutionItem icon={Bot} title="IA sem lock-in">
              APIs, modelos locais e CLIs seguem o mesmo contrato.
            </SolutionItem>
            <SolutionItem icon={ShieldCheck} title="Revisão antes da escrita">
              Toda edição proposta passa por diff e checkpoint.
            </SolutionItem>
            <SolutionItem icon={Blocks} title="Open source de verdade">
              Código, arquitetura, segurança e roadmap são públicos.
            </SolutionItem>
          </div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-5 border-t border-[rgb(var(--line))] pt-6 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
            MIT licensed. Sem conta obrigatória, sem formato proprietário de projeto e sem
            dependência de um único fornecedor de IA.
          </p>
          <ExternalLink
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[rgb(var(--accent))]"
            href={`${GITHUB_URL}/blob/main/LICENSE`}
          >
            Ler a licença
          </ExternalLink>
        </div>
      </Container>
    </section>
  );
}

function SolutionItem({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Braces;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="border-l border-[rgb(var(--line-strong))] pl-5">
      <Icon className="size-5 text-[rgb(var(--accent))]" />
      <h3 className="mt-6 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{children}</p>
    </article>
  );
}

export function IntegrationsSection() {
  return (
    <section className="section" id="integrations">
      <Container>
        <SectionHeading
          align="center"
          description="Serviços remotos, modelos locais e ferramentas de terminal aparecem em uma interface consistente, sem fingir que são iguais."
          index="04"
          label="Integrações"
          title="Use o melhor modelo para cada tarefa."
        />
        <div className="mt-12 grid grid-cols-2 border-l border-t border-[rgb(var(--line))] sm:grid-cols-3 lg:grid-cols-9">
          {integrations.map((name, index) => (
            <div
              className="group flex min-h-24 flex-col justify-between border-b border-r border-[rgb(var(--line))] p-4"
              key={name}
            >
              <span className="font-mono text-[9px] text-[rgb(var(--subtle))]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-sm font-medium">{name}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-[rgb(var(--subtle))]">
          Text marks only · no unofficial brand assets
        </p>
      </Container>
    </section>
  );
}

const simpleItems = [
  'Arquivos importantes',
  'Editor e chat',
  'Preview responsivo',
  'Executar projeto',
  'Desfazer alterações',
];
const advancedItems = [
  'Terminal e tarefas',
  'Git, branches e conflitos',
  'Logs e diffs',
  'Agentes e modelos',
  'Permissões avançadas',
];

export function ModesSection() {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const items = mode === 'simple' ? simpleItems : advancedItems;
  return (
    <section
      className="section border-y border-[rgb(var(--line))] bg-[rgb(var(--panel))]"
      id="modes"
    >
      <Container>
        <SectionHeading
          description="A mesma base funcional pode ensinar o essencial ou expor os controles completos. A troca muda a densidade da interface, não o seu projeto."
          index="05"
          label="Dois modos"
          title="Comece simples. Abra os detalhes quando precisar."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-[320px_1fr]">
          <div role="tablist" aria-label="Modo da interface" className="space-y-2">
            {(['simple', 'advanced'] as const).map((item) => (
              <button
                aria-controls={`mode-${item}`}
                aria-selected={mode === item}
                className={`w-full border px-5 py-4 text-left transition-colors ${mode === item ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))]' : 'border-[rgb(var(--line))]'}`}
                id={`tab-${item}`}
                key={item}
                onClick={() => setMode(item)}
                role="tab"
                type="button"
              >
                <span className="font-mono text-[9px] text-[rgb(var(--subtle))]">
                  {item === 'simple' ? '01' : '02'}
                </span>
                <span className="mt-2 block font-semibold">
                  Modo {item === 'simple' ? 'simples' : 'avançado'}
                </span>
              </button>
            ))}
          </div>
          <div
            aria-labelledby={`tab-${mode}`}
            className="border border-[rgb(var(--line))] bg-[rgb(var(--page))] p-6 sm:p-8"
            id={`mode-${mode}`}
            role="tabpanel"
          >
            <div className="mb-8 flex items-center justify-between border-b border-[rgb(var(--line))] pb-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[rgb(var(--muted))]">
                Visible tools
              </span>
              <span className="font-mono text-[10px] text-[rgb(var(--accent))]">
                {mode.toUpperCase()}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item, index) => (
                <div
                  className="flex items-center gap-3 border border-[rgb(var(--line))] p-4 text-sm"
                  key={item}
                >
                  <span className="font-mono text-[9px] text-[rgb(var(--accent))]">
                    0{index + 1}
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

const agents = ['Architect', 'Frontend Developer', 'Reviewer', 'Tester', 'Documentation Writer'];

export function AgentsSection() {
  return (
    <section className="section" id="agents">
      <Container>
        <SectionHeading
          align="center"
          description="Combine papéis especializados em sequência ou em paralelo. Cada etapa recebe a tarefa, o resultado anterior, arquivos, erros e contexto relevante."
          index="06"
          label="Sistema de agentes"
          title="Uma equipe que mostra o próprio trabalho."
        />
        <div className="mt-14 overflow-x-auto pb-3">
          <div className="mx-auto flex min-w-[820px] max-w-5xl items-center">
            {agents.map((agent, index) => (
              <div className="contents" key={agent}>
                <article className="w-36 shrink-0 border border-[rgb(var(--line-strong))] bg-[rgb(var(--panel))] p-4">
                  <span className="font-mono text-[9px] text-[rgb(var(--accent))]">
                    AGENT / 0{index + 1}
                  </span>
                  <Bot className="mt-8 size-5" />
                  <h3 className="mt-3 text-sm font-semibold">{agent}</h3>
                  <p className="mt-2 font-mono text-[8px] uppercase text-emerald-700 dark:text-emerald-400">
                    ready
                  </p>
                </article>
                {index < agents.length - 1 ? (
                  <span aria-hidden className="h-px flex-1 bg-[rgb(var(--line-strong))]" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-px bg-[rgb(var(--line))] sm:grid-cols-3">
          <Autonomy name="Ask" code="01">
            Aprovação para cada ação.
          </Autonomy>
          <Autonomy name="Guided" code="02">
            Executa o seguro; pergunta o importante.
          </Autonomy>
          <Autonomy name="Autonomous" code="03">
            Opera somente dentro das permissões definidas.
          </Autonomy>
        </div>
      </Container>
    </section>
  );
}

function Autonomy({
  name,
  code,
  children,
}: {
  name: string;
  code: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-[rgb(var(--page))] p-6">
      <span className="font-mono text-[9px] text-[rgb(var(--accent))]">{code}</span>
      <h3 className="mt-5 font-semibold">{name}</h3>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{children}</p>
    </article>
  );
}

const setupSteps = [
  ['Git & GitHub', 'detected'],
  ['Node.js & package managers', 'detected'],
  ['Firebase · Vercel · Supabase', 'review'],
  ['AI providers & agent CLIs', 'configure'],
] as const;

export function AutomaticSetupSection() {
  return (
    <section
      className="section border-y border-[rgb(var(--line))] bg-[rgb(var(--panel))]"
      id="setup"
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <SectionHeading
            description="O onboarding verifica runtimes, package managers, GitHub, deploys, modelos locais e CLIs. Cada instalação ou autenticação continua sob sua confirmação."
            index="07"
            label="Configuração automática"
            title="Seu ambiente explicado em linguagem humana."
          />
          <div className="border border-[rgb(var(--line-strong))] bg-[rgb(var(--page))]">
            <div className="flex items-center justify-between border-b border-[rgb(var(--line))] px-5 py-4">
              <span className="font-mono text-[10px]">ENVIRONMENT CHECK</span>
              <span className="font-mono text-[9px] text-emerald-700 dark:text-emerald-400">
                12 / 12
              </span>
            </div>
            {setupSteps.map(([name, status], index) => (
              <div
                className="flex items-center gap-4 border-b border-[rgb(var(--line))] px-5 py-4 last:border-0"
                key={name}
              >
                <span className="font-mono text-[9px] text-[rgb(var(--subtle))]">0{index + 1}</span>
                <span className="flex-1 text-sm">{name}</span>
                <span
                  className={`font-mono text-[8px] uppercase ${status === 'detected' ? 'text-emerald-700 dark:text-emerald-400' : 'text-[rgb(var(--accent))]'}`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export function SecuritySection() {
  return (
    <section className="section" id="security">
      <Container>
        <SectionHeading
          description="A IA propõe; você decide. Permissões, paths e secrets são validados no processo principal antes de qualquer efeito local ou remoto."
          index="08"
          label="Segurança"
          title="Velocidade sem entregar as chaves do projeto."
        />
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div className="grid gap-px bg-[rgb(var(--line))] sm:grid-cols-2">
            <SecurityItem icon={FileDiff} title="Diff obrigatório">
              Aceite tudo, rejeite ou escolha blocos antes de gravar.
            </SecurityItem>
            <SecurityItem icon={KeyRound} title="Vault do sistema">
              Tokens nunca são mantidos em texto puro.
            </SecurityItem>
            <SecurityItem icon={ScanSearch} title="Redaction">
              Secrets são removidos antes do contexto remoto.
            </SecurityItem>
            <SecurityItem icon={Command} title="Comandos classificados">
              Seguro, confirmação, perigoso ou bloqueado.
            </SecurityItem>
          </div>
          <div className="border border-[rgb(var(--line-strong))] bg-[rgb(var(--code))] p-6 font-mono text-[10px]">
            <p className="text-[rgb(var(--subtle))]">POLICY CHECK / COMMAND</p>
            <p className="mt-5 text-[rgb(var(--ink))]">$ rm -rf /</p>
            <div className="mt-5 flex items-center gap-3 border-l-2 border-red-500 bg-red-500/5 px-4 py-3 text-red-700 dark:text-red-400">
              <X className="size-4" />
              BLOCKED · cannot override
            </div>
            <p className="mt-8 leading-6 text-[rgb(var(--muted))]">
              YOLO mode does not bypass extreme destructive-command blocks.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function SecurityItem({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileDiff;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-[rgb(var(--page))] p-6">
      <Icon className="size-5 text-[rgb(var(--accent))]" />
      <h3 className="mt-7 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{children}</p>
    </article>
  );
}

export function DeploymentSection() {
  return (
    <section
      className="section border-y border-[rgb(var(--line))] bg-[rgb(var(--panel))]"
      id="deploy"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionHeading
            description="Salve versões, envie alterações e publique previews sem esconder Git ou executar produção automaticamente. O modo avançado continua disponível quando você precisar dos termos reais."
            index="09"
            label="GitHub & deploy"
            title="Do primeiro commit à URL de preview."
          />
          <div>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0">
              {[
                ['01', 'Testar build'],
                ['02', 'Criar preview'],
                ['03', 'Revisar configurações'],
                ['04', 'Confirmar produção'],
                ['05', 'Registrar URL'],
              ].map(([number, label], index) => (
                <div className="contents" key={number}>
                  <div className="flex flex-col items-center">
                    <span className="grid size-8 place-items-center border border-[rgb(var(--line-strong))] font-mono text-[9px] text-[rgb(var(--accent))]">
                      {number}
                    </span>
                    {index < 4 ? <span className="h-8 w-px bg-[rgb(var(--line))]" /> : null}
                  </div>
                  <p className="pt-1 text-sm">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {['Vercel', 'Firebase Hosting', 'Supabase', 'GitHub Pages'].map((service) => (
                <span
                  className="border border-[rgb(var(--line))] px-3 py-2 font-mono text-[9px]"
                  key={service}
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

const roadmap = [
  { status: 'done', title: 'Foundation', detail: 'Desktop shell, editor, themes, onboarding' },
  { status: 'done', title: 'AI & agents', detail: 'Providers, streaming chat, workflows' },
  { status: 'done', title: 'Safe workspace', detail: 'Diffs, checkpoints, Git, templates' },
  { status: 'done', title: 'Preview & deploy', detail: 'Runtime detection, picker, deployments' },
  {
    status: 'next',
    title: 'Release hardening',
    detail: 'Signing, notarization, cross-platform QA',
  },
  {
    status: 'future',
    title: 'Plugin ecosystem',
    detail: 'Public extension contracts and registry',
  },
] as const;

export function RoadmapSection() {
  return (
    <section className="section" id="roadmap">
      <Container>
        <SectionHeading
          description="O roadmap público acompanha entregas verificáveis. Recursos marcados como concluídos existem no repositório e têm cobertura automatizada."
          index="10"
          label="Roadmap"
          title="Construído em fases que permanecem funcionais."
        />
        <div className="mt-12 border-t border-[rgb(var(--line))]">
          {roadmap.map((item, index) => (
            <article
              className="grid gap-3 border-b border-[rgb(var(--line))] py-5 sm:grid-cols-[60px_120px_1fr_auto] sm:items-center"
              key={item.title}
            >
              <span className="font-mono text-[9px] text-[rgb(var(--subtle))]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span
                className={`font-mono text-[9px] uppercase ${item.status === 'done' ? 'text-emerald-700 dark:text-emerald-400' : item.status === 'next' ? 'text-[rgb(var(--accent))]' : 'text-[rgb(var(--subtle))]'}`}
              >
                {item.status}
              </span>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-[rgb(var(--muted))]">{item.detail}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

const faqs = [
  [
    'VisualnsCode substitui o VS Code?',
    'É uma IDE diferente, feita para centralizar IA e automações com uma curva inicial menor. Projetos continuam sendo pastas normais e podem ser abertos em qualquer editor.',
  ],
  [
    'Preciso pagar por uma API?',
    'Não necessariamente. Ollama e LM Studio permitem modelos locais. APIs remotas seguem a cobrança do próprio fornecedor; o VisualnsCode mostra limites e estimativas quando disponíveis.',
  ],
  [
    'A IA pode alterar arquivos sozinha?',
    'Não pelo fluxo padrão. A IA cria uma proposta, o aplicativo gera o diff e você escolhe quais arquivos ou blocos serão aplicados.',
  ],
  [
    'Quais sistemas serão suportados?',
    'A pipeline prepara macOS arm64/x64, Windows x64 e Linux x64. Assinatura e notarização ainda fazem parte do trabalho de release.',
  ],
  [
    'Como contribuir?',
    'Use as issues e o CONTRIBUTING.md públicos. Commits seguem Conventional Commits e toda mudança passa pelos checks do repositório.',
  ],
] as const;

export function FaqSection() {
  return (
    <section className="section border-y border-[rgb(var(--line))] bg-[rgb(var(--panel))]" id="faq">
      <Container>
        <SectionHeading index="11" label="FAQ" title="Perguntas antes de instalar." />
        <div className="mt-10 max-w-3xl divide-y divide-[rgb(var(--line))] border-y border-[rgb(var(--line))]">
          {faqs.map(([question, answer]) => (
            <details className="group py-1" key={question}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-sm font-semibold">
                <span>{question}</span>
                <span
                  aria-hidden
                  className="font-mono text-lg font-normal text-[rgb(var(--accent))] group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-5 pr-10 text-sm leading-6 text-[rgb(var(--muted))]">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function CallToAction() {
  return (
    <section className="section" id="download">
      <Container>
        <div className="relative overflow-hidden bg-[rgb(var(--ink))] px-6 py-14 text-[rgb(var(--page))] sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="absolute right-0 top-0 font-mono text-[160px] leading-none text-[rgb(var(--page)/0.04)]"
          >
            &gt;_
          </div>
          <div className="relative max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">
              Start local. Stay in control.
            </p>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              Build with every AI.
              <br />
              Keep one source of truth.
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-6 opacity-65">
              Baixe a versão mais recente ou acompanhe o desenvolvimento público no GitHub.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ExternalLink
                className="inline-flex items-center justify-center gap-2 bg-[rgb(var(--page))] px-5 py-3 text-sm font-semibold text-[rgb(var(--ink))]"
                href={DOWNLOAD_URL}
              >
                <ArrowDownToLine className="size-4" />
                Download
              </ExternalLink>
              <ExternalLink
                className="inline-flex items-center justify-center gap-2 border border-[rgb(var(--page)/0.3)] px-5 py-3 text-sm font-semibold"
                href={GITHUB_URL}
              >
                <GitFork className="size-4" />
                View on GitHub
              </ExternalLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
