import { nestConfig } from '@fidus/eslint-config/nest';

export default [
  ...nestConfig({ tsconfigRootDir: import.meta.dirname }),
  // `metadata.ts` lo genera el plugin de Swagger del CLI de Nest en cada build.
  { ignores: ['src/metadata.ts'] },
];
