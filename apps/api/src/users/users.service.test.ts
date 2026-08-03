import type { DataSource } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import { UsersService } from './users.service';

const ROW = {
  id: 'u1',
  name: 'Ana',
  email: 'ana@iglesia.es',
  role: 'member',
  emailVerified: 0,
  createdAt: '2026-08-03T10:00:00.000Z',
};

/** Doble de `DataSource` que devuelve lo que le digas en cada `query()`. */
function fakeDataSource(...responses: unknown[]) {
  const query = vi.fn();
  for (const response of responses) query.mockResolvedValueOnce(response);
  query.mockResolvedValue([]);
  return { service: new UsersService({ query } as unknown as DataSource), query };
}

const PAGE = { page: 1, limit: 20, sort: 'createdAt', order: 'desc' } as const;

describe('UsersService', () => {
  it('cuenta las cuentas aunque el driver devuelva el total como texto', async () => {
    const { service } = fakeDataSource([{ total: '4' }]);
    await expect(service.count()).resolves.toBe(4);
  });

  it('normaliza el 0/1 de SQLite y la fecha en texto', async () => {
    const { service } = fakeDataSource([ROW]);
    const user = await service.findById('u1');

    expect(user?.emailVerified).toBe(false);
    expect(user?.createdAt).toBeInstanceOf(Date);
  });

  it('devuelve null si la cuenta no existe', async () => {
    const { service } = fakeDataSource([]);
    await expect(service.findById('u9')).resolves.toBeNull();
  });

  it('calcula el número de páginas a partir del total', async () => {
    const { service } = fakeDataSource([{ total: 45 }], [ROW]);
    const page = await service.findPage({ ...PAGE });

    expect(page).toMatchObject({ total: 45, page: 1, limit: 20, totalPages: 3 });
    expect(page.items).toHaveLength(1);
  });

  // La búsqueda va en minúsculas por los dos lados: en Postgres LIKE distingue
  // mayúsculas y sin esto no encontraría «Ana» buscando «ana».
  it('busca en el nombre y en el correo sin distinguir mayúsculas', async () => {
    const { service, query } = fakeDataSource([{ total: 1 }], [ROW]);
    await service.findPage({ ...PAGE, search: 'ANA' });

    const [sql, params] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('LOWER("name") LIKE');
    expect(sql).toContain('LOWER("email") LIKE');
    // Regresión: el patrón va una vez por comparación. En SQLite cada `?` es un
    // parámetro distinto, y reutilizar el marcador tumbaba la consulta entera.
    expect(params).toEqual(['%ana%', '%ana%']);
  });

  it('filtra por rol y ordena por la columna pedida', async () => {
    const { service, query } = fakeDataSource([{ total: 2 }], [ROW]);
    await service.findPage({ ...PAGE, role: 'pastor', sort: 'name', order: 'asc' });

    const [countSql, countParams] = query.mock.calls[0] as [string, unknown[]];
    expect(countSql).toContain('"role" =');
    expect(countParams).toContain('pastor');

    const [listSql] = query.mock.calls[1] as [string];
    expect(listSql).toContain('ORDER BY "name" ASC');
  });

  it('pide solo la página que toca', async () => {
    const { service, query } = fakeDataSource([{ total: 100 }], []);
    await service.findPage({ ...PAGE, page: 3, limit: 25 });

    const [, params] = query.mock.calls[1] as [string, unknown[]];
    expect(params).toEqual([25, 50]);
  });
});
