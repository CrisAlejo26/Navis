import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const PROPHECIES_VIEW_STORAGE_KEY = 'navis.propheciesView';

/**
 * Las cuatro formas de ver el listado (RFC 0004 D11).
 *
 * `travesia` es la de serie y el elemento firma: es la única que enseña la
 * espera **como longitud**, que es la tesis de la sección.
 */
export const PROPHECY_VIEWS = ['travesia', 'table', 'cards', 'year'] as const;

export type PropheciesView = (typeof PROPHECY_VIEWS)[number];

interface ViewState {
  view: PropheciesView;
  setView: (view: PropheciesView) => void;
}

/**
 * No va en la URL como los filtros (§7.4): la forma de verlo es preferencia de
 * quien mira, no del enlace que manda. Quien comparte «las que siguen en
 * espera» está compartiendo eso, no su gusto por las tablas.
 */
export const usePropheciesViewStore = create<ViewState>()(
  persist(
    (set) => ({
      view: 'travesia',
      setView: (view) => {
        set({ view });
      },
    }),
    {
      name: PROPHECIES_VIEW_STORAGE_KEY,
      storage: createJSONStorage(() => globalThis.localStorage),
    },
  ),
);
