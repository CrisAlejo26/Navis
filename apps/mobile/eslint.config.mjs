import { expoConfig } from '@pastortools/eslint-config/expo';

export default [
  ...expoConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    ignores: [
      '.expo/**',
      'android/**',
      'ios/**',
      'dist/**',
      'expo-env.d.ts',
      'nativewind-env.d.ts',
    ],
  },
];
