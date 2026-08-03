import { baseConfig } from '@fidus/eslint-config';

/**
 * Config raíz: cubre los ficheros sueltos del repositorio y sirve de red
 * de seguridad al ejecutar `pnpm exec eslint .` desde la raíz.
 * Cada app tiene además su propio eslint.config.mjs (react/nest/expo).
 */
export default [
  ...baseConfig({ tsconfigRootDir: import.meta.dirname }),
  { ignores: ['apps/**', 'packages/**'] },
];
