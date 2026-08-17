import { Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { usePwaInstallPrompt } from '@/lib/pwa-install';

/**
 * El botón «Instalar» del pie de la página pública de una lista (RFC 0010,
 * ampliación «PWA por lista»). Instalada desde aquí, el icono que queda en la
 * pantalla de inicio abre esta lista directamente — el enlace lleva su propio
 * manifest, con `start_url` a `/lists/s/<token>` en vez de a `/`.
 *
 * No basta con confiar en el banner automático del navegador: sus
 * heurísticas no siempre lo enseñan, y quien reparte una lista de púlpito
 * necesita un botón que pueda señalar con el dedo.
 *
 * En iOS no hay diálogo que lanzar por programa —Safari no dispara
 * `beforeinstallprompt`—, así que en su lugar se dice dónde está el gesto de
 * verdad.
 */
export function InstallListButton() {
  const { t } = useTranslation();
  const install = usePwaInstallPrompt();

  if (install.installed) return null;

  if (install.isIOS) {
    return (
      <p className="text-xs max-w-[16rem] text-muted-foreground">{t('lists.installAppHint')}</p>
    );
  }

  if (!install.available) return null;

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        void install.promptInstall();
      }}
    >
      <Smartphone size={14} aria-hidden />
      {t('lists.installApp')}
    </Button>
  );
}
