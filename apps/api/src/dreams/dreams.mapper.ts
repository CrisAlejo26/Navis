import {
  dreamState,
  type Dream as DreamView,
  type DreamAudio as DreamAudioView,
  type DreamExportRow,
  type DreamListItem,
  type Emotion as EmotionView,
} from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import type { DreamAudio } from './dream-audio.entity';
import type { Dream } from './dream.entity';
import type { Emotion } from './emotion.entity';

/** Cuánto del cuerpo viaja en el listado. Suficiente para tres líneas (§6.1). */
const EXCERPT_LENGTH = 160;

export function toEmotionView(emotion: Emotion): EmotionView {
  return {
    id: emotion.id,
    slug: emotion.slug,
    name: emotion.name,
    accent: emotion.accent,
    position: emotion.position,
  };
}

export function toDreamAudioView(audio: DreamAudio): DreamAudioView {
  return {
    id: audio.id,
    dreamId: audio.dreamId,
    mimeType: audio.mimeType,
    sizeBytes: audio.sizeBytes,
    durationSeconds: audio.durationSeconds,
    recorded: audio.recorded,
    createdAt: audio.createdAt.toISOString(),
  };
}

/**
 * La ficha entera.
 *
 * Las emociones llegan aparte y no cargadas en la relación: la tabla puente
 * guarda identificadores, como `believer_gifts`, y resolverlas es una consulta
 * que sirve para toda una página de sueños a la vez.
 */
export function toDreamView(dream: Dream, emotions: readonly Emotion[]): DreamView {
  return {
    id: dream.id,
    title: dream.title,
    body: dream.body,
    dreamedAt: toIsoDay(dream.dreamedAt),
    interpretation: dream.interpretation,
    fulfilledAt: dream.fulfilledAt ? toIsoDay(dream.fulfilledAt) : null,
    fulfillmentMeaning: dream.fulfillmentMeaning,
    emotions: emotions.map(toEmotionView),
    audios: (dream.audios ?? []).map(toDreamAudioView),
    createdAt: dream.createdAt.toISOString(),
  };
}

/**
 * La fila del listado, con el estado ya calculado: la interfaz no tiene que
 * volver a pedir nada para pintarla (§6.1).
 */
export function toListItem(
  dream: Dream,
  emotions: readonly Emotion[],
  audiosCount: number,
): DreamListItem {
  const progress = {
    interpretation: dream.interpretation,
    fulfilledAt: dream.fulfilledAt ? toIsoDay(dream.fulfilledAt) : null,
  };

  return {
    id: dream.id,
    title: dream.title,
    excerpt: toExcerpt(dream.body),
    dreamedAt: toIsoDay(dream.dreamedAt),
    fulfilledAt: progress.fulfilledAt,
    state: dreamState(progress),
    hasInterpretation: progress.interpretation !== null && progress.interpretation.trim() !== '',
    audiosCount,
    emotions: emotions.map(toEmotionView),
  };
}

/**
 * La fila que se va a un fichero (RFC 0009 §6.3).
 *
 * Es la del listado con **el cuerpo entero** en lugar del extracto, más la
 * interpretación, lo que significó al cumplirse y la fecha de alta: las tres
 * cosas que alguien quiere releer fuera de la aplicación y que la fila no
 * lleva. Los campos se escriben uno a uno y no se copian con un `...rest`:
 * así, el día que la fila gane una columna, el compilador obliga a decidir si
 * va también al fichero.
 */
export function toExportRow(
  dream: Dream,
  emotions: readonly Emotion[],
  audiosCount: number,
): DreamExportRow {
  const item = toListItem(dream, emotions, audiosCount);

  return {
    id: item.id,
    title: item.title,
    body: dream.body,
    dreamedAt: item.dreamedAt,
    interpretation: dream.interpretation,
    fulfilledAt: item.fulfilledAt,
    fulfillmentMeaning: dream.fulfillmentMeaning,
    state: item.state,
    hasInterpretation: item.hasInterpretation,
    audiosCount: item.audiosCount,
    emotions: item.emotions,
    createdAt: dream.createdAt.toISOString(),
  };
}

/**
 * Las primeras letras del cuerpo, **cortadas en palabra**: partir a mitad de
 * una deja un final que se lee como un fallo. Si no hay espacio donde cortar
 * —una palabra larguísima—, se corta donde toque y ya.
 */
export function toExcerpt(body: string): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  if (flat.length <= EXCERPT_LENGTH) return flat;

  const cut = flat.slice(0, EXCERPT_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > EXCERPT_LENGTH / 2 ? cut.slice(0, lastSpace) : cut}…`;
}
