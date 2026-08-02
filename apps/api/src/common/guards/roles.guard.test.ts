import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { RolesGuard } from './roles.guard';

function contextWithRole(role: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

function guardRequiring(roles: string[] | undefined): RolesGuard {
  const reflector = new Reflector();
  reflector.getAllAndOverride = (() => roles) as typeof reflector.getAllAndOverride;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('deja pasar cuando la ruta no exige rol', () => {
    expect(guardRequiring(undefined).canActivate(contextWithRole('member'))).toBe(true);
  });

  it('deja pasar a un rol superior al exigido', () => {
    expect(guardRequiring(['leader']).canActivate(contextWithRole('pastor'))).toBe(true);
  });

  it('bloquea a un rol inferior al exigido', () => {
    expect(() => guardRequiring(['pastor']).canActivate(contextWithRole('member'))).toThrow(
      ForbiddenException,
    );
  });

  it('trata al usuario sin rol como member', () => {
    expect(() => guardRequiring(['admin']).canActivate(contextWithRole(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
