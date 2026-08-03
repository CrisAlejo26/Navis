import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { RolesService } from '../../roles/roles.service';
import { RolesGuard } from './roles.guard';

function contextWithRole(role: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

/** Niveles del catálogo, como los devolvería la tabla `roles`. */
const LEVELS: Record<string, number> = { member: 0, leader: 1, pastor: 2, admin: 3, coro: 1 };

function guardRequiring(roles: string[] | undefined): RolesGuard {
  const reflector = new Reflector();
  reflector.getAllAndOverride = (() => roles) as typeof reflector.getAllAndOverride;

  const rolesService = {
    levelOf: vi.fn((slug: string) => Promise.resolve(LEVELS[slug] ?? null)),
  } as unknown as RolesService;

  return new RolesGuard(reflector, rolesService);
}

describe('RolesGuard', () => {
  it('deja pasar cuando la ruta no exige rol', async () => {
    await expect(guardRequiring(undefined).canActivate(contextWithRole('member'))).resolves.toBe(
      true,
    );
  });

  it('deja pasar a un rol superior al exigido', async () => {
    await expect(guardRequiring(['leader']).canActivate(contextWithRole('pastor'))).resolves.toBe(
      true,
    );
  });

  it('bloquea a un rol inferior al exigido', async () => {
    await expect(
      guardRequiring(['pastor']).canActivate(contextWithRole('member')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('trata al usuario sin rol como member', async () => {
    await expect(
      guardRequiring(['admin']).canActivate(contextWithRole(undefined)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // Los roles propios de la instalación también tienen nivel y se comparan igual.
  it('compara los roles propios por su nivel del catálogo', async () => {
    await expect(guardRequiring(['leader']).canActivate(contextWithRole('coro'))).resolves.toBe(
      true,
    );
  });

  // Si el slug no está en el catálogo no hay nivel que comparar: no pasa.
  it('bloquea un rol que no existe en el catálogo', async () => {
    await expect(
      guardRequiring(['member']).canActivate(contextWithRole('inventado')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
