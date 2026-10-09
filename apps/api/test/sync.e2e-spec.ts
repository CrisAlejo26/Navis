import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
    BelieverListItem,
    DeviceCredential,
    DeviceLink,
    SyncChangesPage,
    SyncOperationResult,
} from '@navis/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// La bandera se lee al importar la configuración: tiene que estar antes que `AppModule`.
vi.hoisted(() => {
    process.env.SYNC_ENABLED = 'true';
});

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';
import { SyncAdapterRegistry } from '../src/sync/sync-adapter-registry';

const body = <T>(response: { body: unknown }): T => response.body as T;

/**
 * El registro de cambios de punta a punta: lo que escribe un usuario aparece en
 * el flujo de otro dispositivo suyo, no en el de quien no puede verlo, y una
 * operación repetida se ejecuta una sola vez.
 */
describe('Sincronización: cambios y operaciones (e2e)', () => {
    let app: NestExpressApplication;
    const stamp = String(Date.now());
    const password = 'Rebano2026Seguro';
    let cookieA = '';
    let cookieB = '';
    let bearerA = '';
    let believerId = '';
    let cursor = 0;
    let generation = '';

    const http = () => request(app.getHttpServer());
    const feed = (auth: { cookie?: string; bearer?: string }, query: string) => {
        const call = http().get(`/api/v1/sync/changes?${query}`);
        return auth.bearer
            ? call.set('Authorization', auth.bearer)
            : call.set('Cookie', auth.cookie ?? '');
    };

    async function signUp(label: string): Promise<string> {
        const email = `sync-${label}-${stamp}@navis.test`;
        await http()
            .post('/api/auth/sign-up/email')
            .send({ email, password, name: `Sync ${label}` })
            .expect(200);
        const dataSource = app.get(DataSource);
        const marca = dataSource.options.type === 'postgres' ? '$1' : '?';
        await dataSource.query(`UPDATE "user" SET "role" = 'superadmin' WHERE "email" = ${marca}`, [
            email,
        ]);
        const login = await http()
            .post('/api/auth/sign-in/email')
            .send({ email, password })
            .expect(200);
        const setCookie = login.headers['set-cookie'];
        const cookie = (Array.isArray(setCookie) ? setCookie : [setCookie]).join('; ');
        await http()
            .post('/api/v1/churches')
            .set('Cookie', cookie)
            .send({ name: `Iglesia ${label} ${stamp}`, city: 'Elda' })
            .expect(201);
        return cookie;
    }

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
        app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
        app.use('/api/auth', toNodeHandler(auth));
        app.use(express.json());
        app.setGlobalPrefix('api', { exclude: ['health'] });
        app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        cookieA = await signUp('a');
        cookieB = await signUp('b');

        const link = body<DeviceLink>(
            await http().post('/api/v1/device-links').set('Cookie', cookieA).expect(201),
        );
        const credential = body<DeviceCredential>(
            await http()
                .post('/api/v1/device-links/exchange')
                .send({ token: link.token, deviceName: 'Móvil de A' })
                .expect(200),
        );
        bearerA = `Bearer ${credential.credential}`;
    });

    afterAll(async () => {
        await app.close();
    });

    it('un creyente creado en la web llega al móvil de su dueño con su fila completa', async () => {
        const created = await http()
            .post('/api/v1/believers')
            .set('Cookie', cookieA)
            .send({ firstName: 'Sincronía', lastName: 'Prueba', status: 'nuevo' })
            .expect(201);
        believerId = body<BelieverListItem>(created).id;

        const page = body<SyncChangesPage>(await feed({ bearer: bearerA }, 'cursor=0').expect(200));
        generation = page.generation;
        cursor = page.nextCursor;

        const change = page.changes.find(
            (one) => one.table === 'believers' && one.id === believerId,
        );
        expect(change).toMatchObject({ op: 'upsert', revision: 1 });
        expect(change?.row).toMatchObject({ first_name: 'Sincronía', status: 'nuevo' });
        expect(page.hasMore).toBe(false);
    });

    it('con el cursor al día no hay nada nuevo', async () => {
        const page = body<SyncChangesPage>(
            await feed(
                { bearer: bearerA },
                `cursor=${String(cursor)}&generation=${generation}`,
            ).expect(200),
        );
        expect(page.changes).toEqual([]);
        expect(page.nextCursor).toBe(cursor);
    });

    it('quien no es de la iglesia no ve el cambio', async () => {
        const page = body<SyncChangesPage>(await feed({ cookie: cookieB }, 'cursor=0').expect(200));
        expect(page.changes.some((one) => one.id === believerId)).toBe(false);
    });

    it('editar sube la revisión y borrar llega como borrado', async () => {
        await http()
            .patch(`/api/v1/believers/${believerId}`)
            .set('Cookie', cookieA)
            .send({ firstName: 'Editado' })
            .expect(200);
        const edited = body<SyncChangesPage>(
            await feed({ bearer: bearerA }, `cursor=${String(cursor)}`).expect(200),
        );
        const change = edited.changes.find((one) => one.id === believerId);
        expect(change?.revision).toBeGreaterThan(1);
        expect(change?.row).toMatchObject({ first_name: 'Editado' });
        cursor = edited.nextCursor;

        await http().delete(`/api/v1/believers/${believerId}`).set('Cookie', cookieA).expect(200);
        const removed = body<SyncChangesPage>(
            await feed({ bearer: bearerA }, `cursor=${String(cursor)}`).expect(200),
        );
        expect(removed.changes.find((one) => one.id === believerId)).toMatchObject({
            op: 'delete',
            row: null,
        });
    });

    it('pide rehacer la descarga si cambió la instalación o el cursor es del futuro', async () => {
        await feed({ bearer: bearerA }, 'cursor=0&generation=otra-generacion').expect(409);
        await feed({ bearer: bearerA }, 'cursor=999999999').expect(409);
    });

    it('ejecuta una operación una sola vez aunque se repita, y rechaza reusar su identificador', async () => {
        let executions = 0;
        app.get(SyncAdapterRegistry).register({
            table: 'tags',
            apply: () => {
                executions += 1;
                return Promise.resolve({ status: 'applied', revision: 4 });
            },
        });
        const operation = {
            operationId: crypto.randomUUID(),
            table: 'tags',
            id: crypto.randomUUID(),
            op: 'upsert',
            baseRevision: 0,
            fields: { name: 'Etiqueta' },
        };
        const send = (operations: object[]) =>
            http()
                .post('/api/v1/sync/operations')
                .set('Authorization', bearerA)
                .send({ operations });

        const first = body<{ results: SyncOperationResult[] }>(await send([operation]).expect(201));
        const again = body<{ results: SyncOperationResult[] }>(await send([operation]).expect(201));
        const reused = body<{ results: SyncOperationResult[] }>(
            await send([{ ...operation, fields: { name: 'Otra' } }]).expect(201),
        );
        const unsupported = body<{ results: SyncOperationResult[] }>(
            await send([
                { ...operation, operationId: crypto.randomUUID(), table: 'dreams' },
            ]).expect(201),
        );

        expect(first.results[0]).toMatchObject({ status: 'applied', revision: 4 });
        expect(again.results[0]).toMatchObject({ status: 'duplicate', revision: 4 });
        expect(reused.results[0]).toMatchObject({
            status: 'rejected',
            reason: 'operation-id-reuse',
        });
        expect(unsupported.results[0]).toMatchObject({
            status: 'rejected',
            reason: 'unsupported-table',
        });
        expect(executions).toBe(1);
    });
    it('un rol sin permisos no recibe lo que la web le niega, pero sí su iglesia', async () => {
        // Un tercero sin rol de gestión entra como miembro de la iglesia de A.
        const email = `sync-c-${stamp}@navis.test`;
        await http()
            .post('/api/auth/sign-up/email')
            .send({ email, password, name: 'Sync c' })
            .expect(200);
        const login = await http()
            .post('/api/auth/sign-in/email')
            .send({ email, password })
            .expect(200);
        const setCookie = login.headers['set-cookie'];
        const cookieC = (Array.isArray(setCookie) ? setCookie : [setCookie]).join('; ');

        const mine = body<{ activeId: string | null }>(
            await http().get('/api/v1/churches').set('Cookie', cookieA).expect(200),
        );
        const churchId = mine.activeId ?? '';
        const dataSource = app.get(DataSource);
        const marca = dataSource.options.type === 'postgres' ? ['$1', '$2', '$3'] : ['?', '?', '?'];
        const found: unknown = await dataSource.query(
            `SELECT id FROM "user" WHERE email = ${marca[0] ?? '?'}`,
            [email],
        );
        const userId = Array.isArray(found) ? String((found[0] as { id: string }).id) : '';
        await dataSource.query(
            `INSERT INTO church_members (id, church_id, user_id) VALUES (${marca[0] ?? '?'}, ${marca[1] ?? '?'}, ${marca[2] ?? '?'})`,
            [crypto.randomUUID(), churchId, userId],
        );

        await http()
            .post('/api/v1/believers')
            .set('Cookie', cookieA)
            .send({ firstName: 'Reservado', lastName: 'Fuera', status: 'nuevo' })
            .expect(201);

        const page = body<SyncChangesPage>(await feed({ cookie: cookieC }, 'cursor=0').expect(200));
        const tables = new Set(page.changes.map((one) => one.table));
        expect(tables.has('churches')).toBe(true);
        expect(tables.has('believers')).toBe(false);
        expect(tables.has('believer_tags')).toBe(false);
    });

    it('las contraseñas de las tablas llegan en claro al dispositivo autorizado, aunque en la base estén cifradas', async () => {
        const table = body<{ id: string }>(
            await http()
                .post('/api/v1/tables')
                .set('Cookie', cookieA)
                .send({ name: `Claves ${stamp}`, icon: 'book-open', accent: '#2140cf' })
                .expect(201),
        );
        const column = body<{ key: string }>(
            await http()
                .post(`/api/v1/tables/${table.id}/columns`)
                .set('Cookie', cookieA)
                .send({ label: 'Clave del salón', type: 'password' })
                .expect(201),
        );
        const row = body<{ id: string }>(
            await http()
                .post(`/api/v1/tables/${table.id}/rows`)
                .set('Cookie', cookieA)
                .send({ data: { [column.key]: 'portal-2026' } })
                .expect(201),
        );

        const stored: unknown = await app
            .get(DataSource)
            .query(`SELECT data FROM custom_table_rows WHERE id = '${row.id}'`);
        expect(JSON.stringify(stored)).not.toContain('portal-2026');

        const page = body<SyncChangesPage>(await feed({ bearer: bearerA }, 'cursor=0').expect(200));
        const change = page.changes.find(
            (one) => one.table === 'custom_table_rows' && one.id === row.id,
        );
        expect(String(change?.row?.data)).toContain('portal-2026');
    });

    it('no deja borrar una iglesia por la vía de sincronización, aunque haya adaptador', async () => {
        let executions = 0;
        app.get(SyncAdapterRegistry).register({
            table: 'churches',
            apply: () => {
                executions += 1;
                return Promise.resolve({ status: 'applied', revision: 2 });
            },
        });
        const response = await http()
            .post('/api/v1/sync/operations')
            .set('Authorization', bearerA)
            .send({
                operations: [
                    {
                        operationId: crypto.randomUUID(),
                        table: 'churches',
                        id: crypto.randomUUID(),
                        op: 'delete',
                        baseRevision: 0,
                    },
                ],
            })
            .expect(201);

        const { results } = body<{ results: SyncOperationResult[] }>(response);
        expect(results[0]).toMatchObject({ status: 'rejected', reason: 'protected-entity' });
        expect(executions).toBe(0);
    });

    it('si la entidad avanzó desde que el cliente la leyó, la operación es un conflicto y no se ejecuta', async () => {
        const created = await http()
            .post('/api/v1/believers')
            .set('Cookie', cookieA)
            .send({ firstName: 'Concurrente', lastName: 'Base', status: 'nuevo' })
            .expect(201);
        const id = body<BelieverListItem>(created).id;

        let executions = 0;
        app.get(SyncAdapterRegistry).register({
            table: 'believers',
            apply: () => {
                executions += 1;
                return Promise.resolve({ status: 'applied', revision: 2 });
            },
        });
        const send = (baseRevision: number) =>
            http()
                .post('/api/v1/sync/operations')
                .set('Authorization', bearerA)
                .send({
                    operations: [
                        {
                            operationId: crypto.randomUUID(),
                            table: 'believers',
                            id,
                            op: 'upsert',
                            baseRevision,
                        },
                    ],
                })
                .expect(201);

        const stale = body<{ results: SyncOperationResult[] }>(await send(0));
        expect(stale.results[0]).toMatchObject({
            status: 'conflict',
            reason: 'stale-base',
            revision: 1,
        });
        expect(executions).toBe(0);

        const fresh = body<{ results: SyncOperationResult[] }>(await send(1));
        expect(fresh.results[0]).toMatchObject({ status: 'applied' });
        expect(executions).toBe(1);
    });
});
