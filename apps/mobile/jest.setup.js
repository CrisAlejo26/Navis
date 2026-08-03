/* eslint-disable @typescript-eslint/no-require-imports */

// AsyncStorage no existe en el entorno de Jest: su mock oficial guarda en memoria.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-localization consulta el sistema operativo; en los tests fijamos español
// para que las aserciones no dependan del idioma de quien ejecuta la suite.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'es', languageTag: 'es-ES' }],
  getCalendars: () => [],
}));

jest.mock('expo-secure-store', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

// i18next se inicializa una vez para toda la suite: sin esto los componentes
// renderizan las claves («theme.system») en vez del texto traducido.
require('./src/lib/i18n');
