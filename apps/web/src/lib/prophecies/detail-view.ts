import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const PROPHECY_DETAIL_VIEW_STORAGE_KEY = 'navis.prophecyView';

/**
 * Las cuatro formas de leer **una** profecía (RFC 0004 §7.6).
 *
 * No son cuatro adornos: cada una responde a una pregunta distinta.
 * `bitacora` es «qué ha pasado, en orden»; `lectura` es «déjame releerla
 * entera»; `recorrido` es «cuándo pasó cada cosa»; `fichas` es «enséñamelo
 * todo a la vez».
 */
export const PROPHECY_DETAIL_VIEWS = ['bitacora', 'lectura', 'recorrido', 'fichas'] as const;

export type ProphecyDetailView = (typeof PROPHECY_DETAIL_VIEWS)[number];

interface ViewState {
  view: ProphecyDetailView;
  setView: (view: ProphecyDetailView) => void;
}

/** Como el resto de las vistas: preferencia de quien mira, no del enlace (D11). */
export const useProphecyDetailViewStore = create<ViewState>()(
  persist(
    (set) => ({
      view: 'bitacora',
      setView: (view) => {
        set({ view });
      },
    }),
    {
      name: PROPHECY_DETAIL_VIEW_STORAGE_KEY,
      storage: createJSONStorage(() => globalThis.localStorage),
    },
  ),
);
