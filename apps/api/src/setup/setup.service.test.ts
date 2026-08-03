import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { UserAdminService } from '../users/user-admin.service';
import type { UsersService } from '../users/users.service';
import { SetupService } from './setup.service';

/** Dobles con los espías sueltos, para poder afirmar sobre ellos. */
function build(count: number) {
  const forceRole = vi.fn();
  const service = new SetupService(
    { count: vi.fn().mockResolvedValue(count), findById: vi.fn() } as unknown as UsersService,
    { forceRole } as unknown as UserAdminService,
  );

  return { service, forceRole };
}

describe('SetupService', () => {
  it('pide primer arranque cuando no hay ninguna cuenta', async () => {
    const { service } = build(0);
    await expect(service.getStatus()).resolves.toEqual({ needsSetup: true });
  });

  it('no lo pide en cuanto existe una cuenta', async () => {
    const { service } = build(1);
    await expect(service.getStatus()).resolves.toEqual({ needsSetup: false });
  });

  // Es la única protección del endpoint: es público porque todavía no hay
  // nadie con quien autenticarse.
  it('rechaza crear el primer administrador si ya hay cuentas', async () => {
    const { service, forceRole } = build(3);

    await expect(
      service.createFirstAdmin({
        name: 'Ana',
        email: 'ana@iglesia.es',
        password: 'Rebano2026',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(forceRole).not.toHaveBeenCalled();
  });
});
