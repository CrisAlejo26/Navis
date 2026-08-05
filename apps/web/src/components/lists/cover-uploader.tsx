import { useUploadListCover } from '@navis/api-client';
import {
  toPublicListMember,
  type List,
  type ListMember,
  type ListPublicFields,
} from '@navis/shared';
import { useCallback, useImperativeHandle, useRef, type Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { ListPoster } from '@/components/lists/list-poster';
import { api } from '@/lib/api';
import { nodeToPng } from '@/lib/share/rasterize';

export interface CoverUploader {
  /** Compone la lámina, la rasteriza y la sube. Falla en silencio: es un extra. */
  upload: () => Promise<void>;
}

/**
 * **La imagen de la tarjeta la hace el navegador de quien comparte** (RFC 0010
 * D18).
 *
 * Generarla en el servidor pediría un navegador dentro del contenedor de la API
 * —cientos de megas y un proceso más que vigilar— para hacer lo que el
 * rasterizador del RFC 0002 ya hace gratis aquí.
 *
 * Si algo falla no se rompe nada: sin portada, la tarjeta cae al `og-image.png`
 * de siempre. Se degrada, no se rompe.
 */
export function CoverUploader({
  ref,
  list,
  churchName,
  members,
  fields,
}: {
  ref: Ref<CoverUploader>;
  list: List;
  churchName: string;
  members: readonly ListMember[];
  fields: ListPublicFields;
}) {
  const { t } = useTranslation();
  const poster = useRef<HTMLDivElement>(null);
  const upload = useUploadListCover(api);
  const bloqueada = list.visibility === 'restricted';

  const subir = useCallback(async () => {
    const node = poster.current;
    if (!node) return;

    try {
      await upload.mutateAsync({ listId: list.id, file: await nodeToPng(node, 1) });
    } catch {
      // Sin portada la tarjeta sigue saliendo: no hay nada que avisar aquí.
    }
  }, [list.id, upload]);

  useImperativeHandle(ref, () => ({ upload: subir }), [subir]);

  return (
    <div aria-hidden className="top-0 pointer-events-none absolute -left-[9999px]">
      <ListPoster
        ref={poster}
        churchName={churchName}
        name={list.name}
        accent={list.accent}
        // En restringida la portada es otra: ni un nombre, ni el número (D18).
        members={bloqueada ? [] : members.map((one) => toPublicListMember(one, fields))}
        locked={bloqueada}
        lockedLabel={t('lists.lockedCover')}
      />
    </div>
  );
}
