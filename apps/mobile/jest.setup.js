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

// `expo-notifications` es nativo: en Jest no hay sistema que programe nada. El
// mock deja la programación en una lista en memoria y el permiso sin decidir;
// los tests de comportamiento inyectan su propio doble (`NotificationScheduler`).
jest.mock('expo-notifications', () => ({
    SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
    AndroidImportance: { HIGH: 4 },
    AndroidNotificationVisibility: { PUBLIC: 1 },
    getPermissionsAsync: jest.fn(() =>
        Promise.resolve({ granted: false, canAskAgain: true, status: 'undetermined' }),
    ),
    requestPermissionsAsync: jest.fn(() =>
        Promise.resolve({ granted: false, canAskAgain: false, status: 'denied' }),
    ),
    getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
    scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
    cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
    setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
    setNotificationHandler: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    getLastNotificationResponse: jest.fn(() => null),
    clearLastNotificationResponse: jest.fn(),
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
        // `__esModule` evita que la interop de babel copie el objeto (una foto de
        // sus propiedades): así un test puede reasignar un hook concreto (p. ej.
        // `useReducedMotion`) y el componente lo ve en vivo.
        __esModule: true,
        default: Animated,
        Animated,
        useSharedValue: (init) => ({ value: init }),
        useAnimatedStyle: (updater) => (typeof updater === 'function' ? updater() : {}),
        useReducedMotion: () => false,
        withSpring: (value) => value,
        withTiming: (value) => value,
        withRepeat: (value) => value,
        withSequence: (...values) => values[values.length - 1],
        withDelay: (_delay, value) => value,
        // La hoja inferior anima a mano: `Easing` envuelve el easing que le toca
        // (el mock lo atraviesa) y `runOnJS` devuelve la función tal cual.
        Easing: { linear: (f) => f, in: (f) => f, out: (f) => f, inOut: (f) => f, cubic: (f) => f },
        runOnJS: (fn) => fn,
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

// Swipeable (gesture-handler) no gesticula en Jest: el mock pinta las dos
// acciones como elementos pulsables (`swipe-left`/`swipe-right`) que disparan
// la apertura, para poder probar qué acción corre en cada lado.
jest.mock('react-native-gesture-handler', () => {
    const React = require('react');
    const { Pressable, View } = require('react-native');
    const Swipeable = ({ children, renderLeftActions, renderRightActions, onSwipeableOpen }) =>
        React.createElement(
            View,
            null,
            renderLeftActions
                ? React.createElement(
                      Pressable,
                      { key: 'l', testID: 'swipe-left', onPress: () => onSwipeableOpen('left') },
                      renderLeftActions(),
                  )
                : null,
            children,
            renderRightActions
                ? React.createElement(
                      Pressable,
                      { key: 'r', testID: 'swipe-right', onPress: () => onSwipeableOpen('right') },
                      renderRightActions(),
                  )
                : null,
        );
    return { __esModule: true, Swipeable, GestureHandlerRootView: View };
});

// i18next se inicializa una vez para toda la suite: sin esto los componentes
// renderizan las claves («theme.system») en vez del texto traducido.
require('./src/lib/i18n');

// El mock de `TextInput` de React Native no trae `setSelection`, que el editor de
// enseñanzas usa para colocar el cursor tras un Enter o una fusión de bloques.
// Va en el prototipo: no hay nada que comprobar del cursor en Jest, solo que la
// llamada existe (los tests del editor miran el documento, no la selección).
const { TextInput: MockedTextInput } = require('react-native');
if (typeof MockedTextInput.prototype.setSelection !== 'function') {
    MockedTextInput.prototype.setSelection = () => undefined;
}
