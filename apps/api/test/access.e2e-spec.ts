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
    put: (path: string, payload: object) =>
      request(app.getHttpServer()).put(path).set('Cookie', cookie).send(payload),
    delete: (path: string, payload: object = {}) =>
      request(app.getHttpServer()).delete(path).set('Cookie', cookie).send(payload),
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

  // RFC 0015: dar de baja a quien dirige una iglesia exige antes decidir qué
  // pasa con cada una — de punta a punta contra Postgres, porque es la única
  // forma de probar el choque real de los únicos por iglesia y que la
  // transacción no deja medio traslado hecho.
  describe('baja de una cuenta dueña de iglesias', () => {
    const email = `dueno-${String(stamp)}@navis.test`;
    let duenoId = '';
    let iglesiaC = '';
    let iglesiaD = '';

    beforeAll(async () => {
      // El dueño no comparte ninguna iglesia con el superadministrador
      // —autoprovisiona la suya y no entra en la de quien lo crea (RFC 0014
      // D4)—, así que restringido a "lo suyo" ni lo encontraría en el listado
      // ni pasaría el `sharesChurchWith` de `target()`. Se amplía el alcance
      // para este bloque y se deja como estaba al terminar.
      await as(superadminCookie)
        .patch('/api/v1/me/profile', { restrictOwnScope: false })
        .expect(200);

      await as(superadminCookie)
        .post('/api/v1/admin/users', { name: 'Dueño', email, password, role: 'pastor' })
        .expect(201);
      const duenoCookie = await signIn(email);

      const listado = await as(superadminCookie)
        .get(`/api/v1/admin/users?search=${email}`)
        .expect(200);
      duenoId = body<Paginated<ManagedUser>>(listado).items[0]?.id ?? '';

      const creadaC = await as(duenoCookie)
        .post('/api/v1/churches', { name: `Iglesia C ${String(stamp)}`, city: 'Elda' })
        .expect(201);
      iglesiaC = body<Church>(creadaC).id;

      const creadaD = await as(duenoCookie)
        .post('/api/v1/churches', { name: `Iglesia D ${String(stamp)}`, city: 'Alicante' })
        .expect(201);
      iglesiaD = body<Church>(creadaD).id;

      // Iglesia C activa: la creación deja activa la última, así que hay que
      // volver a marcarla para poder crear un creyente dentro de ella.
      await as(duenoCookie).put('/api/v1/churches/active', { churchId: iglesiaC }).expect(200);
      await as(duenoCookie).post('/api/v1/believers', { firstName: 'Juan' }).expect(201);
    });

    afterAll(async () => {
      await as(superadminCookie)
        .patch('/api/v1/me/profile', { restrictOwnScope: true })
        .expect(200);
    });

    it('sin decisiones, responde 409 con el impacto de las dos iglesias', async () => {
      const respuesta = await as(superadminCookie)
        .delete(`/api/v1/admin/users/${duenoId}`)
        .expect(409);

      const churches = (respuesta.body as { data: { ownedChurches: { id: string }[] } }).data
        .ownedChurches;
      expect(churches.map((church) => church.id).sort()).toEqual([iglesiaC, iglesiaD].sort());
    });

    it('con decisiones, traslada una iglesia y elimina la otra, y borra la cuenta', async () => {
      await as(superadminCookie)
        .delete(`/api/v1/admin/users/${duenoId}`, {
          churchDecisions: [
            { churchId: iglesiaC, action: 'transfer', targetChurchId: iglesiaA },
            { churchId: iglesiaD, action: 'delete' },
          ],
        })
        .expect(204);

      // El creyente de la iglesia C ahora está en la iglesia A.
      const [creyente] = await dataSource.query<{ church_id: string }[]>(
        `SELECT church_id FROM believers WHERE first_name = 'Juan' ORDER BY created_at DESC LIMIT 1`,
      );
      expect(creyente?.church_id).toBe(iglesiaA);

      // La iglesia D quedó en borrado lógico.
      const [iglesia] = await dataSource.query<{ deleted_at: string | null }[]>(
        `SELECT deleted_at FROM churches WHERE id = ${dataSource.options.type === 'postgres' ? '$1' : '?'}`,
        [iglesiaD],
      );
      expect(iglesia?.deleted_at).not.toBeNull();

      // La cuenta ya no existe.
      await as(superadminCookie).get(`/api/v1/admin/users?search=${email}`).expect(200);
      const listado = await as(superadminCookie)
        .get(`/api/v1/admin/users?search=${email}`)
        .expect(200);
      expect(body<Paginated<ManagedUser>>(listado).items).toEqual([]);
    });
  });
});
