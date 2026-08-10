import { In, type EntityManager } from 'typeorm';

import { Believer } from '../believers/believer.entity';
import { BelieverGift } from '../believers/believer-gift.entity';
import { Gift } from '../believers/gift.entity';
import { Ministry } from '../believers/ministry.entity';
import { Calendar } from '../calendar/calendar.entity';
import { Congregation } from '../calendar/congregation.entity';
import { Meeting } from '../calendar/meeting.entity';
import { MeetingPattern } from '../calendar/meeting-pattern.entity';

/**
 * Cómo fundir los catálogos de serie al trasladar una iglesia (RFC 0015).
 *
 * `ensureFor` siembra dones, labores, calendarios y sedes **idénticos** en cada
 * iglesia nueva, así que el destino de un traslado casi siempre tiene ya un
 * «Sanidad» o un «general»: no es la excepción, es el caso normal. Fundir en
 * vez de mover a ciegas es lo que evita chocar contra `UQ_gifts_name`,
 * `UQ_ministries_slug`, `UQ_calendars_slug` y `UQ_congregations_name`.
 */

/** Los dones se casan por nombre; lo que colgaba de uno fundido se reapunta. */
export async function mergeGifts(manager: EntityManager, origenId: string, destinoId: string) {
  const origenRows = await manager.find(Gift, { where: { churchId: origenId } });
  if (origenRows.length === 0) return;

  const porNombre = new Map(
    (await manager.find(Gift, { where: { churchId: destinoId } })).map((g) => [g.name, g]),
  );

  const movidos: string[] = [];
  for (const origen of origenRows) {
    const destino = porNombre.get(origen.name);
    if (destino) {
      await manager.update(BelieverGift, { giftId: origen.id }, { giftId: destino.id });
      await manager.softRemove(origen);
    } else {
      movidos.push(origen.id);
    }
  }
  if (movidos.length > 0) await manager.update(Gift, { id: In(movidos) }, { churchId: destinoId });
}

/**
 * Las labores se casan por `slug`. Nada que remapear: `believer_ministries` y
 * `calendars.ministry` guardan ese slug en texto, no el id, así que una labor
 * fundida sigue siendo válida tal cual está escrita.
 */
export async function mergeMinistries(manager: EntityManager, origenId: string, destinoId: string) {
  const origenRows = await manager.find(Ministry, { where: { churchId: origenId } });
  if (origenRows.length === 0) return;

  const slugsDestino = new Set(
    (await manager.find(Ministry, { where: { churchId: destinoId } })).map((m) => m.slug),
  );

  const movidas: string[] = [];
  for (const origen of origenRows) {
    if (slugsDestino.has(origen.slug)) await manager.softRemove(origen);
    else movidas.push(origen.id);
  }
  if (movidas.length > 0)
    await manager.update(Ministry, { id: In(movidas) }, { churchId: destinoId });
}

/**
 * Las sedes se casan por nombre —el caso típico es que las dos iglesias se
 * llamen igual y su sede de serie herede ese nombre—. Lo que cuelga de una
 * fundida (creyentes, reuniones, patrones) se reapunta a la del destino; lo
 * que no encuentra pareja se mueve tal cual, sin quedar marcado «por defecto»
 * si el destino ya tiene la suya.
 */
export async function mergeCongregations(
  manager: EntityManager,
  origenId: string,
  destinoId: string,
) {
  const origenRows = await manager.find(Congregation, { where: { churchId: origenId } });
  if (origenRows.length === 0) return;

  const porNombre = new Map(
    (await manager.find(Congregation, { where: { churchId: destinoId } })).map((c) => [c.name, c]),
  );

  const movidas: string[] = [];
  for (const origen of origenRows) {
    const destino = porNombre.get(origen.name);
    if (destino) {
      await reapuntarSede(manager, origen.id, destino.id, destinoId);
      await manager.softRemove(origen);
    } else {
      await manager.update(Believer, { congregationId: origen.id }, { churchId: destinoId });
      await manager.update(Meeting, { congregationId: origen.id }, { churchId: destinoId });
      await manager.update(MeetingPattern, { congregationId: origen.id }, { churchId: destinoId });
      movidas.push(origen.id);
    }
  }
  if (movidas.length > 0) {
    await manager.update(
      Congregation,
      { id: In(movidas) },
      { churchId: destinoId, isDefault: false },
    );
  }
}

async function reapuntarSede(
  manager: EntityManager,
  origenCongId: string,
  destinoCongId: string,
  destinoId: string,
) {
  await manager.update(
    Believer,
    { congregationId: origenCongId },
    { congregationId: destinoCongId, churchId: destinoId },
  );
  await manager.update(
    Meeting,
    { congregationId: origenCongId },
    { congregationId: destinoCongId, churchId: destinoId },
  );
  await manager.update(
    MeetingPattern,
    { congregationId: origenCongId },
    { congregationId: destinoCongId, churchId: destinoId },
  );
}

/** Los calendarios se casan por `slug`. Lo que cuelga es solo `meetings`/`meeting_patterns`. */
export async function mergeCalendars(manager: EntityManager, origenId: string, destinoId: string) {
  const origenRows = await manager.find(Calendar, { where: { churchId: origenId } });
  if (origenRows.length === 0) return;

  const porSlug = new Map(
    (await manager.find(Calendar, { where: { churchId: destinoId } })).map((c) => [c.slug, c]),
  );

  const movidos: string[] = [];
  for (const origen of origenRows) {
    const destino = porSlug.get(origen.slug);
    if (destino) {
      await manager.update(Meeting, { calendarId: origen.id }, { calendarId: destino.id });
      await manager.update(MeetingPattern, { calendarId: origen.id }, { calendarId: destino.id });
      await manager.softRemove(origen);
    } else {
      movidos.push(origen.id);
    }
  }
  if (movidos.length > 0) {
    await manager.update(Calendar, { id: In(movidos) }, { churchId: destinoId });
  }
}
