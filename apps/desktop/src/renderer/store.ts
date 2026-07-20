import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AppScreen = 'home' | 'settings' | 'workspace';
export type ExperienceMode = 'simple' | 'advanced';
export type ThemePreference = 'system' | 'dark' | 'light';

export interface RecentProject {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly lastOpened: string;
  readonly color: string;
}

interface AppState {
  readonly activeProject: RecentProject | null;
  readonly error: string | null;
  readonly mode: ExperienceMode;
  readonly onboardingCompleted: boolean;
  readonly recentProjects: readonly RecentProject[];
  readonly screen: AppScreen;
  readonly settingsProviderId: string | null;
  readonly theme: ThemePreference;
  readonly yoloEnabled: boolean;
  readonly yoloGloballyAllowed: boolean;
  readonly yoloAcknowledged: boolean;
  readonly clearError: () => void;
  readonly completeOnboarding: () => void;
  readonly navigate: (screen: AppScreen) => void;
  readonly openProviderSettings: (providerId: string) => void;
  readonly restartOnboarding: () => void;
  readonly openProject: (project: RecentProject) => void;
  readonly setError: (error: string | null) => void;
  readonly setMode: (mode: ExperienceMode) => void;
  readonly setTheme: (theme: ThemePreference) => void;
  readonly toggleTheme: () => void;
  readonly setYoloGloballyAllowed: (allowed: boolean) => void;
  readonly setYoloEnabled: (enabled: boolean, acknowledged?: boolean) => void;
}

export const demoProjects: readonly RecentProject[] = [
  {
    id: 'aurora',
    name: 'Aurora Dashboard',
    path: '~/Projetos/aurora-dashboard',
    lastOpened: 'Hoje, 14:32',
    color: '#ae5128',
  },
  {
    id: 'coffee',
    name: 'Coffee Landing',
    path: '~/Projetos/coffee-landing',
    lastOpened: 'Ontem',
    color: '#e98659',
  },
  {
    id: 'tasks',
    name: 'Minhas Tarefas',
    path: '~/Projetos/minhas-tarefas',
    lastOpened: '8 de julho',
    color: '#3fa7a0',
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeProject: null,
      error: null,
      mode: 'simple',
      onboardingCompleted: false,
      recentProjects: demoProjects,
      screen: 'home',
      settingsProviderId: null,
      theme: 'system',
      yoloEnabled: false,
      yoloGloballyAllowed: false,
      yoloAcknowledged: false,
      clearError: () => set({ error: null }),
      completeOnboarding: () => set({ onboardingCompleted: true, screen: 'home' }),
      navigate: (screen) => set({ screen, error: null, settingsProviderId: null }),
      openProviderSettings: (settingsProviderId) =>
        set({ screen: 'settings', error: null, settingsProviderId }),
      restartOnboarding: () => set({ onboardingCompleted: false }),
      openProject: (project) => set({ activeProject: project, screen: 'workspace', error: null }),
      setError: (error) => set({ error }),
      setMode: (mode) => set({ mode }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => {
          const systemIsDark =
            typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches;
          const isDark = state.theme === 'system' ? systemIsDark : state.theme === 'dark';
          return { theme: isDark ? 'light' : 'dark' };
        }),
      setYoloGloballyAllowed: (allowed) =>
        set((state) => ({
          yoloGloballyAllowed: allowed,
          yoloEnabled: allowed ? state.yoloEnabled : false,
          yoloAcknowledged: allowed ? state.yoloAcknowledged : false,
        })),
      setYoloEnabled: (enabled, acknowledged = false) =>
        set((state) => ({
          yoloEnabled: state.yoloGloballyAllowed && enabled && acknowledged,
          yoloAcknowledged: state.yoloGloballyAllowed && enabled && acknowledged,
        })),
    }),
    {
      name: 'visualnscode-preferences',
      migrate: (persistedState) => persistedState as AppState,
      partialize: ({
        mode,
        onboardingCompleted,
        theme,
        yoloAcknowledged,
        yoloEnabled,
        yoloGloballyAllowed,
      }) => ({
        mode,
        onboardingCompleted,
        theme,
        yoloAcknowledged,
        yoloEnabled,
        yoloGloballyAllowed,
      }),
      storage: createJSONStorage(() => window.localStorage),
      version: 4,
    },
  ),
);
