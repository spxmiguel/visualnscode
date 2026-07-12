import { create } from 'zustand';

interface WorkspaceState {
  readonly fileName: string;
  readonly source: string;
  readonly setSource: (source: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  fileName: 'boas-vindas.ts',
  source: `const mensagem = 'Bem-vindo ao VisualnsCode';\n\nconsole.log(mensagem);`,
  setSource: (source) => set({ source }),
}));
