import { createThemeStore, themeColorHex, type ResolvedTheme } from '@navis/theme';
import type { StateStorage } from 'zustand/middleware';

const webStorage: StateStorage = {
  getItem: (name) => globalThis.localStorage?.getItem(name) ?? null,
  setItem: (name, value) => globalThis.localStorage?.setItem(name, value),
  removeItem: (name) => globalThis.localStorage?.removeItem(name),
};

const prefersDark = () => globalThis.matchMedia?.('(prefers-color-scheme: dark)');

/**
 * Adaptador web del store compartido: clase `dark` en <html>, `color-scheme`
 * para los controles nativos y `theme-color` para la barra del navegador.
 */
export const useThemeStore = createThemeStore({
  storage: webStorage,
  getSystemTheme: (): ResolvedTheme => (prefersDark()?.matches ? 'dark' : 'light'),
  subscribeToSystem: (listener) => {
    const media = prefersDark();
    if (!media) return () => undefined;
    const handler = (event: MediaQueryListEvent) => {
      listener(event.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', handler);
    return () => {
      media.removeEventListener('change', handler);
    };
  },
  applyTheme: (theme) => {
    const root = globalThis.document?.documentElement;
    if (!root) return;
    root.classList.toggle('dark', theme === 'dark');
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeColorHex[theme]);
  },
});
