import { create } from 'zustand';

export type BottomPanel = 'terminal' | 'tasks' | 'logs' | 'git' | 'diffs' | 'permissions';
export type RightPanel = 'chat' | 'preview';
export type WorkspaceTool = 'files' | 'agents' | 'git' | 'logs' | 'diffs' | 'tasks' | 'permissions';

export interface WorkspaceFile {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly language: string;
  readonly important: boolean;
  readonly initialContent: string;
  readonly content: string;
}

const initialFiles: readonly WorkspaceFile[] = [
  {
    id: 'app',
    name: 'App.tsx',
    path: 'src/App.tsx',
    language: 'typescript',
    important: true,
    initialContent: `export function App() {\n  return (\n    <main>\n      <h1>Olá, VisualnsCode!</h1>\n      <p>Seu projeto está pronto para ganhar vida.</p>\n    </main>\n  );\n}\n`,
    content: `export function App() {\n  return (\n    <main>\n      <h1>Olá, VisualnsCode!</h1>\n      <p>Seu projeto está pronto para ganhar vida.</p>\n    </main>\n  );\n}\n`,
  },
  {
    id: 'styles',
    name: 'styles.css',
    path: 'src/styles.css',
    language: 'css',
    important: true,
    initialContent: `:root {\n  font-family: Inter, system-ui, sans-serif;\n  color: #272532;\n  background: #f5f3ff;\n}\n\nmain {\n  max-width: 720px;\n  margin: 8rem auto;\n  padding: 2rem;\n}\n`,
    content: `:root {\n  font-family: Inter, system-ui, sans-serif;\n  color: #272532;\n  background: #f5f3ff;\n}\n\nmain {\n  max-width: 720px;\n  margin: 8rem auto;\n  padding: 2rem;\n}\n`,
  },
  {
    id: 'readme',
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    important: true,
    initialContent: '# Meu projeto\n\nCriado com VisualnsCode.\n',
    content: '# Meu projeto\n\nCriado com VisualnsCode.\n',
  },
  {
    id: 'package',
    name: 'package.json',
    path: 'package.json',
    language: 'json',
    important: false,
    initialContent:
      '{\n  "name": "meu-projeto",\n  "private": true,\n  "scripts": {\n    "dev": "vite"\n  }\n}\n',
    content:
      '{\n  "name": "meu-projeto",\n  "private": true,\n  "scripts": {\n    "dev": "vite"\n  }\n}\n',
  },
  {
    id: 'vite',
    name: 'vite.config.ts',
    path: 'vite.config.ts',
    language: 'typescript',
    important: false,
    initialContent: "import { defineConfig } from 'vite';\n\nexport default defineConfig({});\n",
    content: "import { defineConfig } from 'vite';\n\nexport default defineConfig({});\n",
  },
];

interface WorkspaceState {
  readonly activeFileId: string | null;
  readonly activeTool: WorkspaceTool;
  readonly autoStartPreview: boolean;
  readonly bottomPanel: BottomPanel;
  readonly files: readonly WorkspaceFile[];
  readonly isBottomOpen: boolean;
  readonly isExplorerOpen: boolean;
  readonly isRightOpen: boolean;
  readonly openTabs: readonly string[];
  readonly rightPanel: RightPanel;
  readonly closeTab: (fileId: string) => void;
  readonly openFile: (fileId: string) => void;
  readonly consumePreviewStart: () => void;
  readonly requestPreviewStart: () => void;
  readonly resetActiveFile: () => void;
  readonly setActiveTool: (tool: WorkspaceTool) => void;
  readonly setBottomPanel: (panel: BottomPanel) => void;
  readonly setRightPanel: (panel: RightPanel) => void;
  readonly toggleBottom: () => void;
  readonly toggleExplorer: () => void;
  readonly toggleRight: () => void;
  readonly updateActiveFile: (content: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeFileId: 'app',
  activeTool: 'files',
  autoStartPreview: false,
  bottomPanel: 'terminal',
  files: initialFiles,
  isBottomOpen: true,
  isExplorerOpen: true,
  isRightOpen: true,
  openTabs: ['app'],
  rightPanel: 'chat',
  closeTab: (fileId) =>
    set((state) => {
      const index = state.openTabs.indexOf(fileId);
      const openTabs = state.openTabs.filter((id) => id !== fileId);
      const fallback = openTabs[Math.min(index, openTabs.length - 1)] ?? null;
      return {
        openTabs,
        activeFileId: state.activeFileId === fileId ? fallback : state.activeFileId,
      };
    }),
  openFile: (fileId) =>
    set((state) => ({
      activeFileId: fileId,
      openTabs: state.openTabs.includes(fileId) ? state.openTabs : [...state.openTabs, fileId],
    })),
  consumePreviewStart: () => set({ autoStartPreview: false }),
  requestPreviewStart: () =>
    set({ autoStartPreview: true, rightPanel: 'preview', isRightOpen: true }),
  resetActiveFile: () =>
    set((state) => ({
      files: state.files.map((file) =>
        file.id === state.activeFileId ? { ...file, content: file.initialContent } : file,
      ),
    })),
  setActiveTool: (activeTool) => set({ activeTool, isExplorerOpen: true }),
  setBottomPanel: (bottomPanel) => set({ bottomPanel, isBottomOpen: true }),
  setRightPanel: (rightPanel) => set({ rightPanel, isRightOpen: true }),
  toggleBottom: () => set((state) => ({ isBottomOpen: !state.isBottomOpen })),
  toggleExplorer: () => set((state) => ({ isExplorerOpen: !state.isExplorerOpen })),
  toggleRight: () => set((state) => ({ isRightOpen: !state.isRightOpen })),
  updateActiveFile: (content) =>
    set((state) => ({
      files: state.files.map((file) =>
        file.id === state.activeFileId ? { ...file, content } : file,
      ),
    })),
}));
