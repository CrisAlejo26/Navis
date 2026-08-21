import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { Paginated, Teaching, TeachingListItem, TeachingsStats } from '@navis/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';

const body = <T>(response: { body: unknown }): T => response.body as T;

const parrafo = (texto: string) => ({
  type: 'paragraph',
  content: [{ type: 'text', text: texto }],
});

const conChecklist = (checked: number, total: number) => ({
  type: 'doc',
  content: [
    parrafo('Lo que aprendí'),
    {
      type: 'taskList',
      content: Array.from({ length: total }, (_, index) => ({
        type: 'taskItem',
        attrs: { checked: index < checked },
        content: [parrafo('un paso')],
      })),
    },
  ],
});

/**
 * Las enseñanzas de una persona (RFC 0022).
 *
 * Igual que en `prophecies.e2e-spec.ts`, lo que se comprueba aquí y no con
 * dobles es lo que depende del motor: que la búsqueda encuentra sin acentos,
 * que el whitelist del cuerpo se valida de verdad, y sobre todo **que las
 * enseñanzas de otra persona no se ven ni se tocan**, que es la única
 * barrera de acceso de este módulo.
 */
describe('Enseñanzas personales (e2e)', () => {
  let app: NestExpressApplication;
  const sello = String(Date.now());
  const password = 'Rebano2026Seguro';
  let mia = '';
  let deOtro = '';
  let paciencia = '';

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

    mia = await signUp('ensenanzas');
    deOtro = await signUp('ensenanzas-otro');
  });

  afterAll(async () => {
    await app.close();
  });

  it('anota una enseñanza con checklist y la devuelve con su fecha', async () => {
    const response = await login(mia).post('/api/v1/teachings', {
      title: 'Sobre la paciencia',
      body: conChecklist(1, 2),
      receivedAt: '2026-03-14',
    });

    expect(response.status).toBe(201);
    const creada = body<Teaching>(response);
    paciencia = creada.id;
    expect(creada.receivedAt).toBe('2026-03-14');
    expect(creada.body.type).toBe('doc');
  });

  it('rechaza un cuerpo con un tipo de nodo fuera del whitelist', async () => {
    const response = await login(mia).post('/api/v1/teachings', {
      title: 'Inválida',
      body: { type: 'doc', content: [{ type: 'heading' }] },
      receivedAt: '2026-03-14',
    });

    expect(response.status).toBe(400);
  });

  it('«vision» encuentra «Visión», sin acentos y en los dos motores', async () => {
    await login(mia).post('/api/v1/teachings', {
      title: 'Visión del camino',
      body: conChecklist(0, 1),
      receivedAt: '2026-04-02',
    });

    const response = await login(mia).get('/api/v1/teachings?search=vision');

    expect(response.status).toBe(200);
    const page = body<Paginated<TeachingListItem>>(response);
    expect(page.items.map((one) => one.title)).toContain('Visión del camino');
  });

  it('la fila del listado trae la cuenta de la checklist', async () => {
    const page = body<Paginated<TeachingListItem>>(await login(mia).get('/api/v1/teachings'));
    const fila = page.items.find((one) => one.id === paciencia);

    expect(fila?.checklist).toEqual({ checked: 1, total: 2 });
  });

  it('las cuentas de la portada traen los doce meses y la tasa de checklist', async () => {
    const response = await login(mia).get('/api/v1/teachings/stats');

    expect(response.status).toBe(200);
    const stats = body<TeachingsStats>(response);
    expect(stats.monthly).toHaveLength(12);
    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(stats.checklistTotal).toBeGreaterThanOrEqual(2);
  });

  it('quien no tiene ninguna enseñanza ve la tasa a nula y no a cero', async () => {
    const stats = body<TeachingsStats>(await login(deOtro).get('/api/v1/teachings/stats'));

    expect(stats.total).toBe(0);
    expect(stats.checklistRate).toBeNull();
  });

  describe('la barrera del dueño', () => {
    it('otro usuario no ve ninguna de mis enseñanzas en su listado', async () => {
      const page = body<Paginated<TeachingListItem>>(await login(deOtro).get('/api/v1/teachings'));

      expect(page.total).toBe(0);
    });

    it('pedir la mía por identificador le da 404, y no 403', async () => {
      const response = await login(deOtro).get(`/api/v1/teachings/${paciencia}`);

      expect(response.status).toBe(404);
    });

    it('tampoco la puede editar ni borrar', async () => {
      const editar = await login(deOtro).patch(`/api/v1/teachings/${paciencia}`, { title: 'Mía' });
      const borrar = await login(deOtro).delete(`/api/v1/teachings/${paciencia}`);

      expect([editar.status, borrar.status]).toEqual([404, 404]);
    });

    it('sin sesión no se entra siquiera', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/teachings');

      expect(response.status).toBe(401);
    });
  });

  it('borrar una enseñanza la saca del listado', async () => {
    const response = await login(mia).delete(`/api/v1/teachings/${paciencia}`);
    expect(response.status).toBe(200);

    const page = body<Paginated<TeachingListItem>>(await login(mia).get('/api/v1/teachings'));
    expect(page.items.map((one) => one.id)).not.toContain(paciencia);
  });
});
