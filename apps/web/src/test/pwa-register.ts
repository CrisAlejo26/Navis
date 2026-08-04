import { useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Doble de `virtual:pwa-register/react`.
 *
 * Ese módulo lo inyecta el plugin de la PWA, que **no está** en la
 * configuración de test (ver el alias de `vitest.config.ts`): sin esto,
 * cualquier test que monte el aviso de actualización moriría con «cannot find
 * module». Aquí se implementa lo justo que usa el componente.
 *
 * Los tests escriben en `serviceWorker` **antes** de renderizar, y el
 * componente lo lee como si viniera del plugin de verdad.
 */
export const serviceWorker = {
  needRefresh: false,
  offlineReady: false,
  /** Cuántas veces se ha pedido actualizar. Es lo que comprueba el test. */
  updates: 0,
};

/** Vuelve a dejarlo como estaba. Se llama entre tests. */
export function resetServiceWorker(): void {
  serviceWorker.needRefresh = false;
  serviceWorker.offlineReady = false;
  serviceWorker.updates = 0;
}

interface RegisterSW {
  needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
  offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
  updateServiceWorker: (reload?: boolean) => Promise<void>;
}

export function useRegisterSW(): RegisterSW {
  const needRefresh = useState(serviceWorker.needRefresh);
  const offlineReady = useState(serviceWorker.offlineReady);

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: () => {
      serviceWorker.updates += 1;
      return Promise.resolve();
    },
  };
}
