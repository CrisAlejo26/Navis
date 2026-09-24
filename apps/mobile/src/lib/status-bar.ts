import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { create } from 'zustand';

/**
 * La barra de estado es **una sola** — la monta el `_layout` raíz — y las
 * pantallas con fondo propio en la zona segura (el hero náutico del panel,
 * la escena de arcos de creyentes, el degradado de la ficha) piden su estilo
 * al entrar en foco y lo sueltan al salir. Con las pestañas y la pila
 * compitiendo por `expo-status-bar` —que siempre manda el **último montado**,
 * aunque ya no esté en pantalla: dos pestañas montadas a la vez hacían que la
 * barra del panel quedara clavada sobre el listado—, este registro hace que
 * gane siempre la pantalla enfocada. El estilo es dinámico, no de montaje.
 */

export type StatusBarStyle = 'light' | 'dark';

interface StatusBarState {
    /** El estilo reclamado por la pantalla enfocada, o `null` si nadie lo pide. */
    style: StatusBarStyle | null;
    claim: (style: StatusBarStyle) => void;
    release: () => void;
}

export const useStatusBarStore = create<StatusBarState>()((set) => ({
    style: null,
    claim: (style) => set({ style }),
    release: () => set({ style: null }),
}));

/**
 * Pide un estilo mientras la pantalla está en foco. El valor es **vivo**:
 * si cambia (el panel pasa de claro a oscuro al hacer scroll), el efecto
 * reevalúa y vuelve a reclamar — ganando sobre cualquier pantalla que se
 * quede montada debajo.
 */
export function useStatusBarClaim(style: StatusBarStyle) {
    const claim = useStatusBarStore((state) => state.claim);
    const release = useStatusBarStore((state) => state.release);

    useFocusEffect(
        useCallback(() => {
            claim(style);
            return release;
        }, [claim, release, style]),
    );
}
