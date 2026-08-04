import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

/**
 * Lo que la PWA dice de sí misma. Son **dos avisos muy distintos** y por eso ya
 * no se pintan igual:
 *
 * · «Ya funciona sin conexión» es una **noticia**: se lee y se olvida. Va por
 *   el mismo camino que el resto de avisos de la aplicación —arriba, a la
 *   derecha y con su propio temporizador—. Antes era una banda fija abajo que
 *   había que cerrar a mano, y en un teléfono se quedaba encima de la acción
 *   principal de la pantalla, que es justo donde va el pulgar (Regla 5 §4).
 *
 * · «Hay una versión nueva» es una **decisión**: no se va sola, porque quien
 *   está delante tiene que verla y elegir. Esa sí es una banda, pero se cierra
 *   y **no se traga los clics de alrededor**: el contenedor lleva
 *   `pointer-events-none` y solo la tarjeta los recibe, igual que el `Toaster`.
 *
 * Con `registerType: 'prompt'` la actualización nunca ocurre a espaldas de
 * nadie: recargar es siempre una pulsación.
 */
export function PwaUpdatePrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!offlineReady) return;

    toast.info(t('pwa.offlineReady'));
    // Se baja la bandera al anunciarlo: sin esto, cualquier render posterior
    // volvería a lanzar el mismo aviso.
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady, t]);

  if (!needRefresh) return null;

  return (
    <div className="inset-x-4 bottom-4 sm:right-auto sm:w-96 pointer-events-none fixed z-50">
      <div
        role="status"
        className="gap-3 p-4 shadow-lg animate-rise-in pointer-events-auto flex items-center rounded-xl border bg-popover text-popover-foreground"
      >
        <p className="text-sm flex-1">{t('pwa.updateAvailable')}</p>

        <Button
          size="sm"
          onClick={() => {
            void updateServiceWorker(true);
          }}
        >
          {t('pwa.reload')}
        </Button>

        <button
          type="button"
          aria-label={t('common.close')}
          onClick={() => {
            setNeedRefresh(false);
          }}
          className="h-7 w-7 -mr-1 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          <X size={15} aria-hidden />
        </button>
      </div>
    </div>
  );
}
