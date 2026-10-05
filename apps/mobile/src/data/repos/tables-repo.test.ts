import { setupLocalDb } from '@/data/test-support';
import { getDb, setDbForTests, SCHEMA_VERSION } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';
import { createChurch } from './church-repo';
import { createBeliever, updateBeliever } from './believers-repo';
import { createTable, updateTable } from './tables-writes';
import { readTables, readTable, readTableViews } from './tables-reads';
import { saveColumn, deleteColumn, reorderColumns } from './table-columns';
import { createTableRow, updateTableRow } from './table-rows';
import { readTableRows, readCalendarCounts, revealPassword } from './table-rows-read';
import { createView, updateView, deleteView } from './table-views';
import { addTableBelievers } from './table-believers';
import { tableExport } from '@/lib/tables/export';
import { migrateTables } from '../tables-migration';
import { cellEnvelope } from '@/lib/tables/crypto';
import { rowDataSchema } from '@navis/shared';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));
let db: Awaited<ReturnType<typeof setupLocalDb>>;
let scope: { churchId: string; userId: string }, other: typeof scope;
beforeAll(async () => {
    db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
});
beforeEach(async () => {
    await db.clear();
    scope = {
        churchId: (await createChurch({ name: 'Norte', city: 'Madrid', ownerId: 'owner' })).id,
        userId: 'owner',
    };
    other = {
        churchId: (await createChurch({ name: 'Sur', city: 'Elda', ownerId: 'other' })).id,
        userId: 'other',
    };
});
afterAll(() => db.close());
async function fixture() {
    const id = await createTable(scope, { name: 'Inventario', icon: 'clipboard' });
    await saveColumn(scope, id, { label: 'Nombre', type: 'text' });
    await saveColumn(scope, id, { label: 'Importe', type: 'number' });
    await saveColumn(scope, id, {
        label: 'Estado',
        type: 'single_select',
        options: [
            { value: 'open', label: 'Abierto' },
            { value: 'done', label: 'Hecho' },
        ],
    });
    await saveColumn(scope, id, { label: 'Fecha', type: 'date' });
    const table = await readTable(scope, id);
    return {
        id,
        table,
        text: table.columns[0],
        number: table.columns[1],
        select: table.columns[2],
        date: table.columns[3],
    };
}
it('aisla padres, hijos y exportación y permite solo lectura a miembros', async () => {
    const { id, table, text, select } = await fixture();
    const row = await createTableRow(scope, id, { data: { [text.key]: 'Privado' } });
    const view = await createView(scope, id, {
        name: 'Equipo',
        type: 'kanban',
        groupBy: select.key,
    });
    expect(await readTables(other)).toEqual([]);
    const foreign = await createTable(other, { name: 'Ajena', icon: 'clipboard' });
    await expect(readTableRows(other, id)).rejects.toThrow('not-found');
    await expect(saveColumn(other, id, { label: 'Ataque', type: 'text' }, text.id)).rejects.toThrow(
        'not-found',
    );
    await expect(updateTableRow(scope, foreign, row, { data: {} })).rejects.toThrow('not-found');
    await expect(updateView(scope, foreign, view, { name: 'Ataque' })).rejects.toThrow('not-found');
    await db.adapter.runAsync(
        'INSERT INTO church_members (id, church_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        'member',
        scope.churchId,
        'reader',
        't',
        't',
    );
    const reader = { ...scope, userId: 'reader' };
    expect((await readTableRows(reader, id)).total).toBe(1);
    await expect(createTableRow(reader, id, { data: {} })).rejects.toThrow('not-found');
    await expect(
        tableExport(reader, table, {}, [text.key], new AbortController().signal),
    ).rejects.toThrow('not-found');
});
it('filtra y ordena el conjunto completo, exporta más de una página y conserva JSON histórico', async () => {
    const { id, text, number, table } = await fixture();
    for (let index = 0; index < 205; index++)
        await createTableRow(scope, id, {
            data: { [text.key]: `Fila ${index}`, [number.key]: index - 100.5 },
        });
    const page = await readTableRows(scope, id, { sort: number.key, order: 'asc' });
    expect(page.total).toBe(205);
    expect(page.items[0].data[number.key]).toBe(-100.5);
    expect((await readTableRows(scope, id, { search: 'Fila 204' })).total).toBe(1);
    expect(
        (
            await readTableRows(scope, id, {
                filters: [{ columnKey: number.key, operator: 'between', value: { min: 100 } }],
            })
        ).total,
    ).toBe(4);
    const file = await tableExport(
        scope,
        table,
        { sort: number.key, order: 'asc' },
        [text.key, number.key],
        new AbortController().signal,
    );
    expect(file.rows).toHaveLength(205);
    await saveColumn(scope, id, { label: 'Renombrada', type: 'checkbox' }, text.id);
    expect((await readTable(scope, id)).columns[0].key).toBe(text.key);
    const row = page.items[0];
    await updateTableRow(scope, id, row.id, { data: { [number.key]: 42 } });
    expect(
        (await readTableRows(scope, id, { sort: number.key })).items.some(
            (one) => one.data[text.key] === 'Fila 0',
        ),
    ).toBe(false);
    const raw = await db.adapter.getFirstAsync<{ data: string }>(
        'SELECT data FROM custom_table_rows WHERE id = ?',
        row.id,
    );
    expect(rowDataSchema.parse(JSON.parse(raw?.data ?? '{}') as unknown)[text.key]).toBe('Fila 0');
    await deleteColumn(scope, id, text.id);
    expect((await readTable(scope, id)).columns).toHaveLength(3);
    await expect(reorderColumns(scope, id, [number.id])).rejects.toThrow('invalid-order');
});
it('mantiene vistas del mismo tipo independientes y no trunca conteos de calendario', async () => {
    const { id, select, date } = await fixture();
    for (let index = 0; index < 85; index++)
        await createTableRow(scope, id, {
            data: { [date.key]: '2028-02-29', [select.key]: index % 2 ? 'open' : 'done' },
        });
    await saveColumn(scope, id, { options: [{ value: 'open', label: 'Abierto' }] }, select.id);
    const a = await createView(scope, id, { name: 'A', type: 'kanban', groupBy: select.key });
    const b = await createView(scope, id, { name: 'B', type: 'kanban', groupBy: select.key });
    await updateView(scope, id, a, {
        filters: [{ columnKey: select.key, operator: 'in', value: ['open'] }],
    });
    expect((await readTableViews(scope, id)).find((view) => view.id === b)?.filters).toEqual([]);
    const counts = await readCalendarCounts(scope, id, {}, date.key, '2028-02-01', '2028-03-03');
    expect(counts['2028-02-29']).toBe(85);
    const agenda = await readTableRows(
        scope,
        id,
        { day: { key: date.key, value: '2028-02-29' } },
        3,
    );
    expect(agenda.items).toHaveLength(5);
    expect(agenda.total).toBe(85);
    expect((await readTableRows(scope, id, { lane: { key: select.key, value: null } })).total).toBe(
        43,
    );
    await deleteView(scope, id, a);
    expect((await readTableRows(scope, id)).total).toBe(85);
});
it('resuelve vínculos vivos antes de filtrar, bloquea duplicados y conserva valores manuales al desenlazar', async () => {
    const { id, text } = await fixture();
    const believer = await createBeliever(scope.churchId, { firstName: 'Ana' });
    const foreign = await createBeliever(other.churchId, { firstName: 'Eva' });
    await updateTable(scope, id, { source: 'believers' });
    await saveColumn(scope, id, { believerField: 'fullName' }, text.id);
    await expect(
        addTableBelievers(scope, id, { believerIds: [believer, foreign] }),
    ).rejects.toThrow('not-found');
    expect((await readTableRows(scope, id)).total).toBe(0);
    await addTableBelievers(scope, id, { believerIds: [believer, believer] });
    await addTableBelievers(scope, id, { believerIds: [believer] });
    expect((await readTableRows(scope, id, { search: 'Ana' })).total).toBe(1);
    await updateBeliever(believer, scope.churchId, { firstName: 'Luisa' });
    expect((await readTableRows(scope, id, { search: 'Luisa' })).total).toBe(1);
    const row = (await readTableRows(scope, id)).items[0];
    await expect(
        updateTableRow(scope, id, row.id, { data: { [text.key]: 'Manual' } }),
    ).rejects.toThrow('bound-readonly');
    await updateTable(scope, id, { source: null });
    await updateTableRow(scope, id, row.id, { data: { [text.key]: 'Manual' } });
    await updateTable(scope, id, { source: 'believers' });
    expect((await readTableRows(scope, id)).items[0].data[text.key]).toBe('Luisa');
    await updateTable(scope, id, { source: null });
    expect((await readTableRows(scope, id)).items[0].data[text.key]).toBe('Manual');
});
it('cifra passwords, rechaza manipulación y nunca los busca ni filtra', async () => {
    const { id, text } = await fixture();
    await saveColumn(scope, id, { label: 'Clave', type: 'password' });
    const password = (await readTable(scope, id)).columns[4];
    const row = await createTableRow(scope, id, {
        data: { [password.key]: 'secret-password', [text.key]: 'Visible' },
    });
    expect((await readTableRows(scope, id, { search: 'secret-password' })).total).toBe(0);
    expect(await revealPassword(scope, id, row, password.key)).toBe('secret-password');
    const raw = await db.adapter.getFirstAsync<{ data: string }>(
        'SELECT data FROM custom_table_rows WHERE id = ?',
        row,
    );
    expect(raw?.data).not.toContain('secret-password');
    const data = rowDataSchema.parse(JSON.parse(raw?.data ?? '{}') as unknown),
        envelope = cellEnvelope.parse(data[password.key]);
    data[password.key] = { ...envelope, sealed: envelope.sealed.slice(0, -4) + 'AAAA' };
    await db.adapter.runAsync(
        'UPDATE custom_table_rows SET data = ? WHERE id = ?',
        JSON.stringify(data),
        row,
    );
    await expect(revealPassword(scope, id, row, password.key)).rejects.toThrow();
    await expect(
        readTableRows(scope, id, {
            filters: [{ columnKey: password.key, operator: 'contains', value: 'secret' }],
        }),
    ).rejects.toThrow();
});
it('actualiza desde v12 sin perder iglesias y la migración es idempotente', async () => {
    db.memory.exec(
        'DROP TABLE custom_table_views; DROP TABLE custom_table_rows; DROP TABLE custom_table_columns; DROP TABLE custom_tables; PRAGMA user_version = 12',
    );
    setDbForTests(null);
    const local = await getDb();
    await migrateTables(local);
    expect(await local.getFirstAsync('PRAGMA user_version')).toEqual({
        user_version: SCHEMA_VERSION,
    });
    expect(await readTables(scope)).toEqual([]);
    const indexes = await local.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'UQ_custom%_id'",
    );
    expect(indexes).toHaveLength(4);
});
