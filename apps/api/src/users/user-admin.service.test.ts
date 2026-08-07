import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SUPERADMIN_ROLE, type ManagedUser } from '@navis/shared';
import { describe, expect, it, vi } from 'vitest';

import type { ChurchesService } from '../churches/churches.service';
import type { RolesService } from '../roles/roles.service';
import { UserAdminService } from './user-admin.service';
import type { UsersService } from './users.service';

const USER: ManagedUser = {
  id: 'u1',
  name: 'Ana',
  email: 'ana@iglesia.es',
  role: 'creyente',
  emailVerified: false,
  createdAt: new Date('2026-08-03T10:00:00.000Z'),
};

/** Quien administra. El alcance —qué cuentas puede tocar— llega aparte. */
const ADMIN = { id: 'admin1', role: SUPERADMIN_ROLE };

/** Nivel de cada rol de serie, para los dobles de `RolesService.levelOf`. */
const LEVEL: Record<string, number> = {
  creyente: 0,
  recepcion: 1,
  pastor: 2,
  superadmin: 3,
};

function build(
  user: ManagedUser | null = USER,
  superadminsTotal = 2,
  comparteIglesia = true,
  churchesPermission = false,
) {
  const findById = vi.fn().mockResolvedValue(user);
  const findPage = vi.fn().mockResolvedValue({ items: [], total: superadminsTotal });
  const ensureExists = vi.fn().mockResolvedValue(undefined);
  const levelOf = vi.fn((slug: string) => Promise.resolve(LEVEL[slug] ?? null));
  const permissionsOf = vi.fn().mockResolvedValue(churchesPermission ? ['churches.manage'] : []);
  const sharesChurchWith = vi.fn().mockResolvedValue(comparteIglesia);
  const addToActive = vi.fn();

  const service = new UserAdminService(
    { findById, findPage } as unknown as UsersService,
    { ensureExists, levelOf, permissionsOf } as unknown as RolesService,
    { sharesChurchWith, addToActive } as unknown as ChurchesService,
  );

  return {
    service,
    findById,
    findPage,
    ensureExists,
    levelOf,
    permissionsOf,
    sharesChurchWith,
    addToActive,
  };
}

describe('UserAdminService', () => {
  // Con esta regla y el permiso `users.manage` sobre el controlador es
  // imposible que la instalación se quede sin quien reparta accesos.
  it('no deja tocar la cuenta propia', async () => {
    const { service, findById } = build();

    const yo = { id: 'u1', role: SUPERADMIN_ROLE };

    await expect(service.update('u1', { name: 'X' }, yo)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.remove('u1', yo)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.setPassword('u1', 'Rebano2026', yo)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(findById).not.toHaveBeenCalled();
  });

  it('falla si la cuenta no existe', async () => {
    const { service } = build(null);

    await expect(service.setRole('u9', 'pastor', ADMIN)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('comprueba que el rol existe antes de asignarlo', async () => {
    const { service, ensureExists } = build();
    ensureExists.mockRejectedValueOnce(new BadRequestException('El rol "x" no existe'));

    await expect(service.setRole('u1', 'pastor', ADMIN)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('no borra al último superadministrador', async () => {
    const { service } = build({ ...USER, role: SUPERADMIN_ROLE }, 1);

    await expect(
      service.remove('u1', { id: 'admin2', role: SUPERADMIN_ROLE }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // El listado va acotado por iglesia, y editar tiene que ir igual: un `PATCH`
  // abierto sobre un listado acotado no acota nada (RFC 0008 §7.3).
  it('no deja tocar una cuenta de otra iglesia', async () => {
    const { service } = build(USER, 2, false);

    await expect(service.setRole('u1', 'pastor', ADMIN)).rejects.toBeInstanceOf(ForbiddenException);
  });

  // El tope de rol (RFC 0014 D1-D2): nadie asigna un rol igual o por encima
  // del suyo, salvo el superadministrador.
  describe('tope de rol', () => {
    it('un pastor no puede subir a nadie a su propio rol', async () => {
      const { service } = build();
      const pastor = { id: 'p1', role: 'pastor' };

      await expect(service.setRole('u1', 'pastor', pastor)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('un pastor no puede asignar el rol de superadministrador', async () => {
      const { service } = build();
      const pastor = { id: 'p1', role: 'pastor' };

      await expect(service.setRole('u1', 'superadmin', pastor)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('un rol desconocido para quien pregunta no deja asignar nada', async () => {
      const { service } = build();
      const inventado = { id: 'p1', role: 'inventado' };

      await expect(service.setRole('u1', 'recepcion', inventado)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
