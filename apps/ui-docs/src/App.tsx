import { Bell, Box, Sparkles } from 'lucide-react';
import {
  Button,
  EmptyState,
  ErrorNotice,
  IconButton,
  SegmentedControl,
  SelectField,
  Spinner,
  Surface,
} from '@visualnscode/ui';
import { useEffect, useState } from 'react';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <main className="min-h-screen bg-[rgb(var(--background))] px-6 py-10 text-[rgb(var(--text))]">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--accent))]">
              Visual catalog
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">VisualnsCode UI</h1>
            <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
              Catálogo leve dos componentes compartilhados em packages/ui.
            </p>
          </div>
          <SegmentedControl
            label="Tema do catálogo"
            onChange={setTheme}
            options={[
              { label: 'Escuro', value: 'dark' },
              { label: 'Claro', value: 'light' },
            ]}
            value={theme}
          />
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <Surface className="p-6" elevated>
            <h2 className="text-sm font-semibold">Botões</h2>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
              Variantes, tamanhos e estados.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button>
                <Sparkles className="size-4" /> Primário
              </Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="ghost">Discreto</Button>
              <Button variant="danger">Perigo</Button>
              <Button disabled>Desativado</Button>
              <IconButton label="Notificações">
                <Bell className="size-4" />
              </IconButton>
            </div>
          </Surface>

          <Surface className="p-6" elevated>
            <h2 className="text-sm font-semibold">Controles</h2>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
              Seleção e revelação progressiva.
            </p>
            <div className="mt-5 flex flex-col gap-4">
              <SegmentedControl
                label="Modo"
                onChange={setMode}
                options={[
                  { label: 'Simples', value: 'simple' },
                  { label: 'Avançado', value: 'advanced' },
                ]}
                value={mode}
              />
              <SelectField label="Modelo" defaultValue="local">
                <option value="local">Demonstração local</option>
                <option disabled>Providers em breve</option>
              </SelectField>
            </div>
          </Surface>

          <Surface className="p-6" elevated>
            <h2 className="text-sm font-semibold">Feedback</h2>
            <div className="mt-5 space-y-4">
              <ErrorNotice message="Não foi possível conectar ao serviço. Tente novamente em instantes." />
              <div className="rounded-xl border border-[rgb(var(--border))] p-4">
                <Spinner label="Preparando workspace…" />
              </div>
            </div>
          </Surface>

          <Surface className="min-h-72 overflow-hidden" elevated>
            <EmptyState
              action={<Button variant="secondary">Criar primeiro item</Button>}
              description="Use estados vazios para explicar o próximo passo sem sobrecarregar a tela."
              icon={<Box className="size-5" />}
              title="Nada por aqui ainda"
            />
          </Surface>
        </div>
      </div>
    </main>
  );
}
