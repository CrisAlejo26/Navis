import { setupLocalDb } from '@/data/test-support';
import { setDbForTests } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';
import { restoreRows } from './restore-rows';
import type { BackupRow } from './backup-format';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
let db: Awaited<ReturnType<typeof setupLocalDb>>;
beforeAll(async () => {
    db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    await db.adapter.execAsync(
        "CREATE TABLE restore_fixture (id TEXT PRIMARY KEY, body TEXT, optional TEXT DEFAULT 'old-default')",
    );
});
beforeEach(async () => {
    await db.adapter.runAsync('DELETE FROM restore_fixture');
});
afterAll(() => db.close());
it('restaura 2000 filas en lotes con columnas opcionales distintas y valores parametrizados', async () => {
    const rows: BackupRow[] = Array.from({ length: 2000 }, (_, index): BackupRow =>
        index % 2
            ? { id: String(index), body: "Texto ' ? ;", optional: null }
            : { id: String(index), body: "Texto ' ? ;" },
    );
    await restoreRows(db.adapter, 'restore_fixture', rows);
    expect(await db.adapter.getFirstAsync('SELECT COUNT(*) total FROM restore_fixture')).toEqual({
        total: 2000,
    });
    expect(
        await db.adapter.getFirstAsync("SELECT body, optional FROM restore_fixture WHERE id = '0'"),
    ).toEqual({ body: "Texto ' ? ;", optional: 'old-default' });
    expect(
        await db.adapter.getFirstAsync("SELECT optional FROM restore_fixture WHERE id = '1'"),
    ).toEqual({ optional: null });
});
it('un fallo en un lote revierte también los lotes anteriores dentro de la transacción', async () => {
    const rows = Array.from({ length: 1000 }, (_, index) => ({ id: String(index), body: 'Texto' }));
    rows[999].id = '0';
    await expect(
        db.adapter.withTransactionAsync(() => restoreRows(db.adapter, 'restore_fixture', rows)),
    ).rejects.toThrow();
    expect(await db.adapter.getFirstAsync('SELECT COUNT(*) total FROM restore_fixture')).toEqual({
        total: 0,
    });
});
