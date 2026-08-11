import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const JOURNAL_VIEW_STORAGE_KEY = 'navis.journalView';

/** Las tres formas de ver el listado (RFC 0017 D9, §7.5). */
export const JOURNAL_VIEWS = ['cards', 'table', 'calendar'] as const;

export type JournalView = (typeof JOURNAL_VIEWS)[number];

interface ViewState {
  view: JournalView;
  setView: (view: JournalView) => void;
}

/**
 * No va en la URL como los filtros: la forma de verlo es preferencia de quien
 * mira, no del enlace que manda (mismo criterio que profecías y creyentes).
 */
export const useJournalViewStore = create<ViewState>()(
  persist(
    (set) => ({
      view: 'cards',
      setView: (view) => {
        set({ view });
      },
    }),
    {
      name: JOURNAL_VIEW_STORAGE_KEY,
      storage: createJSONStorage(() => globalThis.localStorage),
    },
  ),
);
