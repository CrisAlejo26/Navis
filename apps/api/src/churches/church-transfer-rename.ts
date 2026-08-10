import { In, type EntityManager } from 'typeorm';

import { ChurchMember } from './church-member.entity';
import { List } from '../lists/list.entity';
import { ListViewer } from '../lists/list-viewer.entity';

/**
 * Lo que se traslada sin catálogo de serie que fundir (RFC 0015): listas,
 * accesos y membresías. Cada una resuelve su propio choque de único.
 */

/**
 * Listas y accesos no tienen catálogo que fundir: son de quien los crea, y dos
 * iglesias con una lista «Miembros» es coincidencia, no la norma. Se
 * renombran con sufijo si chocan, como `ChurchesService.freeSlug`.
 */
export async function renameLists(manager: EntityManager, origenId: string, destinoId: string) {
  for (const list of await manager.find(List, { where: { churchId: origenId } })) {
    const slug = await freeSlug(manager, destinoId, list.slug);
    const name = await freeName(manager, destinoId, list.name);
    await manager.update(List, { id: list.id }, { churchId: destinoId, slug, name });
  }
}

async function freeSlug(manager: EntityManager, churchId: string, base: string): Promise<string> {
  for (let intento = 1; ; intento += 1) {
    const candidato = intento === 1 ? base : `${base}-${String(intento)}`;
    if (!(await manager.exists(List, { where: { churchId, slug: candidato } }))) return candidato;
  }
}

async function freeName(manager: EntityManager, churchId: string, base: string): Promise<string> {
  for (let intento = 1; ; intento += 1) {
    const candidato = intento === 1 ? base : `${base}-${String(intento)}`;
    if (!(await manager.exists(List, { where: { churchId, name: candidato } }))) return candidato;
  }
}

export async function renameListViewers(
  manager: EntityManager,
  origenId: string,
  destinoId: string,
) {
  for (const viewer of await manager.find(ListViewer, { where: { churchId: origenId } })) {
    const username = await freeUsername(manager, destinoId, viewer.username);
    await manager.update(ListViewer, { id: viewer.id }, { churchId: destinoId, username });
  }
}

async function freeUsername(
  manager: EntityManager,
  churchId: string,
  base: string,
): Promise<string> {
  for (let intento = 1; ; intento += 1) {
    const candidato = intento === 1 ? base : `${base}-${String(intento)}`;
    if (!(await manager.exists(ListViewer, { where: { churchId, username: candidato } })))
      return candidato;
  }
}

/**
 * D4: quien ya es miembro del destino no duplica su fila (chocaría contra
 * `UQ_church_members`); el resto se mueve. La duplicada se borra de verdad,
 * como ya hace `ChurchesService.leaveNonOwnedChurches` con las ajenas.
 */
export async function moveMembers(manager: EntityManager, origenId: string, destinoId: string) {
  const origenRows = await manager.find(ChurchMember, { where: { churchId: origenId } });
  if (origenRows.length === 0) return;

  const yaEnDestino = new Set(
    (await manager.find(ChurchMember, { where: { churchId: destinoId } })).map((m) => m.userId),
  );

  const duplicadas = origenRows.filter((m) => yaEnDestino.has(m.userId));
  const porMover = origenRows.filter((m) => !yaEnDestino.has(m.userId));

  if (duplicadas.length > 0) await manager.remove(duplicadas);
  if (porMover.length > 0) {
    await manager.update(
      ChurchMember,
      { id: In(porMover.map((m) => m.id)) },
      { churchId: destinoId },
    );
  }
}
