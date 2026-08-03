import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

/** Cuánto se queda cada aviso. El error dura más: hay algo que leer. */
const DURATION: Record<ToastKind, number> = {
  success: 4000,
  info: 4000,
  error: 7000,
};

let nextId = 0;

/**
 * Los avisos de la aplicación: confirman que una acción ha salido —o que no—.
 *
 * El store es de zustand, como el de tema, y la API de fuera (`toast.success`)
 * no es un hook: así se puede llamar desde el `onSuccess` de una mutación o
 * desde cualquier sitio que no sea un componente.
 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, message) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, kind, message }] }));
    setTimeout(() => {
      get().dismiss(id);
    }, DURATION[kind]);
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
  },
}));

export const toast = {
  success: (message: string): void => {
    useToastStore.getState().push('success', message);
  },
  error: (message: string): void => {
    useToastStore.getState().push('error', message);
  },
  info: (message: string): void => {
    useToastStore.getState().push('info', message);
  },
};
