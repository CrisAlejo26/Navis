import { useEffect, useState } from 'react';

/** El evento que Chrome/Edge disparan cuando la página cumple los criterios de instalación. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export interface PwaInstallPrompt {
  /** Hay un `beforeinstallprompt` guardado: se puede lanzar el diálogo nativo. */
  available: boolean;
  /** Ya se está viendo en modo aplicación: no tiene sentido ofrecer instalarla. */
  installed: boolean;
  /** Safari/iOS no dispara `beforeinstallprompt`: el gesto vive en «Compartir». */
  isIOS: boolean;
  promptInstall: () => Promise<void>;
}

/**
 * Captura `beforeinstallprompt` para poder ofrecer un botón «Instalar» propio
 * en vez de depender solo del banner automático del navegador, que no
 * siempre aparece.
 *
 * En iOS no hay evento que capturar —Safari no lo dispara nunca—, así que
 * `isIOS` deja que quien lo use enseñe en su lugar el gesto real: «Compartir
 * → Añadir a pantalla de inicio».
 */
export function usePwaInstallPrompt(): PwaInstallPrompt {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const onPrompt = (raw: Event) => {
      raw.preventDefault();
      setEvent(raw as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  return {
    available: event !== null,
    installed,
    isIOS: isIOSSafari(),
    promptInstall: async () => {
      if (!event) return;
      await event.prompt();
      setEvent(null);
    },
  };
}

function isStandalone(): boolean {
  return globalThis.matchMedia?.('(display-mode: standalone)').matches ?? false;
}

function isIOSSafari(): boolean {
  const ua = globalThis.navigator?.userAgent ?? '';
  return /iPad|iPhone|iPod/.test(ua) && !('MSStream' in globalThis);
}
