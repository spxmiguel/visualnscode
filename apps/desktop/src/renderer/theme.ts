import { useSyncExternalStore } from 'react';
import { useAppStore, type ThemePreference } from './store';

export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

const systemThemeQuery = '(prefers-color-scheme: dark)';

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark';
  return window.matchMedia(systemThemeQuery).matches ? 'dark' : 'light';
};

const subscribeToSystemTheme = (listener: () => void): (() => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia(systemThemeQuery);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
};

export const resolveTheme = (
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme => (preference === 'system' ? systemTheme : preference);

export function useResolvedTheme(): ResolvedTheme {
  const preference = useAppStore((state) => state.theme);
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    (): ResolvedTheme => 'dark',
  );
  return resolveTheme(preference, systemTheme);
}
