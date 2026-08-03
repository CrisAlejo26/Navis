import tseslint from 'typescript-eslint';

import { baseConfig } from './index.js';

/**
 * Configuración para la API NestJS: los decoradores y la inyección por
 * constructor rompen varias reglas pensadas para código funcional.
 *
 * @param {{ tsconfigRootDir: string }} options
 */
export function nestConfig({ tsconfigRootDir }) {
  return tseslint.config(...baseConfig({ tsconfigRootDir }), {
    files: ['**/*.ts'],
    // Los ficheros de configuración quedan fuera del análisis con tipos (ver
    // `disableTypeChecked` en la base): reactivar aquí una regla type-aware
    // haría que ESLint reventase al llegar a ellos.
    ignores: ['**/*.config.ts'],
    rules: {
      // Los decoradores de Nest/TypeORM devuelven `any` en muchas firmas.
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-extraneous-class': 'off',
      // Los módulos de Nest son clases vacías por diseño.
      '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/require-await': 'off',
    },
  });
}

export default nestConfig;
