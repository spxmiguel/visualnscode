import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: { reporter: ['text', 'html'] },
    exclude: ['**/node_modules/**', '**/dist/**', '**/dist-electron/**', 'e2e/**'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
