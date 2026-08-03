import { baseConfig } from '@fidus/eslint-config';

export default [
  ...baseConfig({ tsconfigRootDir: import.meta.dirname }),
  { ignores: ['src-tauri/target/**', 'src-tauri/gen/**'] },
];
