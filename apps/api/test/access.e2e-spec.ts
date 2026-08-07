import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Church, ManagedUser, MyChurches, Paginated } from '@navis/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';

const body = <T>(response: { body: unknown }): T => response.body as T;

/**
 * El tope de roles, el onboarding independiente del pastor y el alcance del
 * superadministrador (RFC 0014). Necesita Postgres arrancado y migrado.
 */
describe('Tope de roles, onboarding y alcance (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  const stamp = Date.now();
  const password = 'Rebano2026Seguro';

  /** Entra con esa cuenta y devuelve la cookie de sesión. */
  const signIn = async (email: string): Promise<string> => {
    const entrada = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email, password })
      .expect(200);

    const setCookie = entrada.headers['set-cookie'];
    return (Array.isArray(setCookie) ? setCookie : [setCookie]).join('; ');
  };

  /** Registra una cuenta y la eleva por SQL: es la única forma de nacer superadministrador. */
  const registerWithRole = async (email: string, role: string): Promise<string> => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .send({ email, password, name: email })
      .expect(200);

    const isPostgres = dataSource.options.type === 'postgres';
    await dataSource.query(
      `UPDATE "user" SET "role" = ${isPostgres ? '$1' : '?'} WHERE "email" = ${isPostgres ? '$2' : '?'}`,
      [role, email],
    );

    // La sesión se cachea en cookie: hay que volver a entrar para que el rol
    // nuevo viaje en ella (ver `believers.e2e-spec.ts`).
    return signIn(email);
  };

  const as = (cookie: string) => ({
    post: (path: string, payload: object = {}) =>
      request(app.getHttpServer()).post(path).set('Cookie', cookie).send(payload),
    get: (path: string) => request(app.getHttpServer()).get(path).set('Cookie', cookie),
    patch: (path: string, payload: object) =>
      request(app.getHttpServer()).patch(path).set('Cookie', cookie).send(payload),
  });

  let superadminCookie = '';
  let pastorCookie = '';
  let iglesiaA = '';
  let iglesiaB = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    app.use('/api/auth', toNodeHandler(auth));
    app.use(express.json());
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();
    dataSource = app.get(DataSource);

    superadminCookie = await registerWithRole(`admin-${String(stamp)}@navis.test`, 'superadmin');

    const iglesiaCreada = await as(superadminCookie)
      .post('/api/v1/churches', { name: `Iglesia A ${String(stamp)}`, city: 'Elda' })
      .expect(201);
    iglesiaA = body<Church>(iglesiaCreada).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('una cuenta creada con rol pastor no entra en la iglesia de quien la crea', async () => {
    const email = `pastor-${String(stamp)}@navis.test`;

    await as(superadminCookie)
      .post('/api/v1/admin/users', { name: 'Un Pastor', email, password, role: 'pastor' })
      .expect(201);

    pastorCookie = await signIn(email);

    const misIglesias = await as(pastorCookie).get('/api/v1/churches').expect(200);
    expect(body<MyChurches>(misIglesias).items).toEqual([]);

    const creada = await as(pastorCookie)
      .post('/api/v1/churches', { name: `Iglesia B ${String(stamp)}`, city: 'Alicante' })
      .expect(201);
    iglesiaB = body<Church>(creada).id;
  });

  it('un pastor no puede crear una cuenta con rol pastor ni superadmin', async () => {
    await as(pastorCookie)
      .post('/api/v1/admin/users', {
        name: 'Otro Pastor',
        email: `otro-pastor-${String(stamp)}@navis.test`,
        password,
        role: 'pastor',
      })
      .expect(403);

    await as(pastorCookie)
      .post('/api/v1/admin/users', {
        name: 'Aspirante',
        email: `aspirante-${String(stamp)}@navis.test`,
        password,
        role: 'superadmin',
      })
      .expect(403);
  });

  it('un pastor sí puede crear un rol de ministerio, y entra en su iglesia activa', async () => {
    const email = `recepcion-${String(stamp)}@navis.test`;

    await as(pastorCookie)
      .post('/api/v1/admin/users', { name: 'Recepción', email, password, role: 'recepcion' })
      .expect(201);

    const listado = await as(pastorCookie).get('/api/v1/admin/users?limit=50').expect(200);
    const correos = body<Paginated<ManagedUser>>(listado).items.map((user) => user.email);

    expect(correos).toContain(email);
    // El pastor no ve, en su listado acotado, la cuenta del superadministrador.
    expect(correos).not.toContain(`admin-${String(stamp)}@navis.test`);
  });

  it('el superadministrador ve, por defecto, solo lo suyo', async () => {
    const misIglesias = await as(superadminCookie).get('/api/v1/churches').expect(200);
    const ids = body<MyChurches>(misIglesias).items.map((church) => church.id);

    expect(ids).toEqual([iglesiaA]);
    expect(ids).not.toContain(iglesiaB);
  });

  it('al desactivar la preferencia, el superadministrador ve toda la instalación', async () => {
    await as(superadminCookie).patch('/api/v1/me/profile', { restrictOwnScope: false }).expect(200);

    const misIglesias = await as(superadminCookie).get('/api/v1/churches').expect(200);
    const ids = body<MyChurches>(misIglesias).items.map((church) => church.id);

    expect(ids).toContain(iglesiaA);
    expect(ids).toContain(iglesiaB);

    // Se deja como estaba, por si algún otro test corriera después con esta cookie.
    await as(superadminCookie).patch('/api/v1/me/profile', { restrictOwnScope: true }).expect(200);
  });
});
