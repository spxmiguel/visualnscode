import { useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { WorkspaceScreen } from './components/WorkspaceScreen';
import { useAppStore } from './store';

export function App() {
  const screen = useAppStore((state) => state.screen);
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  if (screen === 'settings') return <SettingsScreen />;
  if (screen === 'workspace') return <WorkspaceScreen />;
  return <HomeScreen />;
}
