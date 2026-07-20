import { ArrowLeft, Moon, Settings, Sun } from 'lucide-react';
import { IconButton } from '@visualnscode/ui';
import type { ReactNode } from 'react';
import { useAppStore } from '../store';
import { useResolvedTheme } from '../theme';
import { AppMark } from './AppMark';

interface WindowHeaderProps {
  readonly backLabel?: string;
  readonly center?: ReactNode;
  readonly onBack?: () => void;
  readonly showSettings?: boolean;
}

export function WindowHeader({
  backLabel,
  center,
  onBack,
  showSettings = true,
}: WindowHeaderProps) {
  const navigate = useAppStore((state) => state.navigate);
  const themePreference = useAppStore((state) => state.theme);
  const theme = useResolvedTheme();
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]/95 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        {onBack ? (
          <IconButton label={backLabel ?? 'Voltar'} onClick={onBack}>
            <ArrowLeft className="size-4" />
          </IconButton>
        ) : null}
        <AppMark />
      </div>
      <div className="min-w-0">{center}</div>
      <div className="flex justify-end gap-1">
        <IconButton
          label={`${themePreference === 'system' ? 'Tema automático. ' : ''}${theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}`}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </IconButton>
        {showSettings ? (
          <IconButton label="Abrir configurações" onClick={() => navigate('settings')}>
            <Settings className="size-4" />
          </IconButton>
        ) : null}
      </div>
    </header>
  );
}
