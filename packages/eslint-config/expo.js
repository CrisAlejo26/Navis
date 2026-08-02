import expo from 'eslint-config-expo/flat';
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
  return tseslint.config(...baseConfig({ tsconfigRootDir }), ...expo, {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Metro resuelve `@/...` vía tsconfig paths.
      'import/no-unresolved': 'off',
    },
  });
}

export default expoConfig;
