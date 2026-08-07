import { describe, expect, it } from 'vitest';

import { canAssignRoleLevel } from './constants';

describe('canAssignRoleLevel', () => {
  it('deja asignar un rol de nivel estrictamente menor', () => {
    expect(canAssignRoleLevel(2, 1)).toBe(true);
    expect(canAssignRoleLevel(2, 0)).toBe(true);
  });

  it('no deja asignar un rol del mismo nivel', () => {
    expect(canAssignRoleLevel(2, 2)).toBe(false);
  });

  it('no deja asignar un rol de nivel superior', () => {
    expect(canAssignRoleLevel(1, 2)).toBe(false);
  });
});
