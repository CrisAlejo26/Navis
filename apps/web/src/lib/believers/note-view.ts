import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const NOTES_VIEW_STORAGE_KEY = 'navis.notesView';

/**
 * Las cuatro formas de leer una bitácora (§7.5).
 *
 * · `log` — hacia atrás y agrupada por meses. Es la de siempre y la de leer.
 * · `list` — una línea por nota, densa. Para escanear muchas de un vistazo.
 * · `cards` — en rejilla, para comparar en paralelo y para el teléfono.
 * · `calendar` — el año entero con un punto por nota. Enseña **los huecos**,
 *   que es lo que ninguna de las otras tres deja ver.
 */
export const NOTES_VIEWS = ['log', 'list', 'cards', 'calendar'] as const;

export type NotesView = (typeof NOTES_VIEWS)[number];

interface ViewState {
  view: NotesView;
  setView: (view: NotesView) => void;
}

/**
 * Como la del listado: es una preferencia de quien mira y no del enlace que
 * manda, así que se guarda y no va en la URL.
 */
export const useNotesViewStore = create<ViewState>()(
  persist(
    (set) => ({
      view: 'log',
      setView: (view) => {
        set({ view });
      },
    }),
    {
      name: NOTES_VIEW_STORAGE_KEY,
      storage: createJSONStorage(() => globalThis.localStorage),
    },
  ),
);
