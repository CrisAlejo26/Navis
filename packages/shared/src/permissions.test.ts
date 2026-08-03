import { describe, expect, it } from 'vitest';

import { ROLES } from './constants';
import {
  ALL_PERMISSIONS,
  hasEveryPermission,
  hasPermission,
  isPermission,
  permissionsOfModule,
  PERMISSIONS,
} from './permissions';
import { ROLE_PERMISSIONS } from './role-permissions';

describe('hasPermission', () => {
  it('concede lo que está en la lista', () => {
    expect(hasPermission(['believers.view'], 'believers.view')).toBe(true);
  });

  it('niega lo que no está', () => {
    expect(hasPermission(['believers.view'], 'believers.manage')).toBe(false);
    expect(hasPermission([], 'dashboard.view')).toBe(false);
  });

  it('el comodín lo concede todo', () => {
    expect(PERMISSIONS.every((permission) => hasPermission([ALL_PERMISSIONS], permission))).toBe(
      true,
    );
  });

  // Un permiso guardado por una versión anterior y ya retirado del catálogo no
  // debe conceder nada por parecerse a otro.
  it('no concede nada por un permiso que ya no existe', () => {
    expect(hasPermission(['believers.everything'], 'believers.manage')).toBe(false);
  });

  it('exige todos los permisos cuando se piden varios', () => {
    expect(hasEveryPermission(['users.view'], ['users.view', 'users.manage'])).toBe(false);
    expect(hasEveryPermission(['users.view', 'users.manage'], ['users.view'])).toBe(true);
  });
});

describe('el catálogo', () => {
  it('reconoce solo los permisos que existen', () => {
    expect(isPermission('calendar.manage')).toBe(true);
    expect(isPermission('calendar.destroy')).toBe(false);
  });

  it('agrupa los permisos por módulo', () => {
    expect(permissionsOfModule('calendar')).toEqual(['calendar.view', 'calendar.manage']);
  });
});

describe('la semilla de roles', () => {
  it('cubre los siete roles de serie', () => {
    expect(Object.keys(ROLE_PERMISSIONS).sort()).toEqual([...ROLES].sort());
  });

  it('solo reparte permisos que existen', () => {
    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      for (const permission of permissions) {
        expect(
          permission === ALL_PERMISSIONS || isPermission(permission),
          `${role}: ${permission}`,
        ).toBe(true);
      }
    }
  });

  it('deja al creyente fuera del panel y al superadministrador con todo', () => {
    expect(ROLE_PERMISSIONS.creyente).toEqual([]);
    expect(ROLE_PERMISSIONS.superadmin).toEqual([ALL_PERMISSIONS]);
    // El pastor lo ve todo salvo el catálogo de roles.
    expect(hasPermission(ROLE_PERMISSIONS.pastor, 'users.manage')).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.pastor, 'roles.manage')).toBe(false);
  });
});
