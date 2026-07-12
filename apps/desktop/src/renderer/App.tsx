import { useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { WorkspaceScreen } from './components/WorkspaceScreen';
import { useAppStore } from './store';

export function App() {
  const screen = useAppStore((state) => state.screen);
  const onboardingCompleted = useAppStore((state) => state.onboardingCompleted);
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  if (!onboardingCompleted) return <OnboardingScreen />;
  if (screen === 'settings') return <SettingsScreen />;
  if (screen === 'workspace') return <WorkspaceScreen />;
  return <HomeScreen />;
}
