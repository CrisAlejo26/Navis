import { triggerStatements } from '@navis/shared';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { dataSourceOptions } from '../database/data-source';
import { SyncRetentionService } from './sync-retention.service';
import { repairTriggers, tablesMissingTriggers } from './sync-triggers-health';

let dataSource: DataSource;
const day = 86_400_000;
const iso = (ageDays: number): string =>
    new Date(Date.now() - ageDays * day).toISOString().replace('T', ' ').replace('Z', '');

/** Hasta dónde ha podado el registro (la fila única de instalación). */
async function floor(): Promise<number> {
    const rows: unknown = await dataSource.query('SELECT pruned_through FROM sync_installation');
    const first = Array.isArray(rows)
        ? (rows[0] as { pruned_through: number } | undefined)
        : undefined;
    return first?.pruned_through ?? -1;
}

async function addChange(position: number | null, ageDays: number): Promise<void> {
    await dataSource.query(
        `INSERT INTO sync_changes (id, position, table_name, entity_id, op, revision, created_at) VALUES (?, ?, 'believers', ?, 'upsert', 1, ?)`,
        [crypto.randomUUID(), position, crypto.randomUUID(), iso(ageDays)],
    );
}

beforeAll(async () => {
    dataSource = new DataSource({
        type: 'better-sqlite3',
        database: ':memory:',
        entities: dataSourceOptions.entities as never[],
        synchronize: true,
    });
    await dataSource.initialize();
    await dataSource.query('PRAGMA foreign_keys = OFF');
});

afterAll(async () => {
    await dataSource.destroy();
});

beforeEach(async () => {
    await dataSource.query('DELETE FROM sync_changes');
    await dataSource.query('DELETE FROM sync_receipts');
    await dataSource.query('DELETE FROM sync_installation');
    await dataSource.query(
        `INSERT INTO sync_installation (id, generation, capturing, pruned_through) VALUES ('main', 'g', 0, 0)`,
    );
});

describe('poda del registro', () => {
    it('borra lo publicado hasta la última posición vieja y apunta el suelo', async () => {
        await addChange(1, 400);
        await addChange(2, 10);
        await addChange(3, 200);
        await addChange(null, 400);

        const result = await new SyncRetentionService(dataSource).prune();

        // La 3 es vieja: se borra todo hasta ella aunque la 2 sea reciente (sin huecos con el cursor dentro).
        expect(result.changes).toBe(3);
        expect(await floor()).toBe(3);
        const left = await dataSource.query('SELECT position FROM sync_changes');
        expect(left).toEqual([{ position: null }]);
    });

    it('no toca nada si no hay nada viejo y el suelo no retrocede', async () => {
        await dataSource.query(`UPDATE sync_installation SET pruned_through = 9`);
        await addChange(10, 1);
        const result = await new SyncRetentionService(dataSource).prune();
        expect(result.changes).toBe(0);
        expect(await floor()).toBe(9);
    });

    it('borra los recibos viejos y conserva los recientes', async () => {
        for (const age of [400, 1]) {
            await dataSource.query(
                `INSERT INTO sync_receipts (id, device_id, operation_id, request_hash, result, created_at) VALUES (?, 'd', ?, 'h', '{}', ?)`,
                [crypto.randomUUID(), crypto.randomUUID(), iso(age)],
            );
        }
        const result = await new SyncRetentionService(dataSource).prune();
        expect(result.receipts).toBe(1);
    });
});

describe('autochequeo de triggers', () => {
    it('detecta y repara una tabla que perdió sus triggers (migración que la recreó)', async () => {
        for (const statement of triggerStatements('sqlite')) await dataSource.query(statement);
        expect(await tablesMissingTriggers(dataSource)).toEqual([]);

        await dataSource.query('DROP TRIGGER sync_believers_au');
        expect(await tablesMissingTriggers(dataSource)).toEqual(['believers']);

        expect(await repairTriggers(dataSource)).toEqual(['believers']);
        expect(await tablesMissingTriggers(dataSource)).toEqual([]);
    });
});
