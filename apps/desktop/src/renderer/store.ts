import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AppScreen = 'home' | 'settings' | 'workspace';
export type ExperienceMode = 'simple' | 'advanced';
export type ThemePreference = 'dark' | 'light';

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
  readonly theme: ThemePreference;
  readonly clearError: () => void;
  readonly completeOnboarding: () => void;
  readonly navigate: (screen: AppScreen) => void;
  readonly restartOnboarding: () => void;
  readonly openProject: (project: RecentProject) => void;
  readonly setError: (error: string | null) => void;
  readonly setMode: (mode: ExperienceMode) => void;
  readonly setTheme: (theme: ThemePreference) => void;
  readonly toggleTheme: () => void;
}

export const demoProjects: readonly RecentProject[] = [
  {
    id: 'aurora',
    name: 'Aurora Dashboard',
    path: '~/Projetos/aurora-dashboard',
    lastOpened: 'Hoje, 14:32',
    color: '#8b6af6',
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
      theme: 'dark',
      clearError: () => set({ error: null }),
      completeOnboarding: () => set({ onboardingCompleted: true, screen: 'home' }),
      navigate: (screen) => set({ screen, error: null }),
      restartOnboarding: () => set({ onboardingCompleted: false }),
      openProject: (project) => set({ activeProject: project, screen: 'workspace', error: null }),
      setError: (error) => set({ error }),
      setMode: (mode) => set({ mode }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'visualnscode-preferences',
      partialize: ({ mode, onboardingCompleted, theme }) => ({ mode, onboardingCompleted, theme }),
      storage: createJSONStorage(() => window.localStorage),
      version: 2,
    },
  ),
);
