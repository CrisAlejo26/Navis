import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Con qué instalación está vinculado este teléfono (Fase 1 del plan de
 * sincronización). No es secreto —la credencial está en SecureStore— y no
 * mueve datos: solo recuerda el destino y la cuenta para pintar el estado y
 * poder revocar. Sin `link`, el teléfono trabaja en modo local.
 */
export interface SyncLink {
    apiUrl: string;
    installationName: string;
    deviceId: string;
    deviceName: string;
    account: { id: string; name: string; email: string };
    linkedAt: string;
}

interface SyncConnectionState {
    link: SyncLink | null;
    setLink: (link: SyncLink) => void;
    clear: () => void;
}

export const useSyncConnection = create<SyncConnectionState>()(
    persist(
        (set) => ({
            link: null,
            setLink: (link) => set({ link }),
            clear: () => set({ link: null }),
        }),
        {
            name: 'navis:sync-connection',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ link: state.link }),
        },
    ),
);
