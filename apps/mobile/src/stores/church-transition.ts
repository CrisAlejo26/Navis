import { create } from 'zustand';

/** Bloqueo transitorio compartido; nunca se persiste en AsyncStorage. */
export const useChurchTransition = create<{ changing: boolean }>(() => ({ changing: false }));
