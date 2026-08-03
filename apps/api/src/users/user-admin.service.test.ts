import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ManagedUser } from '@navis/shared';
import { describe, expect, it, vi } from 'vitest';

import type { RolesService } from '../roles/roles.service';
import { UserAdminService } from './user-admin.service';
import type { UsersService } from './users.service';

const USER: ManagedUser = {
  id: 'u1',
  name: 'Ana',
  email: 'ana@iglesia.es',
  role: 'member',
  emailVerified: false,
  createdAt: new Date('2026-08-03T10:00:00.000Z'),
};

function build(user: ManagedUser | null = USER, adminsTotal = 2) {
  const findById = vi.fn().mockResolvedValue(user);
  const findPage = vi.fn().mockResolvedValue({ items: [], total: adminsTotal });
  const ensureExists = vi.fn().mockResolvedValue(undefined);

  const service = new UserAdminService(
    { findById, findPage } as unknown as UsersService,
    { ensureExists } as unknown as RolesService,
  );

  return { service, findById, findPage, ensureExists };
}

describe('UserAdminService', () => {
  // Con esta regla y el guard de `admin` sobre el controlador es imposible que
  // la instalación se quede sin ningún administrador.
  it('no deja tocar la cuenta propia', async () => {
    const { service, findById } = build();

    await expect(service.update('u1', { name: 'X' }, 'u1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.remove('u1', 'u1')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.setPassword('u1', 'Rebano2026', 'u1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(findById).not.toHaveBeenCalled();
  });

  it('falla si la cuenta no existe', async () => {
    const { service } = build(null);

    await expect(service.setRole('u9', 'pastor', 'admin1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('comprueba que el rol existe antes de asignarlo', async () => {
    const { service, ensureExists } = build();
    ensureExists.mockRejectedValueOnce(new BadRequestException('El rol "x" no existe'));

    await expect(service.setRole('u1', 'pastor', 'admin1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('no borra al último administrador', async () => {
    const { service } = build({ ...USER, role: 'admin' }, 1);

    await expect(service.remove('u1', 'admin2')).rejects.toBeInstanceOf(BadRequestException);
  });
});
