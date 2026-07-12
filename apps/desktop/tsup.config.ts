import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  entry: {
    'main/index': 'src/main/index.ts',
    'preload/index': 'src/preload/index.ts',
  },
  external: ['electron'],
  format: ['cjs'],
  outDir: 'dist-electron',
  outExtension: () => ({ js: '.cjs' }),
  sourcemap: true,
});
