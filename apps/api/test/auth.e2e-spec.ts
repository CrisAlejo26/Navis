import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';

/** `response.body` de supertest es `any`: esto le pone tipo en un solo sitio. */
const body = <T>(response: { body: unknown }): T => response.body as T;

/**
 * Recorre el flujo real: registro → sesión → endpoint protegido.
 * Necesita Postgres arrancado y migrado (`pnpm db:up && pnpm db:migrate`).
 */
describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  const email = `e2e-${String(Date.now())}@pastortools.test`;
  const password = 'PastorTools2026';
  let cookie = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    app.use('/api/auth', toNodeHandler(auth));
    app.use(express.json());
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health responde sin sesión', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(body<{ status: string }>(response).status).toBe('ok');
  });

  it('rechaza el perfil sin sesión', async () => {
    await request(app.getHttpServer()).get('/api/v1/me/profile').expect(401);
  });

  it('registra un usuario y devuelve cookie de sesión', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .send({ email, password, name: 'Usuario E2E' })
      .expect(200);

    const setCookie = response.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    cookie = (Array.isArray(setCookie) ? setCookie : [setCookie]).join('; ');
  });

  it('devuelve el perfil con la sesión activa y lo crea si no existía', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/me/profile')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).toMatchObject({ timezone: 'Europe/Madrid' });
    expect(body<{ userId: string }>(response).userId).toBeTruthy();
  });

  it('actualiza el perfil', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/me/profile')
      .set('Cookie', cookie)
      .send({ church: 'Iglesia E2E' })
      .expect(200);

    expect(body<{ church: string }>(response).church).toBe('Iglesia E2E');
  });
});
