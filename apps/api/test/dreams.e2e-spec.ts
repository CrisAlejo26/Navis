import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  Dream,
  DreamListItem,
  DreamsStats,
  Emotion,
  EmotionWithCount,
  Paginated,
} from '@navis/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';

const body = <T>(response: { body: unknown }): T => response.body as T;

/**
 * El cuaderno de sueños de una persona (RFC 0005).
 *
 * Lo que se comprueba aquí y no con dobles es lo que depende del motor: que la
 * búsqueda encuentra sin acentos, que el filtro por estado y por emoción se
 * resuelve en SQL, que el índice parcial de emociones deja convivir las de
 * serie con las propias — y, sobre todo, **que los sueños de otra persona no se
 * ven ni se tocan** (D1), que es la única barrera de acceso de este módulo.
 */
describe('Sueños personales (e2e)', () => {
  let app: NestExpressApplication;
  const sello = String(Date.now());
  const password = 'Rebano2026Seguro';
  let mia = '';
  let deOtro = '';
  let puerta = '';
  let paz = '';
  let nostalgia = '';

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

    mia = await signUp('suenos');
    deOtro = await signUp('suenos-otro');
  });

  afterAll(async () => {
    await app.close();
  });

  it('el vocabulario trae las doce de serie, sin nombre y con su color', async () => {
    const response = await login(mia).get('/api/v1/dreams/emotions');
    expect(response.status).toBe(200);

    const emociones = body<EmotionWithCount[]>(response);
    const deSerie = emociones.filter((one) => one.slug !== null);

    expect(deSerie).toHaveLength(12);
    // Sin texto guardado: lo pone la interfaz a partir del slug (D4).
    expect(deSerie.every((one) => one.name === null)).toBe(true);
    expect(deSerie.every((one) => one.accent.startsWith('#'))).toBe(true);
    expect(deSerie.map((one) => one.slug)).toContain('persecucion');

    paz = deSerie.find((one) => one.slug === 'paz')?.id ?? '';
    expect(paz).not.toBe('');
  });

  it('apunta un sueño solo con el cuerpo y la noche (D17)', async () => {
    const response = await login(mia).post('/api/v1/dreams', {
      body: 'Había una puerta abierta y una luz al fondo.',
      dreamedAt: '2026-03-14',
    });

    expect(response.status).toBe(201);
    const sueño = body<Dream>(response);

    expect(sueño.title).toBeNull();
    expect(sueño.dreamedAt).toBe('2026-03-14');
    expect(sueño.interpretation).toBeNull();
    expect(sueño.fulfilledAt).toBeNull();
    expect(sueño.emotions).toEqual([]);

    puerta = sueño.id;
  });

  it('rechaza un sueño sin cuerpo', async () => {
    const response = await login(mia).post('/api/v1/dreams', { dreamedAt: '2026-03-14' });
    expect(response.status).toBe(400);
  });

  it('le pega emociones y las devuelve en la ficha', async () => {
    const response = await login(mia).patch(`/api/v1/dreams/${puerta}`, {
      title: 'La puerta',
      emotionIds: [paz],
    });

    expect(response.status).toBe(200);
    expect(body<Dream>(response).emotions.map((one) => one.slug)).toEqual(['paz']);
  });

  it('crea una emoción propia, la renombra y no deja tocar las de serie (D6)', async () => {
    const creada = await login(mia).post('/api/v1/dreams/emotions', {
      name: 'Nostalgia',
      accent: '#9333ea',
    });
    expect(creada.status).toBe(201);
    nostalgia = body<Emotion>(creada).id;

    const renombrada = await login(mia).patch(`/api/v1/dreams/emotions/${nostalgia}`, {
      name: 'Añoranza',
    });
    expect(renombrada.status).toBe(200);
    expect(body<Emotion>(renombrada).name).toBe('Añoranza');

    // Una de serie se ve, pero no se cambia ni se borra.
    expect(
      (await login(mia).patch(`/api/v1/dreams/emotions/${paz}`, { name: 'Calma' })).status,
    ).toBe(403);
    expect((await login(mia).delete(`/api/v1/dreams/emotions/${paz}`)).status).toBe(403);
  });

  it('la emoción propia de otro no se puede usar ni tocar', async () => {
    expect(
      (
        await login(deOtro).patch(`/api/v1/dreams/emotions/${nostalgia}`, {
          name: 'Mía',
        })
      ).status,
    ).toBe(404);

    // Si se cuela en un sueño ajeno, se descarta en vez de tumbar la petición.
    const suyo = await login(deOtro).post('/api/v1/dreams', {
      body: 'Un sueño de otra persona',
      dreamedAt: '2026-03-15',
      emotionIds: [nostalgia],
    });

    expect(suyo.status).toBe(201);
    expect(body<Dream>(suyo).emotions).toEqual([]);
  });

  it('busca sin acentos y filtra por emoción', async () => {
    await login(mia).post('/api/v1/dreams', {
      body: 'Volaba sobre una montaña con niebla',
      dreamedAt: '2026-04-02',
    });

    const buscado = await login(mia).get('/api/v1/dreams?search=montana');
    expect(body<Paginated<DreamListItem>>(buscado).total).toBe(1);

    const porEmocion = await login(mia).get(`/api/v1/dreams?emotion=${paz}`);
    const items = body<Paginated<DreamListItem>>(porEmocion).items;
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(puerta);
    expect(items[0]?.emotions.map((one) => one.slug)).toEqual(['paz']);
  });

  it('el estado se deriva y se puede filtrar por él (D8)', async () => {
    // Los dos que lleva apuntados: ninguno tiene interpretación todavía.
    const apuntados = await login(mia).get('/api/v1/dreams?state=apuntado');
    expect(body<Paginated<DreamListItem>>(apuntados).total).toBe(2);

    await login(mia).patch(`/api/v1/dreams/${puerta}`, { interpretation: 'Habla de esperar' });

    const enEstudio = await login(mia).get('/api/v1/dreams?state=estudio');
    const items = body<Paginated<DreamListItem>>(enEstudio).items;
    expect(items.map((one) => one.id)).toEqual([puerta]);
    expect(items[0]?.state).toBe('estudio');
    expect(items[0]?.hasInterpretation).toBe(true);
  });

  it('cumplirlo pide fecha y significado, y reabrirlo se lo lleva (D10)', async () => {
    const cumplido = await login(mia).patch(`/api/v1/dreams/${puerta}`, {
      fulfilledAt: '2026-06-20',
      fulfillmentMeaning: 'Se abrió la puerta de verdad',
    });

    expect(body<Dream>(cumplido).fulfilledAt).toBe('2026-06-20');
    expect(body<Dream>(cumplido).fulfillmentMeaning).toBe('Se abrió la puerta de verdad');

    const reabierto = await login(mia).patch(`/api/v1/dreams/${puerta}`, { fulfilledAt: null });
    expect(body<Dream>(reabierto).fulfilledAt).toBeNull();
    expect(body<Dream>(reabierto).fulfillmentMeaning).toBeNull();
  });

  it('no acepta una fecha de cumplimiento anterior a la noche (D12)', async () => {
    const response = await login(mia).patch(`/api/v1/dreams/${puerta}`, {
      fulfilledAt: '2026-01-01',
    });

    expect(response.status).toBe(400);
  });

  it('las cuentas de la portada salen de todos los sueños, no de una página', async () => {
    const response = await login(mia).get('/api/v1/dreams/stats');
    expect(response.status).toBe(200);

    const stats = body<DreamsStats>(response);
    expect(stats.total).toBe(2);
    expect(stats.nights).toHaveLength(84);
    expect(stats.weeks).toHaveLength(12);
    expect(stats.byWeekday).toHaveLength(7);
    expect(stats.monthly).toHaveLength(12);
    // El mapa de emociones solo trae las que se han usado, con su color.
    expect(stats.byEmotion.map((one) => one.slug)).toEqual(['paz']);
    expect(stats.byEmotion[0]?.count).toBe(1);
  });

  /* La prueba que hay que copiar si algún día se añade un endpoint aquí. */
  it('el sueño de otra persona no existe para quien pregunta (D1)', async () => {
    expect((await login(deOtro).get(`/api/v1/dreams/${puerta}`)).status).toBe(404);
    expect((await login(deOtro).patch(`/api/v1/dreams/${puerta}`, { title: 'Mío' })).status).toBe(
      404,
    );
    expect((await login(deOtro).delete(`/api/v1/dreams/${puerta}`)).status).toBe(404);

    // Y no aparece en su listado ni en sus cuentas.
    const suyos = await login(deOtro).get('/api/v1/dreams');
    expect(body<Paginated<DreamListItem>>(suyos).items.map((one) => one.id)).not.toContain(puerta);
    expect(body<DreamsStats>(await login(deOtro).get('/api/v1/dreams/stats')).total).toBe(1);
  });

  it('sin sesión no se llega a nada', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/dreams')).status).toBe(401);
    expect((await request(app.getHttpServer()).get('/api/v1/dreams/stats')).status).toBe(401);
    expect((await request(app.getHttpServer()).get('/api/v1/dreams/emotions')).status).toBe(401);
  });

  it('borrar una emoción propia no borra los sueños que la llevaban', async () => {
    await login(mia).patch(`/api/v1/dreams/${puerta}`, { emotionIds: [paz, nostalgia] });
    expect((await login(mia).delete(`/api/v1/dreams/emotions/${nostalgia}`)).status).toBe(200);

    const ficha = await login(mia).get(`/api/v1/dreams/${puerta}`);
    expect(ficha.status).toBe(200);
    expect(body<Dream>(ficha).emotions.map((one) => one.slug)).toEqual(['paz']);
  });

  it('borra el sueño y deja de listarse', async () => {
    expect((await login(mia).delete(`/api/v1/dreams/${puerta}`)).status).toBe(200);

    const response = await login(mia).get('/api/v1/dreams');
    expect(body<Paginated<DreamListItem>>(response).items.map((one) => one.id)).not.toContain(
      puerta,
    );
  });
});
