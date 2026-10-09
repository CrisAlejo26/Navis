import type { IdentityLink } from '@navis/shared';
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
    /**
     * Qué usuario local es qué cuenta remota. Solo entra quien vincula, y verificado:
     * el código salió de una sesión de esa cuenta. Los demás usuarios locales siguen
     * siendo autores históricos sin acceso (`sync-identity`).
     */
    identities: IdentityLink[];
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
            // Un vínculo guardado antes de existir `identities` no la trae: se le da vacía.
            merge: (persisted, current) => {
                const stored = (persisted as { link?: Partial<SyncLink> | null } | undefined)?.link;
                return {
                    ...current,
                    link: stored ? ({ identities: [], ...stored } as SyncLink) : null,
                };
            },
        },
    ),
);
