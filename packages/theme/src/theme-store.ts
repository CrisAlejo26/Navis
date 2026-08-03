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

/** Crea el store de tema para una plataforma concreta. */
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
        /**
         * Solo se guarda `mode`; `systemTheme` y `resolvedTheme` se recalculan
         * al rehidratar, porque el usuario puede haber cambiado el tema del
         * sistema con la app cerrada.
         *
         * Va aquí y no en `onRehydrateStorage` a propósito: con un
         * almacenamiento síncrono (localStorage) esa callback se ejecuta
         * DENTRO de `create()`, cuando `useThemeStore` todavía está en su zona
         * muerta temporal; el ReferenceError lo silencia zustand y el tema
         * guardado se perdía en cada recarga.
         */
        merge: (persisted, current) => {
          const mode = (persisted as Partial<ThemeState> | undefined)?.mode ?? current.mode;
          const systemTheme = adapter.getSystemTheme();
          return { ...current, mode, systemTheme, resolvedTheme: resolveTheme(mode, systemTheme) };
        },
      },
    ),
  );

  const applyCurrent = (): void => {
    const { resolvedTheme, mode } = useThemeStore.getState();
    adapter.applyTheme?.(resolvedTheme, mode);
  };

  // El tema del sistema puede cambiar mientras la app está abierta.
  adapter.subscribeToSystem((systemTheme) => {
    const { mode } = useThemeStore.getState();
    const resolvedTheme = resolveTheme(mode, systemTheme);
    useThemeStore.setState({ systemTheme, resolvedTheme });
    if (mode === 'system') adapter.applyTheme?.(resolvedTheme, mode);
  });

  // Con localStorage la hidratación ya ha terminado aquí; con AsyncStorage
  // (móvil) no, y por eso hace falta además el aviso de fin de hidratación.
  applyCurrent();
  useThemeStore.persist.onFinishHydration(applyCurrent);

  return useThemeStore;
}

export type ThemeStore = ReturnType<typeof createThemeStore>;
