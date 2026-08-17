import { useExitPublicList } from '@navis/api-client';
import type { PublicList } from '@navis/shared';
import { Download, FileText, LogOut } from 'lucide-react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { InstallListButton } from '@/components/lists/install-list-button';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { publicApi } from '@/lib/lists/public-api';
import { useListDownload } from '@/lib/lists/use-list-download';

/**
 * El pie de la página pública (RFC 0010 §8.6 punto 3, D40).
 *
 * La fecha, la descarga y **el barco con «Hecho con Navis»**, pequeño: ni barra
 * lateral, ni selector de iglesia, ni «iniciar sesión» arriba a la derecha.
 * Quien abre ese enlace no es un usuario, es alguien de la congregación mirando
 * quién predica el domingo.
 *
 * En una restringida, además, **quién eres** y «Salir»: sin eso, en un teléfono
 * prestado nadie sabe con qué llave está entrando.
 */
export function PublicFooter({
  list,
  token,
  poster,
}: {
  list: PublicList;
  token: string;
  poster: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useTranslation();
  const download = useListDownload(poster, list.name);
  const exit = useExitPublicList(publicApi, token);

  return (
    <footer className="gap-4 pt-8 mt-10 flex flex-wrap items-center justify-between border-t">
      <div className="gap-1 flex flex-col">
        <p className="text-xs text-muted-foreground">
          {t('lists.updatedAt', { date: formatDate(list.updatedAt) })}
        </p>

        {list.restricted && list.viewerLabel && (
          <p className="gap-2 text-xs flex items-center text-muted-foreground">
            {t('lists.viewingAs', { name: list.viewerLabel })}
            <button
              type="button"
              onClick={() => {
                exit.mutate(undefined, {
                  onSuccess: () => {
                    globalThis.location.reload();
                  },
                });
              }}
              className="gap-1 font-medium inline-flex cursor-pointer items-center text-foreground underline-offset-4 hover:underline"
            >
              <LogOut size={12} aria-hidden />
              {t('lists.exit')}
            </button>
          </p>
        )}
      </div>

      <div className="gap-2 flex flex-wrap items-center">
        {list.allowDownload && (
          <>
            <Button variant="secondary" size="sm" isLoading={download.busy} onClick={download.pdf}>
              <FileText size={14} aria-hidden />
              {t('lists.downloadPdf')}
            </Button>
            <Button variant="ghost" size="sm" isLoading={download.busy} onClick={download.png}>
              <Download size={14} aria-hidden />
              {t('lists.downloadImage')}
            </Button>
          </>
        )}

        <InstallListButton />

        <span className="gap-1.5 inline-flex items-center text-[11px] text-muted-foreground">
          <Logo className="h-4 w-4" />
          {t('lists.madeWith')}
        </span>
      </div>
    </footer>
  );
}
