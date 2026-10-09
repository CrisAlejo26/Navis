import { setupLocalDb } from '@/data/test-support';
import { setDbForTests } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';
import { deleteItemAsync } from 'expo-secure-store';
import { createChurch } from '@/data/repos/church-repo';
import { createAccount, login } from '@/data/repos/account-repo';
import { createTable } from '@/data/repos/tables-writes';
import { readTable } from '@/data/repos/tables-reads';
import { saveColumn } from '@/data/repos/table-columns';
import { createTableRow } from '@/data/repos/table-rows';
import { revealPassword } from '@/data/repos/table-rows-read';
import { buildBackup } from '@/lib/backup/create-backup';
import { restoreBackup } from '@/lib/backup/restore-backup';
import { asV1Copy, reseal } from '@/lib/backup/test-copies';
import type { BackupFiles } from '@/lib/backup/backup-format';
import { rowDataSchema } from '@navis/shared';
import { cellEnvelope } from './crypto';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));
jest.setTimeout(60_000);
const files: BackupFiles = {
    readAudio: () => Promise.resolve(null),
    readPhoto: () => Promise.resolve(null),
    writeAudio: () => Promise.resolve(undefined),
    writePhoto: () => Promise.resolve(undefined),
    audioUri: (id) => id,
    photoUri: (id) => id,
};
let db: Awaited<ReturnType<typeof setupLocalDb>>;
beforeAll(async () => {
    db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
});
afterAll(() => db.close());
it('recupera una contraseña en otra instalación con secreto y rechaza secreto incorrecto antes de modificar SQLite', async () => {
    const account = await createAccount({
        name: 'Backup QA',
        email: 'backup@qa.test',
        password: 'Account-password-2026',
    });
    if ('error' in account) throw new Error(account.error);
    const context = {
        churchId: (await createChurch({ name: 'Norte', city: 'Madrid', ownerId: account.user.id }))
            .id,
        userId: account.user.id,
    };
    const id = await createTable(context, { name: 'Claves', icon: 'clipboard' });
    await saveColumn(context, id, { label: 'Password', type: 'password' });
    const column = (await readTable(context, id)).columns[0];
    const row = await createTableRow(context, id, { data: { [column.key]: 'Secreto original' } });
    await expect(buildBackup(files)).rejects.toThrow('recovery-secret-required');
    const backup = await buildBackup(files, 'recovery-secret-2026');
    expect(JSON.stringify(backup)).not.toContain('Secreto original');
    const raw = await db.adapter.getFirstAsync<{ data: string }>(
        'SELECT data FROM custom_table_rows WHERE id = ?',
        row,
    );
    const envelope = cellEnvelope.parse(
        rowDataSchema.parse(JSON.parse(raw?.data ?? '{}') as unknown)[column.key],
    );
    await deleteItemAsync('navis.table-key.' + envelope.keyId);
    await deleteItemAsync('navis.local.pepper');
    await db.clear();
    await expect(
        restoreBackup(JSON.stringify(backup), files, 'wrong-secret-2026'),
    ).rejects.toThrow();
    expect(await db.adapter.getAllAsync('SELECT * FROM custom_tables')).toEqual([]);
    await restoreBackup(JSON.stringify(backup), files, 'recovery-secret-2026');
    expect(
        await login({ email: account.user.email, password: 'Account-password-2026' }),
    ).toMatchObject({ user: { id: account.user.id } });
    expect(await revealPassword(context, id, row, column.key)).toBe('Secreto original');
    const plaintext = {
        ...backup,
        tables: {
            ...backup.tables,
            custom_table_rows: backup.tables.custom_table_rows.map((item) =>
                item.id === row
                    ? { ...item, data: JSON.stringify({ [column.key]: 'unprotected' }) }
                    : item,
            ),
        },
    };
    await expect(
        restoreBackup(JSON.stringify(reseal(plaintext)), files, 'recovery-secret-2026'),
    ).rejects.toThrow('unencrypted-password-backup');
    expect(await revealPassword(context, id, row, column.key)).toBe('Secreto original');
    const withoutKeys = { ...backup, tableKeys: undefined };
    await expect(restoreBackup(JSON.stringify(reseal(withoutKeys)), files)).rejects.toThrow(
        'missing-backup-keys',
    );
    expect(await revealPassword(context, id, row, column.key)).toBe('Secreto original');
});
it('acepta backups anteriores sin tablas y rechaza relaciones de otra iglesia', async () => {
    const backup = await buildBackup(files, 'recovery-secret-2026');
    const old = {
        ...backup,
        schemaVersion: 12,
        tableKeys: undefined,
        tables: Object.fromEntries(
            Object.entries(backup.tables).filter(([name]) => !name.startsWith('custom_table')),
        ),
    };
    await restoreBackup(JSON.stringify(asV1Copy(old)), files);
    expect(await db.adapter.getAllAsync('SELECT * FROM custom_tables')).toEqual([]);
    backup.tables.custom_tables[0].church_id = 'foreign';
    await expect(
        restoreBackup(JSON.stringify(reseal(backup)), files, 'recovery-secret-2026'),
    ).rejects.toThrow('invalid-table-parent');
});
