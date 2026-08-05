import type { List as ListView } from '@navis/shared';

import type { List } from './list.entity';
import { parsePublicFields } from './public-fields';

/**
 * La lista tal y como la ve el panel.
 *
 * El `share_token` **solo sale si la lista está publicada**: en `private` no hay
 * enlace que enseñar y devolver el token de una despublicada sería resucitar un
 * secreto que se acaba de tirar (D11).
 */
export function toListView(list: List, memberCount: number): ListView {
  return {
    id: list.id,
    churchId: list.churchId,
    name: list.name,
    slug: list.slug,
    description: list.description,
    accent: list.accent,
    position: list.position,
    isActive: list.isActive,
    visibility: list.visibility,
    shareToken: list.visibility === 'private' ? null : list.shareToken,
    sharedAt: list.sharedAt?.toISOString() ?? null,
    shareExpiresAt: list.shareExpiresAt?.toISOString() ?? null,
    publicFields: parsePublicFields(list.publicFields),
    allowDownload: list.allowDownload,
    hasCover: Boolean(list.coverKey),
    memberCount,
  };
}

/**
 * Si la lista está viva de cara a la calle: publicada, activa y sin caducar.
 *
 * Caducada se comporta **igual que despublicada** (D13): la ruta pública da 404
 * con el mismo cuerpo, porque decir «esto existía» ya es contar algo.
 */
export function isListShared(list: List, now: Date = new Date()): boolean {
  if (list.visibility === 'private' || !list.shareToken) return false;
  if (!list.isActive || list.deletedAt) return false;

  return !list.shareExpiresAt || list.shareExpiresAt.getTime() > now.getTime();
}
