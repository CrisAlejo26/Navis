import type { ThemeMode } from '@pastortools/shared';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

export type ResolvedTheme = 'light' | 'dark';

/**
 * Todo lo que cambia entre plataformas. Web lo implementa con matchMedia y
 * localStorage; móvil con Appearance de React Native y AsyncStorage.
 */
export interface ThemeAdapter {
  storage: StateStorage;
  getSystemTheme: () => ResolvedTheme;
  subscribeToSystem: (listener: (theme: ResolvedTheme) => void) => () => void;
  /** Efecto lateral al aplicar un tema: clase `dark` en <html>, status bar… */
  applyTheme?: (theme: ResolvedTheme, mode: ThemeMode) => void;
}

export interface ThemeState {
  mode: ThemeMode;
  systemTheme: ResolvedTheme;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  /** Alterna entre claro y oscuro dejando de seguir al sistema. */
  toggle: () => void;
}

export function resolveTheme(mode: ThemeMode, systemTheme: ResolvedTheme): ResolvedTheme {
  return mode === 'system' ? systemTheme : mode;
}

export const THEME_STORAGE_KEY = 'pastortools.theme';

/**
 * Crea el store de tema para una plataforma concreta. Solo se persiste `mode`:
 * `systemTheme` y `resolvedTheme` se recalculan siempre al arrancar, porque el
 * usuario puede haber cambiado el tema del sistema con la app cerrada.
 */
export function createThemeStore(adapter: ThemeAdapter) {
  const initialSystemTheme = adapter.getSystemTheme();

  const useThemeStore = create<ThemeState>()(
    persist(
      (set, get) => ({
        mode: 'system',
        systemTheme: initialSystemTheme,
        resolvedTheme: initialSystemTheme,

        setMode: (mode) => {
          const resolvedTheme = resolveTheme(mode, get().systemTheme);
          set({ mode, resolvedTheme });
          adapter.applyTheme?.(resolvedTheme, mode);
        },

        toggle: () => {
          const next: ThemeMode = get().resolvedTheme === 'dark' ? 'light' : 'dark';
          get().setMode(next);
        },
      }),
      {
        name: THEME_STORAGE_KEY,
        storage: createJSONStorage(() => adapter.storage),
        partialize: (state) => ({ mode: state.mode }),
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          const systemTheme = adapter.getSystemTheme();
          const resolvedTheme = resolveTheme(state.mode, systemTheme);
          useThemeStore.setState({ systemTheme, resolvedTheme });
          adapter.applyTheme?.(resolvedTheme, state.mode);
        },
      },
    ),
  );

  // El tema del sistema puede cambiar mientras la app está abierta.
  adapter.subscribeToSystem((systemTheme) => {
    const { mode } = useThemeStore.getState();
    const resolvedTheme = resolveTheme(mode, systemTheme);
    useThemeStore.setState({ systemTheme, resolvedTheme });
    if (mode === 'system') adapter.applyTheme?.(resolvedTheme, mode);
  });

  adapter.applyTheme?.(useThemeStore.getState().resolvedTheme, useThemeStore.getState().mode);

  return useThemeStore;
}

export type ThemeStore = ReturnType<typeof createThemeStore>;
