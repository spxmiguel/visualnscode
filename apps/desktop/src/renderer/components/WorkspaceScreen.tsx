import { lazy, Suspense } from 'react';
import { Spinner } from '@visualnscode/ui';
import { useAppStore } from '../store';
import { SimpleProjectScreen } from './SimpleProjectScreen';

const AdvancedWorkspaceScreen = lazy(() =>
  import('./AdvancedWorkspaceScreen').then((module) => ({
    default: module.AdvancedWorkspaceScreen,
  })),
);

export function WorkspaceScreen() {
  const mode = useAppStore((state) => state.mode);
  if (mode === 'simple') return <SimpleProjectScreen />;
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[rgb(var(--background))]">
          <Spinner label="Abrindo ferramentas avançadas…" />
        </div>
      }
    >
      <AdvancedWorkspaceScreen />
    </Suspense>
  );
}
