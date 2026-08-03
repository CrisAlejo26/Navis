import type { StateStorage } from 'zustand/middleware';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createThemeStore,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
} from './theme-store';

/** Almacenamiento en memoria SÍNCRONO, como el localStorage del navegador. */
function memoryStorage(initial: Record<string, string> = {}): StateStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => void data.set(name, value),
    removeItem: (name) => void data.delete(name),
  };
}

const persisted = (mode: string) => JSON.stringify({ state: { mode }, version: 0 });

describe('resolveTheme', () => {
  it('sigue al sistema en modo `system` y lo ignora en el resto', () => {
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
  });
});

describe('createThemeStore', () => {
  let systemTheme: ResolvedTheme;

  beforeEach(() => {
    systemTheme = 'light';
  });

  const buildAdapter = (storage: StateStorage) => ({
    storage,
    getSystemTheme: () => systemTheme,
    subscribeToSystem: () => () => undefined,
    applyTheme: vi.fn(),
  });

  it('arranca siguiendo al sistema cuando no hay nada guardado', () => {
    const adapter = buildAdapter(memoryStorage());
    const useThemeStore = createThemeStore(adapter);

    expect(useThemeStore.getState().mode).toBe('system');
    expect(adapter.applyTheme).toHaveBeenLastCalledWith('light', 'system');
  });

  /**
   * Regresión: con almacenamiento síncrono la hidratación ocurre dentro de
   * `create()`. Si el tema se aplicase leyendo el store desde una callback de
   * rehidratación, se perdería la preferencia guardada en cada recarga.
   */
  it('recupera el tema guardado y lo aplica al arrancar', () => {
    const adapter = buildAdapter(memoryStorage({ [THEME_STORAGE_KEY]: persisted('dark') }));
    const useThemeStore = createThemeStore(adapter);

    expect(useThemeStore.getState().mode).toBe('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(adapter.applyTheme).toHaveBeenLastCalledWith('dark', 'dark');
  });

  it('recalcula el tema del sistema al rehidratar, no usa el que se guardó', () => {
    systemTheme = 'dark';
    const adapter = buildAdapter(memoryStorage({ [THEME_STORAGE_KEY]: persisted('system') }));
    const useThemeStore = createThemeStore(adapter);

    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
  });

  it('persiste el modo al cambiarlo', () => {
    const storage = memoryStorage();
    const useThemeStore = createThemeStore(buildAdapter(storage));

    useThemeStore.getState().setMode('dark');

    expect(storage.getItem(THEME_STORAGE_KEY)).toContain('"mode":"dark"');
  });

  it('`toggle` deja de seguir al sistema', () => {
    const useThemeStore = createThemeStore(buildAdapter(memoryStorage()));

    useThemeStore.getState().toggle();

    expect(useThemeStore.getState().mode).toBe('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
  });
});
