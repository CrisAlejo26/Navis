import type { List } from '@navis/shared';
import type { TFunction } from 'i18next';

import { formatDate } from '@/lib/format';

/**
 * Lo que va a decir la tarjeta al pegar el enlace, **en el idioma de quien la
 * reparte** (RFC 0010 §8.5).
 *
 * Es la pareja de `apps/api/src/lists/share-description.ts`, que escribe ese
 * mismo renglón en el `og:description`. Son dos porque no son lo mismo: el
 * servidor no sabe en qué idioma está quien va a abrir el enlace y lo escribe
 * en español, mientras que esto es interfaz y va traducido (Regla 2 §6). Lo que
 * sí tiene que coincidir son **las ramas**: si allí cambia una, aquí también.
 */
export function shareCardDescription(list: List, t: TFunction): string {
  const propia = list.description?.trim();
  if (propia) return propia;

  // En restringida no se cuenta a nadie: el número también es un dato (D18).
  if (list.visibility === 'restricted') return t('lists.lockedDescription');

  return `${cuantas(list.memberCount, t)} ${t('lists.previewUpdated', {
    date: formatDate(list.updatedAt),
  })}`;
}

function cuantas(total: number, t: TFunction): string {
  if (total === 0) return t('lists.previewEmpty');
  if (total === 1) return t('lists.previewOne');

  // `total` y no `count`: con `count`, i18next buscaría las formas del plural
  // y las categorías no son las mismas en los seis idiomas (Regla 2 §8).
  return t('lists.previewMany', { total });
}
