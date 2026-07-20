import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: ['apps/desktop/src/main/services/**/*.ts'],
      exclude: ['**/*.test.ts'],
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage/integration',
    },
    environment: 'node',
    include: ['apps/desktop/src/main/services/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
