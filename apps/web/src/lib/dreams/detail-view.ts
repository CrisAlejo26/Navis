import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const DREAM_DETAIL_VIEW_STORAGE_KEY = 'navis.dreamView';

/**
 * Las cuatro formas de leer **un** sueño (RFC 0005 §7.6).
 *
 * No son cuatro adornos, y ninguna es una variante de otra: `completo` es
 * «enséñamelo todo»; `lectura` es «déjame releerlo sin nada alrededor»;
 * `interpretacion` es «quiero trabajarlo, con el sueño delante»; `recorrido` es
 * «qué ha pasado con él y cuándo».
 *
 * Son las mismas cuatro preguntas que en profecías (RFC 0004 D21), respondidas
 * con lo que tiene un sueño: aquí no hay cumplimientos parciales que listar,
 * hay una interpretación que se reescribe.
 */
export const DREAM_DETAIL_VIEWS = ['completo', 'lectura', 'interpretacion', 'recorrido'] as const;

export type DreamDetailView = (typeof DREAM_DETAIL_VIEWS)[number];

interface ViewState {
  view: DreamDetailView;
  setView: (view: DreamDetailView) => void;
}

/** Como el resto de las vistas: preferencia de quien mira, no del enlace. */
export const useDreamDetailViewStore = create<ViewState>()(
  persist(
    (set) => ({
      view: 'completo',
      setView: (view) => {
        set({ view });
      },
    }),
    {
      name: DREAM_DETAIL_VIEW_STORAGE_KEY,
      storage: createJSONStorage(() => globalThis.localStorage),
    },
  ),
);
