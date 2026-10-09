import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { Device, DeviceCredential, DeviceLink } from '@navis/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';

/** `response.body` de supertest es `any`: esto le pone tipo en un solo sitio. */
const body = <T>(response: { body: unknown }): T => response.body as T;

/** Vinculación de dispositivos (sincronización, Fase 1): el flujo entero contra la API real. */
describe('Dispositivos (e2e)', () => {
    let app: NestExpressApplication;
    let cookie = '';
    const email = `e2e-dev-${String(Date.now())}@navis.test`;

    const http = () => request(app.getHttpServer());
    const newLink = async (): Promise<DeviceLink> =>
        body<DeviceLink>(
            await http().post('/api/v1/device-links').set('Cookie', cookie).expect(201),
        );
    const exchange = (token: string, deviceName = 'Pixel de prueba') =>
        http().post('/api/v1/device-links/exchange').send({ token, deviceName });

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
        app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
        app.use('/api/auth', toNodeHandler(auth));
        app.use(express.json());
        app.setGlobalPrefix('api', { exclude: ['health'] });
        app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        const signUp = await http()
            .post('/api/auth/sign-up/email')
            .send({ email, password: 'Rebano2026Seguro', name: 'Ana Dispositivos' })
            .expect(200);
        const setCookie = signUp.headers['set-cookie'];
        cookie = (Array.isArray(setCookie) ? setCookie : [setCookie]).join('; ');
    });

    afterAll(async () => {
        await app.close();
    });

    it('declara el servidor y el protocolo sin pedir sesión', async () => {
        const response = await http().get('/api/v1/sync/capabilities').expect(200);
        expect(response.body).toMatchObject({
            installationName: 'Navis',
            dataSyncEnabled: process.env.SYNC_ENABLED === 'true',
        });
    });

    it('no genera tokens sin sesión', async () => {
        await http().post('/api/v1/device-links').expect(401);
    });

    it('canjea el token una sola vez y entrega una credencial que identifica a la cuenta', async () => {
        const link = await newLink();
        const first = await exchange(link.token).expect(200);
        const credential = body<DeviceCredential>(first);
        expect(credential.account.email).toBe(email);

        await exchange(link.token).expect(403);

        const profile = await http()
            .get('/api/v1/me/profile')
            .set('Authorization', `Bearer ${credential.credential}`)
            .expect(200);
        expect(body<{ userId: string }>(profile).userId).toBe(credential.account.id);
    });

    it('rechaza un token inventado', async () => {
        await exchange('nvl_esto-no-existe-en-ninguna-parte').expect(403);
    });

    it('lista el dispositivo y deja de aceptar su credencial al revocarlo', async () => {
        const credential = body<DeviceCredential>(
            await exchange((await newLink()).token, 'Móvil a revocar').expect(200),
        );
        const bearer = { Authorization: `Bearer ${credential.credential}` };

        const own = body<Device[]>(await http().get('/api/v1/devices').set(bearer).expect(200));
        expect(own.find((d) => d.id === credential.device.id)?.current).toBe(true);

        await http()
            .delete(`/api/v1/devices/${credential.device.id}`)
            .set('Cookie', cookie)
            .expect(204);
        await http().get('/api/v1/me/profile').set(bearer).expect(401);
    });

    it('permite vincular tantos teléfonos como se quiera a la misma cuenta', async () => {
        const created: DeviceCredential[] = [];
        for (let i = 0; i < 6; i += 1) {
            const link = await newLink();
            created.push(
                body<DeviceCredential>(
                    await exchange(link.token, `Móvil ${String(i)}`).expect(200),
                ),
            );
        }

        const listed = body<Device[]>(await http().get('/api/v1/devices').set('Cookie', cookie));
        for (const device of created) {
            expect(listed.some((d) => d.id === device.device.id)).toBe(true);
            await http()
                .get('/api/v1/me/profile')
                .set('Authorization', `Bearer ${device.credential}`)
                .expect(200);
        }
    });

    it('no deja que un dispositivo vinculado genere más vínculos', async () => {
        const credential = body<DeviceCredential>(
            await exchange((await newLink()).token).expect(200),
        );
        await http()
            .post('/api/v1/device-links')
            .set('Authorization', `Bearer ${credential.credential}`)
            .expect(403);
    });
});
