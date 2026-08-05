import {
  prophecyState,
  waitingDays,
  type Prophecy as ProphecyView,
  type ProphecyExportRow,
  type ProphecyFulfillment as FulfillmentView,
  type ProphecyListItem,
} from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import type { ProphecyFulfillment } from './prophecy-fulfillment.entity';
import type { Prophecy } from './prophecy.entity';

/** Cuánto del cuerpo viaja en el listado. Suficiente para tres líneas (§6.1). */
const EXCERPT_LENGTH = 160;

export function toFulfillmentView(fulfillment: ProphecyFulfillment): FulfillmentView {
  return {
    id: fulfillment.id,
    prophecyId: fulfillment.prophecyId,
    text: fulfillment.text,
    occurredAt: toIsoDay(fulfillment.occurredAt),
    createdAt: fulfillment.createdAt.toISOString(),
  };
}

export function toProphecyView(prophecy: Prophecy): ProphecyView {
  return {
    id: prophecy.id,
    title: prophecy.title,
    body: prophecy.body,
    receivedAt: toIsoDay(prophecy.receivedAt),
    fulfilledAt: prophecy.fulfilledAt ? toIsoDay(prophecy.fulfilledAt) : null,
    lastFulfillmentAt: prophecy.lastFulfillmentAt ? toIsoDay(prophecy.lastFulfillmentAt) : null,
    fulfillments: (prophecy.fulfillments ?? []).map(toFulfillmentView),
    createdAt: prophecy.createdAt.toISOString(),
  };
}

/**
 * La fila del listado, con el estado y la espera ya calculados: la interfaz no
 * tiene que volver a pedir nada para pintarla (§6.1).
 *
 * `fulfillmentsCount` llega aparte porque sale de un `COUNT` agrupado y no de
 * cargar la relación entera en cada fila.
 */
export function toListItem(
  prophecy: Prophecy,
  today: string,
  fulfillmentDays: readonly string[],
): ProphecyListItem {
  const progress = {
    receivedAt: toIsoDay(prophecy.receivedAt),
    fulfilledAt: prophecy.fulfilledAt ? toIsoDay(prophecy.fulfilledAt) : null,
    lastFulfillmentAt: prophecy.lastFulfillmentAt ? toIsoDay(prophecy.lastFulfillmentAt) : null,
  };

  return {
    id: prophecy.id,
    title: prophecy.title,
    excerpt: toExcerpt(prophecy.body),
    ...progress,
    state: prophecyState(progress),
    waitingDays: waitingDays(progress, today),
    fulfillmentsCount: fulfillmentDays.length,
    fulfillmentDays: [...fulfillmentDays],
  };
}

/**
 * La fila que se va a un fichero (RFC 0009 §6.3).
 *
 * Es la del listado con **el cuerpo entero** en lugar del extracto, más la
 * fecha de alta. Los campos se escriben uno a uno y no se copian con un
 * `...rest`: así, el día que la fila del listado gane una columna, el
 * compilador obliga a decidir si va también al fichero o no.
 */
export function toExportRow(
  prophecy: Prophecy,
  today: string,
  fulfillmentDays: readonly string[],
): ProphecyExportRow {
  const item = toListItem(prophecy, today, fulfillmentDays);

  return {
    id: item.id,
    title: item.title,
    body: prophecy.body,
    receivedAt: item.receivedAt,
    fulfilledAt: item.fulfilledAt,
    lastFulfillmentAt: item.lastFulfillmentAt,
    state: item.state,
    waitingDays: item.waitingDays,
    fulfillmentsCount: item.fulfillmentsCount,
    fulfillmentDays: item.fulfillmentDays,
    createdAt: prophecy.createdAt.toISOString(),
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
