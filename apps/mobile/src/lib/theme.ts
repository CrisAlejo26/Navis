import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '@pastortools/shared';
import { createThemeStore, themeColorHex, type ResolvedTheme } from '@pastortools/theme';
import * as SystemUI from 'expo-system-ui';
import { Appearance, type ColorSchemeName } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

const nativeStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

/**
 * Último modo aplicado. Hace falta porque `Appearance.setColorScheme()`
 * dispara el mismo evento que un cambio real del sistema: sin esta marca,
 * forzar el modo oscuro se registraría como «el sistema está en oscuro».
 */
let currentMode: ThemeMode = 'system';

/** `ColorSchemeName` incluye `'unspecified'`; nuestro tema solo claro u oscuro. */
const toResolved = (scheme: ColorSchemeName | null | undefined): ResolvedTheme =>
  scheme === 'dark' ? 'dark' : 'light';

let systemTheme: ResolvedTheme = toResolved(Appearance.getColorScheme());

/**
 * Adaptador móvil del store compartido. En React Native el modo oscuro no es
 * una clase CSS: NativeWind lo resuelve con el colorScheme de `Appearance`,
 * que react-native-css traduce a `prefers-color-scheme`.
 */
export const useThemeStore = createThemeStore({
  storage: nativeStorage,
  getSystemTheme: () => systemTheme,
  subscribeToSystem: (listener) => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Con un tema forzado, el evento lo hemos provocado nosotros.
      if (currentMode !== 'system') return;
      systemTheme = toResolved(colorScheme);
      listener(systemTheme);
    });
    return () => {
      subscription.remove();
    };
  },
  applyTheme: (theme, mode) => {
    currentMode = mode;
    // `'unspecified'` devuelve el control al sistema operativo.
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : theme);
    void SystemUI.setBackgroundColorAsync(themeColorHex[theme]);
  },
});
