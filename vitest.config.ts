import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.spec.ts'],
    environment: 'node',
    coverage: {
      reporter: ['text', 'html']
    }
  },
  resolve: {
    alias: {
      '@drguptavivek/emr-controller': new URL(
        './packages/emr-controller/src/index.ts',
        import.meta.url
      ).pathname
    }
  }
});
