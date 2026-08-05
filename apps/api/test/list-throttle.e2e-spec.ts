import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { Believer, ListCredential, ListShareState, ListSummary } from '@navis/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';
import { LIST_TRIES, resetListThrottle } from '../src/lists/list-throttle';

const body = <T>(response: { body: unknown }): T => response.body as T;

/**
 * **El freno de la puerta** (RFC 0010 D27, D32).
 *
 * Va en su propio fichero porque agota a propósito el cubo de intentos de una
 * lista, y eso estropearía cualquier otra prueba que compartiera proceso.
 *
 * Lo que aquí se comprueba y no se puede comprobar con dobles: que el freno
 * cuelga de la IP **de verdad** —la del socket, con `TRUST_PROXY` apagado— y que
 * un `X-Forwarded-For` inventado no lo esquiva.
 */
describe('El freno de la puerta (e2e)', () => {
  let app: NestExpressApplication;
  const sello = String(Date.now());
  const email = `freno-${sello}@navis.test`;
  const password = 'Rebano2026Seguro';
  let cookie = '';
  let token = '';
  let lista = '';
  const clave = 'k7fr-m3np-t9wx';

  const anon = () => request(app.getHttpServer());
  const post = (path: string, payload?: object) =>
    request(app.getHttpServer())
      .post(path)
      .set('Cookie', cookie)
      .send(payload ?? {});
  const put = (path: string, payload: object) =>
    request(app.getHttpServer()).put(path).set('Cookie', cookie).send(payload);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    app.use('/api/auth', toNodeHandler(auth));
    app.use(express.json());
    app.setGlobalPrefix('api', { exclude: ['health', 'l/:token'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();
    resetListThrottle();

    await anon()
      .post('/api/auth/sign-up/email')
      .send({ email, password, name: 'Pastor' })
      .expect(200);

    const dataSource = app.get(DataSource);
    const marca = dataSource.options.type === 'postgres' ? '$1' : '?';
    await dataSource.query(`UPDATE "user" SET "role" = 'superadmin' WHERE "email" = ${marca}`, [
      email,
    ]);

    const entrada = await anon()
      .post('/api/auth/sign-in/email')
      .send({ email, password })
      .expect(200);
    const raw = entrada.headers['set-cookie'];
    cookie = (Array.isArray(raw) ? raw : [raw]).join('; ');

    await post('/api/v1/churches', { name: `Iglesia Freno ${sello}`, city: 'Elda' }).expect(201);

    const listas = body<ListSummary[]>(
      await request(app.getHttpServer()).get('/api/v1/lists').set('Cookie', cookie).expect(200),
    );
    lista = listas[0]?.id ?? '';

    const persona = body<Believer>(
      await post('/api/v1/believers', { firstName: 'Juan', lastName: 'Pérez' }).expect(201),
    );
    await post(`/api/v1/lists/${lista}/members`, { believerIds: [persona.id] }).expect(201);

    const acceso = body<ListCredential>(
      await post('/api/v1/list-viewers', {
        label: 'Juan Pérez',
        username: 'juan.perez',
        password: clave,
        believerId: persona.id,
      }).expect(201),
    );

    await put(`/api/v1/list-viewers/${acceso.viewer.id}/lists`, { ids: [lista] }).expect(200);

    token =
      body<ListShareState>(
        await post(`/api/v1/lists/${lista}/share`, { visibility: 'restricted' }).expect(201),
      ).shareToken ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  it('al undécimo intento desde el mismo origen contesta 429 y dice cuánto falta', async () => {
    const intentar = (extra?: string) => {
      const peticion = anon()
        .post(`/api/v1/public/lists/${token}/access`)
        .send({ username: 'juan.perez', password: 'zzzz-zzzz-zzzz' });

      // Un `X-Forwarded-For` inventado **no** cambia el freno: con `TRUST_PROXY`
      // apagado, `request.ip` es la del socket y la cabecera se ignora (D32).
      return extra ? peticion.set('X-Forwarded-For', extra) : peticion;
    };

    for (let vez = 0; vez < LIST_TRIES; vez += 1) {
      const respuesta = await intentar(vez % 2 === 0 ? `203.0.113.${String(vez)}` : undefined);
      expect(respuesta.status).toBe(401);
    }

    const cortado = await intentar('198.51.100.7');
    expect(cortado.status).toBe(429);
    expect(body<{ message: string }>(cortado).message).toContain('demasiadas veces');
  });

  it('el intento cortado también se apunta en el registro, con su prefijo y sin contraseña', async () => {
    const dataSource = app.get(DataSource);
    const marca = dataSource.options.type === 'postgres' ? '$1' : '?';
    const filas: unknown = await dataSource.query(
      `SELECT "outcome", "ip_prefix", "username" FROM "list_access_log" WHERE "list_id" = ${marca}`,
      [lista],
    );

    const intentos = filas as { outcome: string; ip_prefix: string; username: string }[];

    expect(intentos.some((one) => one.outcome === 'throttled')).toBe(true);
    expect(intentos.every((one) => one.username === 'juan.perez')).toBe(true);
    expect(JSON.stringify(intentos)).not.toContain('zzzz');
    for (const intento of intentos) {
      expect(intento.ip_prefix === '' || /(\.0|::)$/.test(intento.ip_prefix)).toBe(true);
    }
  });

  it('la buena tampoco entra mientras dura el freno: se frena el origen, no la cuenta', async () => {
    const conLaBuena = await anon()
      .post(`/api/v1/public/lists/${token}/access`)
      .send({ username: 'juan.perez', password: clave });

    expect(conLaBuena.status).toBe(429);

    // Y en cuanto se olvida el cubo, la misma contraseña entra: el acceso nunca
    // llegó a desactivarse (D27).
    resetListThrottle();

    await anon()
      .post(`/api/v1/public/lists/${token}/access`)
      .send({ username: 'juan.perez', password: clave })
      .expect(200);
  });
});
