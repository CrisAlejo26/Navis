import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  Paginated,
  PropheciesStats,
  Prophecy,
  ProphecyFulfillment,
  ProphecyListItem,
} from '@navis/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';

const body = <T>(response: { body: unknown }): T => response.body as T;

/**
 * El cuaderno de una persona: apunta palabras, anota lo que se va cumpliendo y
 * mira qué ha pasado con ellas (RFC 0004).
 *
 * Lo que se comprueba aquí y no con dobles es justo lo que depende del motor:
 * que la búsqueda encuentra sin acentos en los dos, que el filtro por estado se
 * resuelve en SQL, que el orden es estable — y, sobre todo, **que las
 * profecías de otra persona no se ven ni se tocan** (D1), que es la única
 * barrera de acceso que tiene este módulo.
 */
describe('Profecías personales (e2e)', () => {
  let app: NestExpressApplication;
  const sello = String(Date.now());
  const password = 'Rebano2026Seguro';
  let mia = '';
  let deOtro = '';
  let casa = '';

  const login = (cookie: string) => ({
    get: (path: string) => request(app.getHttpServer()).get(path).set('Cookie', cookie),
    post: (path: string, payload: object) =>
      request(app.getHttpServer()).post(path).set('Cookie', cookie).send(payload),
    patch: (path: string, payload: object) =>
      request(app.getHttpServer()).patch(path).set('Cookie', cookie).send(payload),
    delete: (path: string) => request(app.getHttpServer()).delete(path).set('Cookie', cookie),
  });

  async function signUp(name: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .send({ email: `${name}-${sello}@navis.test`, password, name });

    // `headers` está tipado como `any` en supertest: se acota aquí, una vez, y
    // del resto del fichero sale ya tipado (Regla 10 §6).
    const raw: unknown = response.headers['set-cookie'];
    const cookies = Array.isArray(raw) ? raw : [raw];

    return cookies
      .filter((one): one is string => typeof one === 'string')
      .map((one) => one.split(';')[0])
      .join('; ');
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

    mia = await signUp('profecias');
    deOtro = await signUp('profecias-otro');
  });

  afterAll(async () => {
    await app.close();
  });

  it('apunta una palabra y la devuelve con su fecha', async () => {
    const response = await login(mia).post('/api/v1/prophecies', {
      title: 'La casa junto al río',
      body: 'Vi una casa con el agua cerca y mucha gente entrando y saliendo.',
      receivedAt: '2026-03-14',
    });

    expect(response.status).toBe(201);
    const creada = body<Prophecy>(response);
    casa = creada.id;
    expect(creada.receivedAt).toBe('2026-03-14');
    expect(creada.fulfilledAt).toBeNull();
    expect(creada.fulfillments).toEqual([]);
  });

  it('no acepta que se haya cumplido antes de recibirse', async () => {
    const response = await login(mia).post('/api/v1/prophecies', {
      title: 'Imposible',
      body: 'Texto',
      receivedAt: '2026-03-14',
      fulfilledAt: '2026-01-01',
    });

    expect(response.status).toBe(400);
  });

  it('«vision» encuentra «Visión», sin acentos y en los dos motores', async () => {
    await login(mia).post('/api/v1/prophecies', {
      title: 'Visión del camino',
      body: 'Había una senda estrecha',
      receivedAt: '2026-04-02',
    });

    const response = await login(mia).get('/api/v1/prophecies?search=vision');

    expect(response.status).toBe(200);
    const page = body<Paginated<ProphecyListItem>>(response);
    expect(page.items.map((one) => one.title)).toContain('Visión del camino');
  });

  it('empieza en espera y pasa a «en camino» al anotar un cumplimiento', async () => {
    const antes = await login(mia).get(`/api/v1/prophecies?state=espera`);
    expect(body<Paginated<ProphecyListItem>>(antes).items.map((one) => one.id)).toContain(casa);

    const anotado = await login(mia).post(`/api/v1/prophecies/${casa}/fulfillments`, {
      text: 'Ya encontramos el terreno',
      occurredAt: '2026-05-02',
    });
    expect(anotado.status).toBe(201);
    expect(body<ProphecyFulfillment>(anotado).occurredAt).toBe('2026-05-02');

    const enCamino = await login(mia).get('/api/v1/prophecies?state=camino');
    const fila = body<Paginated<ProphecyListItem>>(enCamino).items.find((one) => one.id === casa);
    expect(fila?.state).toBe('camino');
    expect(fila?.lastFulfillmentAt).toBe('2026-05-02');
    expect(fila?.fulfillmentsCount).toBe(1);
  });

  it('no deja anotar un cumplimiento anterior a la fecha en que se recibió', async () => {
    const response = await login(mia).post(`/api/v1/prophecies/${casa}/fulfillments`, {
      text: 'Antes de tiempo',
      occurredAt: '2026-01-01',
    });

    expect(response.status).toBe(400);
  });

  it('al cerrarla queda cumplida, y los cumplimientos parciales siguen ahí', async () => {
    const response = await login(mia).patch(`/api/v1/prophecies/${casa}`, {
      fulfilledAt: '2026-06-20',
    });

    expect(response.status).toBe(200);
    const cerrada = body<Prophecy>(response);
    expect(cerrada.fulfilledAt).toBe('2026-06-20');
    expect(cerrada.lastFulfillmentAt).toBe('2026-05-02');

    const ficha = body<Prophecy>(await login(mia).get(`/api/v1/prophecies/${casa}`));
    expect(ficha.fulfillments).toHaveLength(1);
  });

  it('reabrirla la devuelve a «en camino» sin perder nada', async () => {
    await login(mia).patch(`/api/v1/prophecies/${casa}`, { fulfilledAt: null });

    const ficha = body<Prophecy>(await login(mia).get(`/api/v1/prophecies/${casa}`));
    expect(ficha.fulfilledAt).toBeNull();
    expect(ficha.fulfillments).toHaveLength(1);
  });

  it('las cuentas de la portada traen los doce meses, con los vacíos a cero', async () => {
    const response = await login(mia).get('/api/v1/prophecies/stats');

    expect(response.status).toBe(200);
    const stats = body<PropheciesStats>(response);
    expect(stats.monthly).toHaveLength(12);
    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(stats.byState.camino).toBeGreaterThanOrEqual(1);
  });

  it('quien no tiene ninguna profecía ve la tasa a nulo y no a cero', async () => {
    const stats = body<PropheciesStats>(await login(deOtro).get('/api/v1/prophecies/stats'));

    expect(stats.total).toBe(0);
    expect(stats.fulfillmentRate).toBeNull();
    expect(stats.medianWaitingDays).toBeNull();
  });

  describe('la barrera del dueño (D1)', () => {
    it('otro usuario no ve ninguna de mis profecías en su listado', async () => {
      const page = body<Paginated<ProphecyListItem>>(await login(deOtro).get('/api/v1/prophecies'));

      expect(page.total).toBe(0);
      expect(page.items).toEqual([]);
    });

    it('pedir la mía por identificador le da 404, y no 403', async () => {
      // Un 403 confirmaría que existe: quien acierta el identificador de otro
      // no tiene por qué enterarse de que acertó.
      const response = await login(deOtro).get(`/api/v1/prophecies/${casa}`);

      expect(response.status).toBe(404);
    });

    it('tampoco la puede editar, borrar, ni anotar nada en ella', async () => {
      const editar = await login(deOtro).patch(`/api/v1/prophecies/${casa}`, { title: 'Mía' });
      const anotar = await login(deOtro).post(`/api/v1/prophecies/${casa}/fulfillments`, {
        text: 'No debería',
        occurredAt: '2026-05-02',
      });
      const borrar = await login(deOtro).delete(`/api/v1/prophecies/${casa}`);

      expect([editar.status, anotar.status, borrar.status]).toEqual([404, 404, 404]);
    });

    it('y la mía sigue intacta después de todos esos intentos', async () => {
      const ficha = body<Prophecy>(await login(mia).get(`/api/v1/prophecies/${casa}`));

      expect(ficha.title).toBe('La casa junto al río');
      expect(ficha.fulfillments).toHaveLength(1);
    });

    it('sin sesión no se entra siquiera', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/prophecies');

      expect(response.status).toBe(401);
    });
  });

  it('el orden por fecha de recepción es estable entre páginas', async () => {
    const primera = body<Paginated<ProphecyListItem>>(
      await login(mia).get('/api/v1/prophecies?sort=received&order=desc&limit=1&page=1'),
    );
    const segunda = body<Paginated<ProphecyListItem>>(
      await login(mia).get('/api/v1/prophecies?sort=received&order=desc&limit=1&page=2'),
    );

    expect(primera.items).toHaveLength(1);
    expect(segunda.items).toHaveLength(1);
    expect(primera.items[0].id).not.toBe(segunda.items[0].id);
  });

  it('borrar una profecía la saca del listado', async () => {
    const response = await login(mia).delete(`/api/v1/prophecies/${casa}`);
    expect(response.status).toBe(200);

    const page = body<Paginated<ProphecyListItem>>(await login(mia).get('/api/v1/prophecies'));
    expect(page.items.map((one) => one.id)).not.toContain(casa);
  });
});
