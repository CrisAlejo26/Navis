import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // SWC aplica los decoradores y `emitDecoratorMetadata`, que es lo que
  // necesitan la inyección de dependencias de Nest y las entidades de TypeORM.
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{test,spec}.ts', 'src/database/migrations/**', 'src/main.ts'],
    },
  },
});
