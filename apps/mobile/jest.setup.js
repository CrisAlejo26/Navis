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

// Reanimated corre con worklets en el hilo de UI. Su mock oficial arrastra el
// módulo nativo de react-native-worklets y revienta en Jest («loadUnpackers»),
// así que se sustituye por un stub que resuelve las animaciones al instante:
// estilos calculados al momento y entering/exiting que no hacen nada.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const entering = {
    duration: () => entering,
    delay: () => entering,
    springify: () => entering,
    damping: () => entering,
  };
  const Animated = { View, createAnimatedComponent: (Component) => Component };
  return {
    ...Animated,
    default: Animated,
    useSharedValue: (init) => ({ value: init }),
    useAnimatedStyle: (updater) => (typeof updater === 'function' ? updater() : {}),
    useReducedMotion: () => false,
    withSpring: (value) => value,
    withTiming: (value) => value,
    withSequence: (...values) => values[values.length - 1],
    withDelay: (_delay, value) => value,
    FadeIn: entering,
    FadeOut: entering,
    FadeInDown: entering,
    FadeOutDown: entering,
    SlideInDown: entering,
    SlideOutDown: entering,
    ZoomIn: entering,
    ZoomOut: entering,
  };
});

// El mock oficial resuelve los insets sin tener que envolver cada test en un
// `SafeAreaProvider`: cae a un valor por defecto si no hay uno alrededor.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// i18next se inicializa una vez para toda la suite: sin esto los componentes
// renderizan las claves («theme.system») en vez del texto traducido.
require('./src/lib/i18n');
