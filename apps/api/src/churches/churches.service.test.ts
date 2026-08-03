import { ForbiddenException } from '@nestjs/common';
import { SUPERADMIN_ROLE } from '@navis/shared';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { ProfilesService } from '../profiles/profiles.service';
import type { ChurchMember } from './church-member.entity';
import type { Church } from './church.entity';
import { ChurchesService } from './churches.service';

const iglesia = (id: string, name: string): Church => ({ id, name }) as Church;

const CENTRAL = iglesia('c1', 'Iglesia Central');
const NORTE = iglesia('c2', 'Iglesia Norte');

/**
 * Dobles de los repositorios: solo implementan lo que el servicio usa, que es
 * el motivo por el que se montan a mano en vez de con un mock global (Regla 4).
 */
function build({
  churches = [CENTRAL, NORTE],
  memberships = [{ churchId: CENTRAL.id, userId: 'u1' }],
  activeChurchId = null as string | null,
}) {
  // Con filtro por id devuelve las de la pertenencia; sin él, el catálogo
  // entero. No se mira por dentro del `In()` de TypeORM: eso ataría el test a
  // cómo lo construye la librería.
  const find = vi.fn((options?: { where?: { id?: unknown } }) =>
    Promise.resolve(
      options?.where?.id
        ? churches.filter((church) => memberships.some((row) => row.churchId === church.id))
        : churches,
    ),
  );

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
  };

  const setActiveChurch = vi.fn(() => Promise.resolve());
  const profiles = {
    findOrCreate: vi.fn(() => Promise.resolve({ activeChurchId, timezone: 'Europe/Madrid' })),
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
  it('el superadministrador llega a todas las iglesias', async () => {
    const { service, find } = build({ memberships: [] });

    const { items } = await service.listFor({ id: 'u9', role: SUPERADMIN_ROLE });

    expect(items).toHaveLength(2);
    // Sin filtro por pertenencia: pide el catálogo entero.
    expect(find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
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

  it('el superadministrador sin filtro no acota, y con filtro se queda con lo pedido', async () => {
    const { service } = build({ memberships: [] });
    const superadmin = { id: 'u9', role: SUPERADMIN_ROLE };

    await expect(service.scopeFor(superadmin)).resolves.toBeNull();
    await expect(service.scopeFor(superadmin, [CENTRAL.id, NORTE.id])).resolves.toEqual([
      CENTRAL.id,
      NORTE.id,
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
});
