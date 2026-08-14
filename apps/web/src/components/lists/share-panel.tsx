import { useShareList, useUnshareList } from '@navis/api-client';
import type { List, ListMember, ListPublicFields, ListVisibility } from '@navis/shared';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  CoverUploader,
  type CoverUploader as CoverUploaderHandle,
} from '@/components/lists/cover-uploader';
import { DownloadToggle } from '@/components/lists/download-toggle';
import { PublicFieldsPicker } from '@/components/lists/public-fields-picker';
import { ShareLinkBlock } from '@/components/lists/share-link-block';
import { ShareViewersBlock } from '@/components/lists/share-viewers-block';
import { VisibilityPicker } from '@/components/lists/visibility-picker';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { shareLinkFor } from '@/lib/lists/share-link';
import { toast } from '@/lib/toast';

/**
 * La pestaña **Compartir** (RFC 0010 §8.5).
 *
 * Se lee de arriba abajo como una decisión y no como un panel de ajustes: el
 * modo, el enlace con su tarjeta, quién puede verla, qué se ve de cada persona,
 * la caducidad y, al final y en rojo, dejar de compartir.
 *
 * Publicar abre una confirmación que dice **qué campos van a salir y quién va a
 * poder verlos** (D8), y al pasar de abierta a con acceso avisa de que el enlace
 * va a cambiar y por qué (D12).
 */
export function SharePanel({
  list,
  churchName,
  members,
}: {
  list: List;
  churchName: string;
  members: readonly ListMember[];
}) {
  const { t } = useTranslation();
  const share = useShareList(api);
  const unshare = useUnshareList(api);
  const cover = useRef<CoverUploaderHandle>(null);

  const [mode, setMode] = useState<ListVisibility>(list.visibility);
  const [fields, setFields] = useState<ListPublicFields>(list.publicFields);
  const [expiresAt, setExpiresAt] = useState(list.shareExpiresAt?.slice(0, 10) ?? '');
  const [allowDownload, setAllowDownload] = useState(list.allowDownload);
  const [confirmando, setConfirmando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = list.shareToken ? shareLinkFor(list.shareToken, api.baseUrl) : '';
  const rotará = list.visibility === 'link' && mode === 'restricted';

  const aplicar = () => {
    setError(null);

    share.mutate(
      {
        listId: list.id,
        visibility: mode,
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
        publicFields: fields,
        allowDownload,
      },
      {
        onSuccess: (estado) => {
          setConfirmando(false);
          toast.success(estado.tokenRotated ? t('lists.rotateWarning') : t('lists.published'));
          // La portada se compone y se sube **después** de publicar: hasta ese
          // momento no se sabe en qué modo va a quedar la lámina (D18).
          void cover.current?.upload();
        },
        onError: (cause: Error) => {
          setConfirmando(false);
          setError(cause.message);
        },
      },
    );
  };

  return (
    <div className="gap-6 max-w-4xl flex flex-col">
      {/* De `lg` para arriba, dos columnas —el modo y el enlace a la
          izquierda, lo que se ve y la caducidad a la derecha— para no obligar
          a bajar tanto en una pantalla ancha (Regla 5). En móvil, una sola
          columna con el mismo orden de siempre. */}
      <div className="gap-6 lg:grid-cols-2 grid">
        <div className="gap-6 flex flex-col">
          <VisibilityPicker value={mode} onChange={setMode} />

          {list.visibility !== 'private' && url && (
            <ShareLinkBlock list={list} churchName={churchName} url={url} />
          )}

          {mode === 'restricted' && <ShareViewersBlock list={list} url={url} />}
        </div>

        <div className="gap-6 flex flex-col">
          <PublicFieldsPicker fields={fields} onChange={setFields} />

          <DownloadToggle value={allowDownload} onChange={setAllowDownload} />

          <Input
            type="date"
            name="expiresAt"
            label={t('lists.expiresAt')}
            hint={t('lists.expiresHint')}
            value={expiresAt}
            onChange={(event) => {
              setExpiresAt(event.target.value);
            }}
          />
        </div>
      </div>

      <FormError message={error} />

      <div className="gap-2 flex flex-wrap">
        <Button
          size="lg"
          isLoading={share.isPending}
          onClick={() => {
            if (mode === 'private') {
              setCerrando(true);
              return;
            }
            setConfirmando(true);
          }}
        >
          {list.visibility === 'private' ? t('lists.publish') : t('common.save')}
        </Button>

        {list.visibility !== 'private' && (
          <Button
            variant="destructive"
            onClick={() => {
              setCerrando(true);
            }}
          >
            {t('lists.unpublish')}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmando}
        onClose={() => {
          setConfirmando(false);
        }}
        onConfirm={aplicar}
        title={t('lists.publish')}
        description={`${t('lists.publishFields')} ${rotará ? t('lists.rotateWarning') : ''}`.trim()}
        confirmLabel={t('lists.publish')}
        isPending={share.isPending}
      />

      <ConfirmDialog
        open={cerrando}
        onClose={() => {
          setCerrando(false);
        }}
        onConfirm={() => {
          unshare.mutate(list.id, {
            onSuccess: () => {
              setMode('private');
              setCerrando(false);
              toast.success(t('lists.unpublished'));
            },
          });
        }}
        title={t('lists.unpublish')}
        description={t('lists.unpublishExplain')}
        confirmLabel={t('lists.unpublish')}
        destructive
        isPending={unshare.isPending}
      />

      <CoverUploader
        ref={cover}
        list={{ ...list, visibility: mode }}
        churchName={churchName}
        members={members}
        fields={fields}
      />
    </div>
  );
}
