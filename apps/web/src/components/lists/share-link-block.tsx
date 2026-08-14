import { useRotateListLink } from '@navis/api-client';
import type { List } from '@navis/shared';
import { Copy, ExternalLink, Link2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SharePreview } from '@/components/lists/share-preview';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { copyToClipboard } from '@/lib/lists/share-link';
import { toast } from '@/lib/toast';

/**
 * El enlace de una lista publicada, con su vista previa (RFC 0010 §8.5 punto 2).
 *
 * «Cambiar el enlace» está aquí y no escondido en un menú: es lo que hace falta
 * cuando un enlace se filtra y no se quiere cerrar la lista a quien la usa bien
 * (D11). Y avisa de lo que cuesta: hay que volver a repartirlo.
 */
export function ShareLinkBlock({
  list,
  churchName,
  url,
}: {
  list: List;
  churchName: string;
  url: string;
}) {
  const { t } = useTranslation();
  const rotate = useRotateListLink(api);

  return (
    <div className="gap-3 flex flex-col">
      <div className="p-3 gap-3 flex flex-wrap items-center rounded-lg border bg-muted/40">
        <Link2 size={16} aria-hidden className="shrink-0 text-muted-foreground" />
        <code className="min-w-0 text-xs flex-1 break-all">{url}</code>

        <div className="gap-1.5 flex">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void copyToClipboard(url).then((ok) => {
                if (ok) toast.success(t('lists.copied'));
              });
            }}
          >
            <Copy size={14} aria-hidden />
            {t('lists.copyLink')}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
          >
            <ExternalLink size={14} aria-hidden />
            {t('lists.openLink')}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            isLoading={rotate.isPending}
            onClick={() => {
              rotate.mutate(list.id, {
                onSuccess: () => {
                  toast.success(t('lists.rotateWarning'));
                },
              });
            }}
          >
            <RefreshCw size={14} aria-hidden />
            {t('lists.rotateLink')}
          </Button>
        </div>
      </div>

      <SharePreview list={list} churchName={churchName} url={url} />
    </div>
  );
}
