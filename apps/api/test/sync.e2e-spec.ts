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
            baseRevision: 3,
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
});
