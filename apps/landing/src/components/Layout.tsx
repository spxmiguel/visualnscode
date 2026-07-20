import { Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DOCS_URL, GITHUB_URL } from '../constants';
import { Container, ExternalLink } from './Primitives';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem('visualnscode-landing-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-[9px] bg-[rgb(var(--ink))] font-mono text-xs font-semibold text-[rgb(var(--page))]"
      >
        &gt;_
      </span>
      <span className="text-sm font-semibold tracking-[-0.02em]">VisualnsCode</span>
    </span>
  );
}

export function Navigation() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('visualnscode-landing-theme', theme);
  }, [theme]);

  const links = [
    ['Produto', '#product'],
    ['Agentes', '#agents'],
    ['Segurança', '#security'],
    ['Roadmap', '#roadmap'],
  ] as const;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgb(var(--line))] bg-[rgb(var(--page)/0.88)] backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <a aria-label="VisualnsCode — início" href="#top">
          <Wordmark />
        </a>
        <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
          {links.map(([label, href]) => (
            <a
              className="text-xs font-medium text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--ink))]"
              href={href}
              key={href}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <button
            aria-label={`Ativar tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
            className="icon-button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            type="button"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <ExternalLink className="button-secondary hidden lg:inline-flex" href={DOCS_URL}>
            Docs
          </ExternalLink>
          <ExternalLink className="button-primary hidden lg:inline-flex" href={GITHUB_URL}>
            GitHub
          </ExternalLink>
          <button
            aria-controls="mobile-navigation"
            aria-expanded={open}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            className="icon-button lg:hidden"
            onClick={() => setOpen(!open)}
            type="button"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </Container>
      {open ? (
        <nav
          aria-label="Navegação móvel"
          className="border-t border-[rgb(var(--line))] bg-[rgb(var(--page))] px-5 py-4 lg:hidden"
          id="mobile-navigation"
        >
          {links.map(([label, href]) => (
            <a
              className="block border-b border-[rgb(var(--line))] py-3 text-sm"
              href={href}
              key={href}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          <ExternalLink
            className="mt-4 inline-flex items-center gap-2 text-sm text-[rgb(var(--accent))]"
            href={GITHUB_URL}
          >
            View on GitHub
          </ExternalLink>
        </nav>
      ) : null}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[rgb(var(--line))] py-10">
      <Container className="grid gap-8 md:grid-cols-[1fr_auto_auto] md:items-center">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-sm text-xs leading-5 text-[rgb(var(--muted))]">
            Todas as suas IAs, agentes e ferramentas de desenvolvimento em um só lugar.
          </p>
        </div>
        <nav
          aria-label="Links do projeto"
          className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs text-[rgb(var(--muted))]"
        >
          <a href={DOCS_URL}>Documentação</a>
          <a href={`${GITHUB_URL}/blob/main/CHANGELOG.md`}>Changelog</a>
          <a href={`${GITHUB_URL}/blob/main/ROADMAP.md`}>Roadmap</a>
          <a href={`${GITHUB_URL}/blob/main/SECURITY.md`}>Segurança</a>
        </nav>
        <p className="font-mono text-[10px] leading-5 text-[rgb(var(--subtle))]">
          MIT LICENSE
          <br />
          BUILT BY @SPXMIGUEL
        </p>
      </Container>
    </footer>
  );
}
