import jsxA11y from 'eslint-plugin-jsx-a11y';
import playwright from 'eslint-plugin-playwright';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { baseConfig } from './index.js';

/**
 * Configuración para la app web (React 19 + Vite + React Router).
 *
 * @param {{ tsconfigRootDir: string }} options
 */
export function reactConfig({ tsconfigRootDir }) {
  return tseslint.config(
    ...baseConfig({ tsconfigRootDir }),
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        globals: { ...globals.browser },
      },
      // `configs.flat.*`, no `configs['recommended-latest']`: en
      // eslint-plugin-react-hooks 7 esa entrada sigue siendo del formato viejo
      // (eslintrc) y ESLint 10 la rechaza.
      extends: [reactHooks.configs.flat['recommended-latest'], jsxA11y.flatConfigs.recommended],
      plugins: { 'react-refresh': reactRefresh },
      rules: {
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      },
    },
    {
      files: ['e2e/**/*.{ts,tsx}'],
      extends: [playwright.configs['flat/recommended']],
    },
  );
}

export default reactConfig;
