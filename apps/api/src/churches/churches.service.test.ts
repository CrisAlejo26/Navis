import { ForbiddenException } from '@nestjs/common';
import { SUPERADMIN_ROLE } from '@navis/shared';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { ProfilesService } from '../profiles/profiles.service';
import type { ChurchMember } from './church-member.entity';
import type { Church } from './church.entity';
import { ChurchesService } from './churches.service';

const iglesia = (id: string, name: string, ownerId = 'u1'): Church =>
  ({ id, name, ownerId }) as Church;

const CENTRAL = iglesia('c1', 'Iglesia Central', 'u1');
const NORTE = iglesia('c2', 'Iglesia Norte', 'u9');

/**
 * Dobles de los repositorios: solo implementan lo que el servicio usa, que es
 * el motivo por el que se montan a mano en vez de con un mock global (Regla 4).
 */
function build({
  churches = [CENTRAL, NORTE],
  memberships = [{ churchId: CENTRAL.id, userId: 'u1' }],
  activeChurchId = null as string | null,
  restrictOwnScope = true,
}) {
  // Con filtro por id devuelve las de la pertenencia; sin él, el catálogo
  // entero. No se mira por dentro del `In()` de TypeORM: eso ataría el test a
  // cómo lo construye la librería.
  const find = vi.fn((options?: { where?: { id?: unknown; ownerId?: string } }) => {
    if (options?.where?.ownerId !== undefined) {
      return Promise.resolve(
        churches.filter((church) => church.ownerId === options.where?.ownerId),
      );
    }
    return Promise.resolve(
      options?.where?.id
        ? churches.filter((church) => memberships.some((row) => row.churchId === church.id))
        : churches,
    );
  });

  const churchRepo = {
    find,
    exists: vi.fn(() => Promise.resolve(false)),
    create: (data: Partial<Church>) => data,
    save: (data: Partial<Church>) => Promise.resolve({ ...data, id: 'nueva' }),
  };

  const memberRepo = {
    find: vi.fn(() => Promise.resolve(memberships)),
    create: (data: Partial<ChurchMember>) => data,
    save: vi.fn((data: Partial<ChurchMember>) => Promise.resolve(data)),
    remove: vi.fn((rows: Partial<ChurchMember>[]) => Promise.resolve(rows)),
  };

  const setActiveChurch = vi.fn(() => Promise.resolve());
  const profiles = {
    findOrCreate: vi.fn(() =>
      Promise.resolve({ activeChurchId, timezone: 'Europe/Madrid', restrictOwnScope }),
    ),
    setActiveChurch,
  };

  // Dobles de test: solo implementan lo que el servicio usa, así que se
  // convierten a mano en un único sitio y con este comentario (Regla 10).
  const service = new ChurchesService(
    churchRepo as unknown as Repository<Church>,
    memberRepo as unknown as Repository<ChurchMember>,
    profiles as unknown as ProfilesService,
  );

  return { service, find, setActiveChurch, memberRepo };
}

describe('ChurchesService', () => {
  it('el superadministrador sin restringir llega a todas las iglesias', async () => {
    const { service, find } = build({ memberships: [], restrictOwnScope: false });

    const { items } = await service.listFor({ id: 'u9', role: SUPERADMIN_ROLE });

    expect(items).toHaveLength(2);
    // Sin filtro por pertenencia: pide el catálogo entero.
    expect(find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  // RFC 0014 D7-D8: restringido es el valor de serie, incluso para el
  // superadministrador. Pasa por la misma rama que un pastor.
  it('el superadministrador restringido (el valor de serie) solo llega a lo suyo', async () => {
    const { service, find } = build({});

    const { items } = await service.listFor({ id: 'u1', role: SUPERADMIN_ROLE });

    expect(items.map((church) => church.id)).toEqual([CENTRAL.id]);
    // Pide por pertenencia, como cualquier otra cuenta: no el catálogo entero.
    expect(find).not.toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('un superadministrador restringido sin iglesias no ve ninguna', async () => {
    const { service } = build({ memberships: [] });

    const { items, activeId } = await service.listFor({ id: 'u9', role: SUPERADMIN_ROLE });

    expect(items).toEqual([]);
    expect(activeId).toBeNull();
  });

  it('el resto solo llega a aquellas en las que tiene fila', async () => {
    const { service } = build({});

    const { items, activeId } = await service.listFor({ id: 'u1', role: 'pastor' });

    expect(items.map((church) => church.id)).toEqual([CENTRAL.id]);
    expect(activeId).toBe(CENTRAL.id);
  });

  // Sin fila de pertenencia no se entra: es lo contrario del defecto de
  // Cuentify, y a propósito (RFC 0008 §4).
  it('sin pertenencia no hay iglesias ni activa', async () => {
    const { service } = build({ memberships: [] });

    const { items, activeId } = await service.listFor({ id: 'u2', role: 'creyente' });

    expect(items).toEqual([]);
    expect(activeId).toBeNull();
  });

  it('corrige la activa guardada cuando ya no se llega a ella', async () => {
    const { service, setActiveChurch } = build({ activeChurchId: 'borrada' });

    const { activeId } = await service.listFor({ id: 'u1', role: 'pastor' });

    expect(activeId).toBe(CENTRAL.id);
    expect(setActiveChurch).toHaveBeenCalledWith('u1', CENTRAL.id);
  });

  it('el superadministrador sin restringir y sin filtro no acota, y con filtro se queda con lo pedido', async () => {
    const { service } = build({ memberships: [], restrictOwnScope: false });
    const superadmin = { id: 'u9', role: SUPERADMIN_ROLE };

    await expect(service.scopeFor(superadmin)).resolves.toBeNull();
    await expect(service.scopeFor(superadmin, [CENTRAL.id, NORTE.id])).resolves.toEqual([
      CENTRAL.id,
      NORTE.id,
    ]);
  });

  it('el superadministrador restringido queda acotado a lo suyo, como el filtro de un pastor', async () => {
    const { service } = build({});
    const superadmin = { id: 'u1', role: SUPERADMIN_ROLE };

    await expect(service.scopeFor(superadmin)).resolves.toEqual([CENTRAL.id]);
    await expect(service.scopeFor(superadmin, [CENTRAL.id, NORTE.id])).resolves.toEqual([
      CENTRAL.id,
    ]);
  });

  // El filtro es una preferencia guardada y puede haber envejecido: lo que ya
  // no es accesible cae, y no se devuelve un error por ello.
  it('el filtro solo puede acotar el alcance, nunca ampliarlo', async () => {
    const { service } = build({});

    await expect(
      service.scopeFor({ id: 'u1', role: 'pastor' }, [CENTRAL.id, NORTE.id]),
    ).resolves.toEqual([CENTRAL.id]);
  });

  it('no deja activar una iglesia a la que no se pertenece', async () => {
    const { service } = build({});

    await expect(service.setActive({ id: 'u1', role: 'pastor' }, NORTE.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('quien crea una iglesia queda dentro y trabajando en ella', async () => {
    const { service, setActiveChurch, memberRepo } = build({ memberships: [] });

    const creada = await service.create(
      { id: 'u1', role: 'pastor' },
      { name: 'Iglesia del Sur', city: 'Sevilla' },
    );

    expect(creada.slug).toBe('iglesia-del-sur');
    expect(memberRepo.save).toHaveBeenCalled();
    expect(setActiveChurch).toHaveBeenCalledWith('u1', 'nueva');
  });

  // RFC 0014 D4: un rol que pasa a autoprovisionarse su propio espacio no se
  // queda arrastrando la membresía de una iglesia a la que entró con un rol
  // más bajo. Es el arreglo del caso real de un pastor viendo la iglesia de
  // quien lo dio de alta.
  describe('leaveNonOwnedChurches', () => {
    it('saca a la cuenta de una iglesia que no es suya', async () => {
      const { service, memberRepo } = build({
        memberships: [{ churchId: NORTE.id, userId: 'u5' }],
      });

      await service.leaveNonOwnedChurches('u5');

      expect(memberRepo.remove).toHaveBeenCalledWith([{ churchId: NORTE.id, userId: 'u5' }]);
    });

    it('no toca la fila de la iglesia que sí es suya', async () => {
      const { service, memberRepo } = build({
        memberships: [{ churchId: CENTRAL.id, userId: 'u1' }],
      });

      await service.leaveNonOwnedChurches('u1');

      expect(memberRepo.remove).not.toHaveBeenCalled();
    });

    it('sin ninguna membresía no hace nada', async () => {
      const { service, memberRepo } = build({ memberships: [] });

      await service.leaveNonOwnedChurches('u9');

      expect(memberRepo.remove).not.toHaveBeenCalled();
    });
  });

  // RFC 0015: es lo que decide si dar de baja a esta cuenta exige antes
  // resolver qué pasa con cada iglesia.
  describe('ownedBy', () => {
    it('devuelve solo las iglesias de las que esta cuenta es dueña', async () => {
      const { service } = build({});

      await expect(service.ownedBy('u1')).resolves.toEqual([CENTRAL]);
    });

    it('vacío para quien no es dueño de ninguna', async () => {
      const { service } = build({});

      await expect(service.ownedBy('u5')).resolves.toEqual([]);
    });
  });
});
