/**
 * Única app del monorepo con Jest en vez de Vitest: el preset `jest-expo` es
 * lo que sabe transformar React Native, y no hay equivalente para Vitest.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Estos paquetes se publican en ESM sin compilar: hay que pasarlos por Babel.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css|@navis/.*))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
  // El runner de CI es bastante más lento que una máquina de desarrollo: un
  // `render` async (Testing Library 14) que aquí tarda milisegundos llegó a
  // superar los 5000 ms por defecto de Jest en GitHub Actions y tumbó el PR
  // sin que el componente tuviera ningún fallo real.
  testTimeout: 15000,
};
