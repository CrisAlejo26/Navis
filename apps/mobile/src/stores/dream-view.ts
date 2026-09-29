import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Las cuatro formas de leer **un** sueño (RFC 0005 §7.6): `completo` es
 * «enséñamelo todo»; `lectura`, «déjame releerlo sin nada alrededor»;
 * `interpretacion`, «quiero trabajarlo, con el sueño delante»; `recorrido`,
 * «qué ha pasado con él y cuándo». Las mismas que la web.
 */
export const DREAM_DETAIL_VIEWS = ['completo', 'lectura', 'interpretacion', 'recorrido'] as const;

export type DreamDetailView = (typeof DREAM_DETAIL_VIEWS)[number];

interface ViewState {
    view: DreamDetailView;
    setView: (view: DreamDetailView) => void;
}

/** Preferencia de quien mira, no de la ficha: se recuerda entre sesiones (`navis.dreamView`). */
export const useDreamDetailViewStore = create<ViewState>()(
    persist((set) => ({ view: 'completo', setView: (view) => set({ view }) }), {
        name: 'navis.dreamView',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ view: state.view }),
    }),
);
