// Con la extensión: `eslint-config-expo` no declara `exports`, y Node no
// resuelve la importación de un directorio desde un módulo ESM.
import expo from 'eslint-config-expo/flat.js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { baseConfig } from './index.js';

/**
 * Configuración para la app móvil (Expo 57 + expo-router + NativeWind 5).
 * `eslint-config-expo` aporta las reglas específicas de React Native que
 * ni ESLint ni oxlint traen de serie.
 *
 * @param {{ tsconfigRootDir: string }} options
 */
export function expoConfig({ tsconfigRootDir }) {
  return tseslint.config(
    ...baseConfig({ tsconfigRootDir }),
    ...expo,
    {
      // Sin `files`: se aplica a TODO, también a los .js de configuración.
      // La versión de React va fija a propósito: el `detect` de
      // eslint-plugin-react usa una API de contexto que ESLint 10 ya no expone
      // y revienta al cargar cualquiera de sus reglas.
      settings: { react: { version: '19.2' } },
    },
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        // Metro resuelve `@/...` vía tsconfig paths.
        'import/no-unresolved': 'off',
      },
    },
    {
      // Única app del monorepo con Jest: sus globales no están en la base.
      files: ['**/*.test.{ts,tsx}', 'jest.setup.js', 'jest.config.js'],
      languageOptions: { globals: globals.jest },
    },
  );
}

export default expoConfig;
