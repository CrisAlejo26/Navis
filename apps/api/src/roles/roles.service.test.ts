import type { DataSource, Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { Role } from './role.entity';
import { RolesService } from './roles.service';

/** Doble del repositorio: solo lo que usa `levelOf` (Regla 10). */
function build(role: Partial<Role> | null) {
  const findOne = vi.fn().mockResolvedValue(role);
  const roles = { findOne } as unknown as Repository<Role>;
  const service = new RolesService({} as DataSource, roles);

  return { service, findOne };
}

describe('RolesService.levelOf', () => {
  it('devuelve el nivel de un rol que existe', async () => {
    const { service } = build({ slug: 'pastor', level: 2 });

    await expect(service.levelOf('pastor')).resolves.toBe(2);
  });

  it('devuelve null si el rol no está en el catálogo', async () => {
    const { service } = build(null);

    await expect(service.levelOf('inventado')).resolves.toBeNull();
  });
});

describe('RolesService.rolesWithPermission', () => {
  /** Doble de `find`, para probar el filtrado sobre varios roles a la vez. */
  function buildMany(roles: Partial<Role>[]) {
    const find = vi.fn().mockResolvedValue(roles);
    const repo = { find } as unknown as Repository<Role>;
    return new RolesService({} as DataSource, repo);
  }

  it('el rol creyente no aparece: ROLE_PERMISSIONS.creyente no lleva communications.view', async () => {
    const service = buildMany([
      { slug: 'creyente', permissions: [] },
      { slug: 'pastor', permissions: ['communications.view', 'communications.manage'] },
      { slug: 'sonido', permissions: ['communications.view'] },
    ]);

    await expect(service.rolesWithPermission('communications.view')).resolves.toEqual([
      'pastor',
      'sonido',
    ]);
  });

  it('el superadministrador entra siempre, por el comodín "*"', async () => {
    const service = buildMany([{ slug: 'superadmin', permissions: ['*'] }]);

    await expect(service.rolesWithPermission('communications.view')).resolves.toEqual([
      'superadmin',
    ]);
  });
});
