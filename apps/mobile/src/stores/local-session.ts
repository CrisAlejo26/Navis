import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * La sesión **local** (RFC 0024, Fase 1): quién entró y en qué iglesia
 * trabaja. Vive en AsyncStorage — no es secreta; los secretos (el hash de la
 * contraseña y el pepper) están en SecureStore y en la base local.
 */

export interface LocalSession {
    userId: string;
    /** Nulo entre el registro y crear la iglesia: es lo que manda a `church-setup`. */
    churchId: string | null;
}

interface LocalSessionState {
    session: LocalSession | null;
    hydrated: boolean;
    setHydrated: () => void;
    setSession: (session: LocalSession) => void;
    setChurch: (churchId: string) => void;
    clear: () => void;
}

export const useLocalSession = create<LocalSessionState>()(
    persist(
        (set) => ({
            session: null,
            hydrated: false,
            setHydrated: () => set({ hydrated: true }),
            setSession: (session) => set({ session }),
            setChurch: (churchId) =>
                set((state) =>
                    state.session ? { session: { ...state.session, churchId } } : state,
                ),
            clear: () => set({ session: null }),
        }),
        {
            name: 'navis:local-session',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ session: state.session }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        },
    ),
);
