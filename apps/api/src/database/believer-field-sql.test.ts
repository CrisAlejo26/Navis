import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `isPostgres` se lee una vez al cargar `column-types.ts`, así que para probar
 * los dos motores en el mismo fichero cada caso recarga el módulo con
 * `vi.doMock` + `vi.resetModules` (RFC 0025 D12, como su pareja
 * `json-field-sql.test.ts`).
 */
async function loadWith(isPostgres: boolean) {
    vi.resetModules();
    vi.doMock('./column-types', () => ({ isPostgres }));
    return import('./believer-field-sql');
}

afterEach(() => {
    vi.doUnmock('./column-types');
    vi.resetModules();
});

describe('believerFieldExpr', () => {
    it('el nombre de la sede es una subconsulta por congregation_id', async () => {
        const { believerFieldExpr } = await loadWith(true);
        expect(believerFieldExpr('congregation')).toBe(
            '(SELECT c.name FROM congregations c WHERE c.id = b.congregation_id)',
        );
    });

    it('las fechas de calendario vuelven texto en Postgres', async () => {
        const { believerFieldExpr } = await loadWith(true);
        expect(believerFieldExpr('arrivedAt')).toBe('b.arrived_at::text');
        expect(believerFieldExpr('lastNoteAt')).toBe('b.last_note_at::text');
    });

    it('en SQLite ya son texto ISO y se dejan como están', async () => {
        const { believerFieldExpr } = await loadWith(false);
        expect(believerFieldExpr('arrivedAt')).toBe('b.arrived_at');
    });

    it('el nombre completo concatena y recorta', async () => {
        const { believerFieldExpr } = await loadWith(false);
        expect(believerFieldExpr('fullName')).toBe("TRIM(b.first_name || ' ' || b.last_name)");
    });
});

describe('believerFieldOrderExpr', () => {
    it('orden con subconsulta correlacionada, sin JOIN en el FROM (D12)', async () => {
        const { believerFieldOrderExpr } = await loadWith(true);
        expect(believerFieldOrderExpr('phone')).toBe(
            '(SELECT b.phone FROM believers b WHERE b.id = row.believer_id AND b.deleted_at IS NULL)',
        );
    });

    it('los campos numéricos se normalizan con CAST según motor', async () => {
        const { believerFieldOrderExpr } = await loadWith(true);
        expect(believerFieldOrderExpr('bibleReadings')).toMatch(/\)::numeric$/);

        const { believerFieldOrderExpr: sqlite } = await loadWith(false);
        expect(sqlite('bibleReadings')).toMatch(/AS REAL\)$/);
    });
});

describe('believerSearchExpr', () => {
    it('busca en el creyente de la fila con un EXISTS y el mismo parámetro', async () => {
        const { believerSearchExpr } = await loadWith(false);
        const expr = believerSearchExpr('search');

        expect(expr).toContain('(EXISTS (SELECT 1 FROM believers b');
        expect(expr).toContain('b.id = row.believer_id');
        expect(expr).toContain('b.deleted_at IS NULL');
        for (const campo of ['first_name', 'last_name', 'search_name', 'phone', 'email']) {
            expect(expr).toContain(campo);
        }
        expect(expr).toContain(':search)');
    });
});

describe('believerFieldExists', () => {
    it('exige que el creyente exista y no esté borrado', async () => {
        const { believerFieldExists } = await loadWith(true);
        expect(believerFieldExists('b.status = :f0')).toBe(
            '(EXISTS (SELECT 1 FROM believers b WHERE b.id = row.believer_id AND b.deleted_at IS NULL AND b.status = :f0))',
        );
    });
});
