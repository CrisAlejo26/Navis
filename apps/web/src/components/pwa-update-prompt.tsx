import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { Button } from '@/components/ui/button';

/**
 * Avisa cuando hay una versión nueva del service worker. Con `registerType:
 * 'prompt'` la actualización nunca ocurre a espaldas del usuario.
 */
export function PwaUpdatePrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      role="status"
      className="inset-x-4 bottom-4 max-w-md gap-3 p-4 shadow-lg fixed z-50 mx-auto flex items-center justify-between rounded-xl border bg-card"
    >
      <p className="text-sm">{needRefresh ? t('pwa.updateAvailable') : t('pwa.offlineReady')}</p>
      {needRefresh ? (
        <Button
          size="sm"
          onClick={() => {
            void updateServiceWorker(true);
          }}
        >
          {t('pwa.reload')}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOfflineReady(false);
            setNeedRefresh(false);
          }}
        >
          {t('common.close')}
        </Button>
      )}
    </div>
  );
}
