import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `isPostgres` se lee una vez al cargar `column-types.ts`, así que para probar
 * los dos motores en el mismo fichero cada caso recarga el módulo con
 * `vi.doMock` + `vi.resetModules` (RFC 0021 D15).
 */
async function loadWith(isPostgres: boolean) {
  vi.resetModules();
  vi.doMock('./column-types', () => ({ isPostgres }));
  return import('./json-field-sql');
}

afterEach(() => {
  vi.doUnmock('./column-types');
  vi.resetModules();
});

describe('jsonFieldExpr', () => {
  it('extrae con ->> en Postgres', async () => {
    const { jsonFieldExpr } = await loadWith(true);
    expect(jsonFieldExpr('row.data', 'asistio')).toBe("(row.data::jsonb ->> 'asistio')");
  });

  it('extrae con json_extract en SQLite', async () => {
    const { jsonFieldExpr } = await loadWith(false);
    expect(jsonFieldExpr('row.data', 'asistio')).toBe("json_extract(row.data, '$.asistio')");
  });

  it('rechaza una clave con caracteres fuera de [a-z0-9-]', async () => {
    const { jsonFieldExpr } = await loadWith(false);
    expect(() => jsonFieldExpr('row.data', "x'; DROP TABLE custom_table_rows; --")).toThrow();
  });
});

describe('jsonFieldOrderExpr', () => {
  it('convierte a numeric en Postgres para number/currency', async () => {
    const { jsonFieldOrderExpr } = await loadWith(true);
    expect(jsonFieldOrderExpr('row.data', 'importe', 'currency')).toBe(
      "NULLIF((row.data::jsonb ->> 'importe'), '')::numeric",
    );
  });

  it('convierte con CAST AS REAL en SQLite para number/currency', async () => {
    const { jsonFieldOrderExpr } = await loadWith(false);
    expect(jsonFieldOrderExpr('row.data', 'importe', 'number')).toBe(
      "CAST(NULLIF(json_extract(row.data, '$.importe'), '') AS REAL)",
    );
  });

  it('deja texto y fecha sin convertir, en cualquier motor', async () => {
    const { jsonFieldOrderExpr } = await loadWith(false);
    expect(jsonFieldOrderExpr('row.data', 'nombre', 'text')).toBe(
      "json_extract(row.data, '$.nombre')",
    );
  });
});
