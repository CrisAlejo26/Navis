import {
  prophecyState,
  waitingDays,
  type Prophecy as ProphecyView,
  type ProphecyExportRow,
  type ProphecyFulfillment as FulfillmentView,
  type ProphecyListItem,
} from '@navis/shared';

import { toExcerpt } from '../common/excerpt';
import { toIsoDay } from '../database/iso-day';
import type { ProphecyFulfillment } from './prophecy-fulfillment.entity';
import type { Prophecy } from './prophecy.entity';

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
