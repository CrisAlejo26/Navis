import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@navis/shared';
import { describe, expect, it, vi } from 'vitest';

import type { RolesService } from '../../roles/roles.service';
import { PermissionsGuard } from './permissions.guard';

function contextWithRole(role: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

/** Permisos del catálogo, como los devolvería la tabla `roles`. */
const CATALOG: Record<string, string[]> = {
  superadmin: ['*'],
  pastor: ['believers.view', 'believers.manage', 'users.view'],
  sonido: ['calendar.view'],
  creyente: [],
};

function guardRequiring(permissions: Permission[] | undefined): PermissionsGuard {
  const reflector = new Reflector();
  reflector.getAllAndOverride = (() => permissions) as typeof reflector.getAllAndOverride;

  const roles = {
    permissionsOf: vi.fn((slug: string) => Promise.resolve(CATALOG[slug] ?? null)),
  } as unknown as RolesService;

  return new PermissionsGuard(reflector, roles);
}

describe('PermissionsGuard', () => {
  it('deja pasar cuando la ruta no exige permisos', async () => {
    await expect(guardRequiring(undefined).canActivate(contextWithRole('creyente'))).resolves.toBe(
      true,
    );
  });

  it('deja pasar a quien tiene el permiso', async () => {
    await expect(
      guardRequiring(['believers.manage']).canActivate(contextWithRole('pastor')),
    ).resolves.toBe(true);
  });

  it('bloquea a quien no lo tiene', async () => {
    await expect(
      guardRequiring(['believers.view']).canActivate(contextWithRole('sonido')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el comodín del superadministrador vale para cualquier permiso', async () => {
    await expect(
      guardRequiring(['roles.manage']).canActivate(contextWithRole('superadmin')),
    ).resolves.toBe(true);
  });

  it('exige todos los permisos cuando la ruta pide varios', async () => {
    await expect(
      guardRequiring(['users.view', 'users.manage']).canActivate(contextWithRole('pastor')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('trata a quien no trae rol como creyente', async () => {
    await expect(
      guardRequiring(['dashboard.view']).canActivate(contextWithRole(undefined)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // Si el slug no está en el catálogo no hay permisos que comparar: no pasa.
  it('bloquea un rol que no existe en el catálogo', async () => {
    await expect(
      guardRequiring(['dashboard.view']).canActivate(contextWithRole('inventado')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
