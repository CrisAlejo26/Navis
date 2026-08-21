import {
  extractTeachingBodyText,
  teachingBodySchema,
  type Teaching as TeachingView,
  type TeachingListItem,
} from '@navis/shared';

import { toExcerpt } from '../common/excerpt';
import { toIsoDay } from '../database/iso-day';
import type { Teaching } from './teaching.entity';

/**
 * `bodyJson` sale de la base de datos como texto: se valida contra el mismo
 * whitelist que el editor, nunca con un `JSON.parse` a pelo (Regla 10). Solo
 * puede fallar si la fila se corrompió por fuera de esta API, así que un
 * fallo aquí es un 500 y no un 400 — no hay una entrada de usuario que corregir.
 */
export function parseTeachingBody(bodyJson: string): TeachingView['body'] {
  return teachingBodySchema.parse(JSON.parse(bodyJson));
}

export function toTeachingView(teaching: Teaching): TeachingView {
  return {
    id: teaching.id,
    title: teaching.title,
    body: parseTeachingBody(teaching.bodyJson),
    receivedAt: toIsoDay(teaching.receivedAt),
    createdAt: teaching.createdAt.toISOString(),
  };
}

export function toListItem(teaching: Teaching): TeachingListItem {
  const { text, checklist } = extractTeachingBodyText(parseTeachingBody(teaching.bodyJson));

  return {
    id: teaching.id,
    title: teaching.title,
    excerpt: toExcerpt(text),
    receivedAt: toIsoDay(teaching.receivedAt),
    checklist,
  };
}
