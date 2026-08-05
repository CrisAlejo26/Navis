import { believerName, type ListViewer as ListViewerView } from '@navis/shared';

import type { Believer } from '../believers/believer.entity';
import type { ListViewer } from './list-viewer.entity';

/**
 * El acceso tal y como sale de la API.
 *
 * **Sin contraseña ni hash, nunca** (§7.2): `listViewerSchema` no tiene el
 * campo y no hay ningún `GET` que lo devuelva. La contraseña en claro sale
 * exactamente en tres respuestas —crear, regenerar y el lote de D29— y en
 * ninguna más.
 */
export function toListViewerView(
  viewer: ListViewer,
  listIds: readonly string[],
  believer?: Believer,
): ListViewerView {
  return {
    id: viewer.id,
    churchId: viewer.churchId,
    believerId: viewer.believerId,
    believerName: believer ? believerName(believer) : null,
    believerHasPhoto: Boolean(believer?.photoKey),
    username: viewer.username,
    label: viewer.label,
    isActive: viewer.isActive,
    expiresAt: viewer.expiresAt?.toISOString() ?? null,
    lastSeenAt: viewer.lastSeenAt?.toISOString() ?? null,
    createdAt: viewer.createdAt.toISOString(),
    listIds: [...listIds],
  };
}

/**
 * Si el acceso puede entrar hoy: activo y sin caducar (D13, D26).
 *
 * La caducidad del acceso va aparte de la de la lista y **manda la primera de
 * las dos que llegue**.
 */
export function isViewerUsable(viewer: ListViewer, now: Date = new Date()): boolean {
  if (!viewer.isActive || viewer.deletedAt) return false;
  return !viewer.expiresAt || viewer.expiresAt.getTime() > now.getTime();
}
