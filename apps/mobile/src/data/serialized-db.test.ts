import { setupLocalDb } from './test-support';
import { setDbForTests } from './db';
import { openDatabaseAsync } from 'expo-sqlite';
import { serialize } from './serialized-db';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
let fixture: Awaited<ReturnType<typeof setupLocalDb>>;
beforeAll(async () => {
    fixture = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    await fixture.adapter.execAsync('CREATE TABLE transaction_fixture (id INTEGER)');
});
beforeEach(async () => {
    await fixture.adapter.execAsync('DELETE FROM transaction_fixture');
});
afterAll(() => fixture.close());
it('pone consultas y transacciones externas después de una restauración aislada', async () => {
    const db = serialize(fixture.adapter);
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
        release = resolve;
    });
    let externalStarted = false;
    const restore = db.withIsolatedTransactionAsync?.(async (transaction) => {
        await transaction.runAsync('INSERT INTO transaction_fixture VALUES (1)');
        await gate;
        await transaction.runAsync('INSERT INTO transaction_fixture VALUES (2)');
    });
    const outside = db.withTransactionAsync(async () => {
        externalStarted = true;
        await db.runAsync('INSERT INTO transaction_fixture VALUES (3)');
    });
    expect(externalStarted).toBe(false);
    release();
    await Promise.all([restore, outside]);
    expect(await db.getAllAsync('SELECT id FROM transaction_fixture ORDER BY id')).toEqual([
        { id: 1 },
        { id: 2 },
        { id: 3 },
    ]);
});
it('una transacción compuesta conserva el contexto y revierte los cambios internos', async () => {
    const db = serialize(fixture.adapter);
    await expect(
        db.withTransactionAsync(async () => {
            await db.runAsync('INSERT INTO transaction_fixture VALUES (1)');
            await db.withTransactionAsync(async () => {
                await db.runAsync('INSERT INTO transaction_fixture VALUES (2)');
            });
            await db.runAsync('INSERT INTO transaction_fixture VALUES (3)');
            throw new Error('rollback');
        }),
    ).rejects.toThrow('rollback');
    expect(await db.getAllAsync('SELECT id FROM transaction_fixture')).toEqual([]);
});
