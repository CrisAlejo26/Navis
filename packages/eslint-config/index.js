import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import oxlint from 'eslint-plugin-oxlint';
import vitest from '@vitest/eslint-plugin';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Carpetas que ningún linter debe mirar nunca. */
export const ignores = [
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/node_modules/**',
  '**/.turbo/**',
  '**/.expo/**',
  '**/android/**',
  '**/ios/**',
  '**/dev-dist/**',
  '**/playwright-report/**',
  '**/test-results/**',
  '**/*.gen.ts',
];

/**
 * Configuración base compartida por todo el monorepo: JS recomendado,
 * TypeScript con reglas type-aware, Vitest en los tests y desactivación
 * de las reglas que ya cubre oxlint o que chocan con Prettier.
 *
 * @param {{ tsconfigRootDir: string }} options
 */
export function baseConfig({ tsconfigRootDir }) {
  return tseslint.config(
    { ignores },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        globals: { ...globals.node, ...globals.es2023 },
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      linterOptions: {
        reportUnusedDisableDirectives: 'error',
      },
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/no-misused-promises': [
          'error',
          { checksVoidReturn: { attributes: false } },
        ],
        // Regla 10: `any` no entra. `recommendedTypeChecked` ya lo marca como
        // error; se deja escrito para que se vea que es una decisión y no una
        // herencia que alguien pueda relajar sin darse cuenta.
        '@typescript-eslint/no-explicit-any': 'error',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        eqeqeq: ['error', 'smart'],
      },
    },
    // Tests: globals de Vitest y reglas más laxas.
    {
      files: ['**/*.{test,spec}.{ts,tsx}', '**/tests/**/*.{ts,tsx}'],
      plugins: { vitest },
      rules: {
        ...vitest.configs.recommended.rules,
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-console': 'off',
      },
    },
    // Ficheros de configuración: fuera del programa de TypeScript.
    {
      files: ['**/*.{js,mjs,cjs}', '**/*.config.{ts,mts}'],
      extends: [tseslint.configs.disableTypeChecked],
      rules: { 'no-console': 'off' },
    },
    // oxlint corre antes en pre-commit: apagamos aquí sus reglas duplicadas.
    ...oxlint.configs['flat/recommended'],
    // Prettier manda en todo lo que sea formato. Debe ir el último.
    prettier,
  );
}

export default baseConfig;
