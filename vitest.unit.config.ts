import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: [
        'packages/*/src/**/*.{ts,tsx}',
        'apps/desktop/src/renderer/**/*.{ts,tsx}',
        'apps/desktop/src/shared/**/*.{ts,tsx}',
      ],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts'],
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage/unit',
    },
    environment: 'jsdom',
    include: [
      'packages/**/*.test.{ts,tsx}',
      'apps/desktop/src/renderer/**/*.test.{ts,tsx}',
      'apps/desktop/src/shared/**/*.test.{ts,tsx}',
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
