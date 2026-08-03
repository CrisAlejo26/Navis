import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const SIDEBAR_STORAGE_KEY = 'navis.sidebar';

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

/**
 * Si la barra lateral está plegada.
 *
 * Es un store y no un `useState` en el layout porque el estado sobrevive a la
 * navegación y lo consultan también la navegación y el pie de sesión. Y se
 * persiste porque quien pliega la barra para ganar ancho de trabajo no quiere
 * volver a plegarla en cada recarga.
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => {
        set((state) => ({ collapsed: !state.collapsed }));
      },
    }),
    {
      name: SIDEBAR_STORAGE_KEY,
      storage: createJSONStorage(() => globalThis.localStorage),
    },
  ),
);
