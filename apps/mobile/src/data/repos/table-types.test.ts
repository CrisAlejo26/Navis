import { setupLocalDb } from '@/data/test-support';
import { setDbForTests } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';
import { createChurch } from './church-repo';
import { createTable } from './tables-writes';
import { readTable } from './tables-reads';
import { saveColumn } from './table-columns';
import { createTableRow } from './table-rows';
import { readTableRows, revealPassword } from './table-rows-read';
import { TABLE_COLUMN_TYPES, type RowData } from '@navis/shared';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));
let db: Awaited<ReturnType<typeof setupLocalDb>>;
beforeAll(async () => {
    db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
});
afterAll(() => db.close());
async function fixture() {
    const context = {
        churchId: (await createChurch({ name: 'Tipos', city: 'Madrid', ownerId: 'owner' })).id,
        userId: 'owner',
    };
    const id = await createTable(context, { name: 'Tipos', icon: 'clipboard' });
    return { context, id };
}
it('guarda los doce tipos, aplica filtros por tipo y fecha inclusiva con hora', async () => {
    const { context, id } = await fixture();
    for (const type of TABLE_COLUMN_TYPES)
        await saveColumn(context, id, {
            label: type,
            type,
            options: [{ value: 'a', label: 'A' }],
            config: { includeTime: true, currency: 'EUR' },
        });
    const table = await readTable(context, id),
        data: RowData = {};
    const values: Record<string, unknown> = {
        text: 'Texto',
        long_text: 'Detalle',
        number: -1.25,
        currency: 9.5,
        checkbox: false,
        date: '2028-02-29T12:00:00.000Z',
        single_select: 'a',
        multi_select: ['a'],
        email: 'qa@example.com',
        phone: '+34 600 123 456',
        url: 'https://example.com',
        password: 'secreto',
    };
    for (const column of table.columns) data[column.key] = values[column.type];
    const row = await createTableRow(context, id, { data });
    const result = await readTableRows(context, id);
    expect(result.items[0].mismatches).toEqual([]);
    for (const column of table.columns.filter((one) => one.type !== 'password'))
        expect(result.items[0].data[column.key]).toEqual(values[column.type]);
    const key = (type: string) => table.columns.find((one) => one.type === type)?.key ?? '';
    expect(await revealPassword(context, id, row, key('password'))).toBe('secreto');
    expect(
        (
            await readTableRows(context, id, {
                filters: [
                    { columnKey: key('multi_select'), operator: 'in', value: ['a'] },
                    { columnKey: key('checkbox'), operator: 'equals', value: false },
                    {
                        columnKey: key('date'),
                        operator: 'between',
                        value: { from: '2028-02-29', to: '2028-02-29' },
                    },
                ],
            })
        ).total,
    ).toBe(1);
    await expect(
        createTableRow(context, id, { data: { [key('number')]: 'invalid' } }),
    ).rejects.toThrow('invalid-value');
});
it('cifra valores existentes al convertir texto a contraseña y no expone ciphertext al revertir el tipo', async () => {
    const { context, id } = await fixture();
    await saveColumn(context, id, { label: 'Texto', type: 'text' });
    const column = (await readTable(context, id)).columns[0];
    const row = await createTableRow(context, id, { data: { [column.key]: 'valor-sensible' } });
    await saveColumn(context, id, { type: 'password' }, column.id);
    const raw = await db.adapter.getFirstAsync<{ data: string }>(
        'SELECT data FROM custom_table_rows WHERE id = ?',
        row,
    );
    expect(raw?.data).not.toContain('valor-sensible');
    expect(await revealPassword(context, id, row, column.key)).toBe('valor-sensible');
    await saveColumn(context, id, { type: 'text' }, column.id);
    expect((await readTableRows(context, id, { search: 'navisCipher' })).total).toBe(0);
    expect((await readTableRows(context, id, { search: 'valor-sensible' })).total).toBe(0);
});
it('hace cumplir 30 columnas y 50 opciones sin depender del formulario', async () => {
    const { context, id } = await fixture();
    await expect(
        saveColumn(context, id, {
            label: 'Estado',
            type: 'single_select',
            options: Array.from({ length: 51 }, (_, i) => ({ label: String(i) })),
        }),
    ).rejects.toThrow();
    for (let i = 0; i < 29; i++) await saveColumn(context, id, { label: String(i), type: 'text' });
    const concurrent = await Promise.allSettled([
        saveColumn(context, id, { label: 'Concurrent A', type: 'text' }),
        saveColumn(context, id, { label: 'Concurrent B', type: 'text' }),
    ]);
    expect(concurrent.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect((await readTable(context, id)).columns).toHaveLength(30);
    await expect(saveColumn(context, id, { label: 'Extra', type: 'text' })).rejects.toThrow(
        'column-limit',
    );
});
