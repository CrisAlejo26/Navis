import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SUPERADMIN_ROLE, type ChurchDecision, type ManagedUser } from '@navis/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { auth } from '../auth/auth';
import type { ChurchTransferService } from '../churches/church-transfer.service';
import type { ChurchesService } from '../churches/churches.service';
import type { RolesService } from '../roles/roles.service';
import { UserAdminService } from './user-admin.service';
import type { UsersService } from './users.service';

// `update()` y `remove()` pasan por Better Auth para el cambio de verdad; aquí
// solo importa que se llamen, no cómo cifran ni borran: el resto lo cubren los
// e2e (Regla 4).
vi.mock('../auth/auth', () => ({
  auth: {
    $context: Promise.resolve({
      internalAdapter: { updateUser: vi.fn(), deleteUser: vi.fn() },
    }),
  },
}));

/**
 * Better Auth tipa `internalAdapter` con métodos de interfaz, así que
 * referenciarlos sueltos (para `mockClear` o `toHaveBeenCalledWith`) dispara
 * `unbound-method`. Se recasta al doble que realmente es (Regla 10 §2).
 */
async function betterAuthMock() {
  const ctx = await auth.$context;
  return ctx.internalAdapter as unknown as {
    updateUser: ReturnType<typeof vi.fn>;
    deleteUser: ReturnType<typeof vi.fn>;
  };
}

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

/** Iglesias que la cuenta dueña dirige, para los tests de RFC 0015. */
interface OwnedChurchStub {
  id: string;
  name: string;
}

function build(
  user: ManagedUser | null = USER,
  superadminsTotal = 2,
  comparteIglesia = true,
  churchesPermission = false,
  ownedChurches: OwnedChurchStub[] = [],
  alcanzables: { id: string }[] = [],
) {
  const findById = vi.fn().mockResolvedValue(user);
  const findPage = vi.fn().mockResolvedValue({ items: [], total: superadminsTotal });
  const ensureExists = vi.fn().mockResolvedValue(undefined);
  const levelOf = vi.fn((slug: string) => Promise.resolve(LEVEL[slug] ?? null));
  const permissionsOf = vi.fn().mockResolvedValue(churchesPermission ? ['churches.manage'] : []);
  const sharesChurchWith = vi.fn().mockResolvedValue(comparteIglesia);
  const addToActive = vi.fn();
  const leaveNonOwnedChurches = vi.fn();
  const ownedBy = vi.fn().mockResolvedValue(ownedChurches);
  const listFor = vi.fn().mockResolvedValue({ items: alcanzables, activeId: null });

  const impactOf = vi.fn((churchId: string) =>
    Promise.resolve({
      id: churchId,
      name: ownedChurches.find((church) => church.id === churchId)?.name ?? churchId,
      believers: 0,
      notes: 0,
      lists: 0,
      calendars: 0,
      congregations: 0,
      members: 0,
    }),
  );
  const deleteAll = vi.fn().mockResolvedValue(undefined);
  const transferAll = vi.fn().mockResolvedValue(undefined);

  const service = new UserAdminService(
    { findById, findPage } as unknown as UsersService,
    { ensureExists, levelOf, permissionsOf } as unknown as RolesService,
    {
      sharesChurchWith,
      addToActive,
      leaveNonOwnedChurches,
      ownedBy,
      listFor,
    } as unknown as ChurchesService,
    { impactOf, deleteAll, transferAll } as unknown as ChurchTransferService,
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
    leaveNonOwnedChurches,
    ownedBy,
    listFor,
    impactOf,
    deleteAll,
    transferAll,
  };
}

describe('UserAdminService', () => {
  // El doble de Better Auth es un único objeto compartido por todo el
  // fichero (`vi.mock` solo corre una vez): sin limpiarlo, una llamada de un
  // test se cuela en el recuento del siguiente.
  beforeEach(async () => {
    const internalAdapter = await betterAuthMock();
    internalAdapter.updateUser.mockClear();
    internalAdapter.deleteUser.mockClear();
  });

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

  // Un rol que se autoprovisiona su espacio no debe seguir arrastrando la
  // membresía de una iglesia a la que entró con el rol anterior (RFC 0014 D4).
  describe('al cambiar el rol', () => {
    it('si el rol nuevo se autoprovisiona su espacio, saca la cuenta de las iglesias ajenas', async () => {
      const { service, leaveNonOwnedChurches } = build(USER, 2, true, true);

      await service.setRole('u1', 'pastor', ADMIN);

      expect(leaveNonOwnedChurches).toHaveBeenCalledWith('u1');
    });

    it('si el rol nuevo no se autoprovisiona nada, no toca sus iglesias', async () => {
      const { service, leaveNonOwnedChurches } = build(USER, 2, true, false);

      await service.setRole('u1', 'recepcion', ADMIN);

      expect(leaveNonOwnedChurches).not.toHaveBeenCalled();
    });
  });

  // RFC 0015: dar de baja a quien dirige una iglesia exige antes decidir qué
  // pasa con cada una.
  describe('baja de una cuenta dueña de iglesias', () => {
    it('sin iglesias propias, borra sin pedir ninguna decisión', async () => {
      const { service, leaveNonOwnedChurches } = build(USER, 2, true, false, []);

      await service.remove('u1', ADMIN);

      expect(leaveNonOwnedChurches).toHaveBeenCalledWith('u1');
      const internalAdapter = await betterAuthMock();
      expect(internalAdapter.deleteUser).toHaveBeenCalledWith('u1');
    });

    it('con iglesias propias y sin decisiones, responde con el impacto de todas y no borra nada', async () => {
      const propias = [
        { id: 'c1', name: 'IDMJI - Murcia' },
        { id: 'c2', name: 'IDMJI - Cartagena' },
      ];
      const { service, impactOf, deleteAll, transferAll } = build(USER, 2, true, false, propias);

      const intento = service.remove('u1', ADMIN);

      await expect(intento).rejects.toBeInstanceOf(ConflictException);
      await intento.catch((cause: ConflictException) => {
        const body = cause.getResponse() as { data: { ownedChurches: { id: string }[] } };
        expect(body.data.ownedChurches.map((church) => church.id)).toEqual(['c1', 'c2']);
      });
      expect(impactOf).toHaveBeenCalledWith('c1');
      expect(impactOf).toHaveBeenCalledWith('c2');
      expect(deleteAll).not.toHaveBeenCalled();
      expect(transferAll).not.toHaveBeenCalled();
      const internalAdapter = await betterAuthMock();
      expect(internalAdapter.deleteUser).not.toHaveBeenCalled();
    });

    it('también pide decisión si solo falta una de las varias iglesias', async () => {
      const propias = [
        { id: 'c1', name: 'A' },
        { id: 'c2', name: 'B' },
      ];
      const { service } = build(USER, 2, true, false, propias);
      const decisions: ChurchDecision[] = [{ churchId: 'c1', action: 'delete' }];

      await expect(service.remove('u1', ADMIN, decisions)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('elimina cada iglesia marcada para eliminar', async () => {
      const propias = [{ id: 'c1', name: 'IDMJI - Murcia' }];
      const { service, deleteAll } = build(USER, 2, true, false, propias);
      const decisions: ChurchDecision[] = [{ churchId: 'c1', action: 'delete' }];

      await service.remove('u1', ADMIN, decisions);

      expect(deleteAll).toHaveBeenCalledWith('c1');
    });

    it('traslada cada iglesia marcada para trasladar a su destino', async () => {
      const propias = [{ id: 'c1', name: 'IDMJI - Murcia' }];
      const { service, transferAll } = build(USER, 2, true, false, propias, [{ id: 'c9' }]);
      const decisions: ChurchDecision[] = [
        { churchId: 'c1', action: 'transfer', targetChurchId: 'c9' },
      ];

      await service.remove('u1', ADMIN, decisions);

      expect(transferAll).toHaveBeenCalledWith('c1', 'c9');
    });

    it('no deja trasladar una iglesia a sí misma', async () => {
      const propias = [{ id: 'c1', name: 'IDMJI - Murcia' }];
      const { service } = build(USER, 2, true, false, propias, [{ id: 'c1' }]);
      const decisions: ChurchDecision[] = [
        { churchId: 'c1', action: 'transfer', targetChurchId: 'c1' },
      ];

      await expect(service.remove('u1', ADMIN, decisions)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('no deja trasladar a una iglesia que también se va a eliminar en el mismo plan', async () => {
      const propias = [
        { id: 'c1', name: 'A' },
        { id: 'c2', name: 'B' },
      ];
      const { service } = build(USER, 2, true, false, propias, [{ id: 'c1' }, { id: 'c2' }]);
      const decisions: ChurchDecision[] = [
        { churchId: 'c1', action: 'delete' },
        { churchId: 'c2', action: 'transfer', targetChurchId: 'c1' },
      ];

      await expect(service.remove('u1', ADMIN, decisions)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('no deja trasladar a una iglesia a la que quien administra no llega', async () => {
      const propias = [{ id: 'c1', name: 'IDMJI - Murcia' }];
      // `listFor` no incluye 'c9': quien administra no llega a ella.
      const { service } = build(USER, 2, true, false, propias, [{ id: 'c1' }]);
      const decisions: ChurchDecision[] = [
        { churchId: 'c1', action: 'transfer', targetChurchId: 'c9' },
      ];

      await expect(service.remove('u1', ADMIN, decisions)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('no aplica ninguna decisión si alguna del lote es inválida', async () => {
      const propias = [
        { id: 'c1', name: 'A' },
        { id: 'c2', name: 'B' },
      ];
      const { service, deleteAll } = build(USER, 2, true, false, propias, [{ id: 'c1' }]);
      const decisions: ChurchDecision[] = [
        { churchId: 'c1', action: 'delete' },
        // Sin destino: inválida.
        { churchId: 'c2', action: 'transfer' },
      ];

      await expect(service.remove('u1', ADMIN, decisions)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(deleteAll).not.toHaveBeenCalled();
    });

    // Trampa real: `target()` exige compartir iglesia, y un dueño que está
    // solo en la suya no la comparte con un superadministrador restringido.
    it('un superadministrador restringido recibe 403 antes de llegar al 409 si no comparte iglesia', async () => {
      const propias = [{ id: 'c1', name: 'IDMJI - Murcia' }];
      const { service } = build(USER, 2, false, false, propias);

      await expect(service.remove('u1', ADMIN)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
