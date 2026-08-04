import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const BELIEVERS_VIEW_STORAGE_KEY = 'navis.believersView';

export type BelieversView = 'table' | 'cards';

interface ViewState {
  view: BelieversView;
  setView: (view: BelieversView) => void;
}

/**
 * Tabla o fichas.
 *
 * No va en la URL como el resto de los filtros (§7.2): la forma de verlo es una
 * preferencia de quien mira, no del enlace que manda. Quien comparte «los que
 * piden atención en Elda» está compartiendo eso, no su gusto por las tablas.
 */
export const useBelieversViewStore = create<ViewState>()(
  persist(
    (set) => ({
      view: 'table',
      setView: (view) => {
        set({ view });
      },
    }),
    {
      name: BELIEVERS_VIEW_STORAGE_KEY,
      storage: createJSONStorage(() => globalThis.localStorage),
    },
  ),
);
