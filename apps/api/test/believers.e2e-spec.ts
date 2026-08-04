import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type {
  BelieverListItem,
  BelieverNote,
  BelieversSummary,
  Gift,
  NoteAudio,
  NoteCounts,
  NoteDay,
  Paginated,
} from '@navis/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';

const body = <T>(response: { body: unknown }): T => response.body as T;

/**
 * El recorrido de quien acompaña: da de alta a tres hermanos, los busca sin
 * acentos, ve quién lleva más tiempo sin nota y escribe la primera.
 *
 * Lo que se comprueba aquí y no con dobles es justo lo que depende del motor:
 * que «jesus» encuentra «Jesús» en los dos, que quien no tiene ninguna nota
 * sale primero al ordenar por última nota, y que escribir una vacía la sonda
 * (RFC 0003).
 */
describe('Creyentes y notas (e2e)', () => {
  let app: NestExpressApplication;
  const email = `creyentes-${String(Date.now())}@navis.test`;
  const password = 'Rebano2026Seguro';
  let cookie = '';
  let jesus = '';
  let sanidad = '';

  const post = (path: string, payload: object) =>
    request(app.getHttpServer()).post(path).set('Cookie', cookie).send(payload);
  const get = (path: string) => request(app.getHttpServer()).get(path).set('Cookie', cookie);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    app.use('/api/auth', toNodeHandler(auth));
    app.use(express.json());
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();

    await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .send({ email, password, name: 'Quien acompaña' })
      .expect(200);

    // Quien se registra nace `creyente`; se le sube el rol y se vuelve a entrar,
    // porque la sesión se cachea en cookie (ver `calendar.e2e-spec.ts`).
    const dataSource = app.get(DataSource);
    const marca = dataSource.options.type === 'postgres' ? '$1' : '?';
    await dataSource.query(`UPDATE "user" SET "role" = 'superadmin' WHERE "email" = ${marca}`, [
      email,
    ]);

    const entrada = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email, password })
      .expect(200);

    const setCookie = entrada.headers['set-cookie'];
    cookie = (Array.isArray(setCookie) ? setCookie : [setCookie]).join('; ');

    await post('/api/v1/churches', {
      name: `Iglesia ${String(Date.now())}`,
      city: 'Elda',
    }).expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('cada iglesia nace con los siete dones de serie, que no se borran', async () => {
    const respuesta = await get('/api/v1/gifts').expect(200);
    const dones = body<Gift[]>(respuesta);

    expect(dones).toHaveLength(7);
    expect(dones.every((one) => one.isSystem)).toBe(true);

    sanidad = dones.find((one) => one.name === 'Sanidad')?.id ?? '';
    expect(sanidad).not.toBe('');

    await request(app.getHttpServer())
      .delete(`/api/v1/gifts/${sanidad}`)
      .set('Cookie', cookie)
      .expect(400);

    // Uno propio de la iglesia sí se borra.
    const propio = await post('/api/v1/gifts', { name: 'Interpretación de lenguas' }).expect(201);
    await request(app.getHttpServer())
      .delete(`/api/v1/gifts/${body<Gift>(propio).id}`)
      .set('Cookie', cookie)
      .expect(200);
  });

  it('da de alta a tres hermanos con su estado y su margen', async () => {
    const uno = await post('/api/v1/believers', {
      firstName: 'Jesús',
      lastName: 'Peña',
      status: 'nuevo',
      alertAfterDays: 20,
    }).expect(201);

    jesus = body<BelieverListItem>(uno).id;
    expect(body<BelieverListItem>(uno).status).toBe('nuevo');
    expect(body<BelieverListItem>(uno).lastNoteAt).toBeNull();

    await post('/api/v1/believers', { firstName: 'Andrés', lastName: 'Molina' }).expect(201);
    await post('/api/v1/believers', {
      firstName: 'María',
      lastName: 'Fernández',
      alertAfterDays: null,
    }).expect(201);
  });

  it('«jesus» encuentra «Jesús», sin acentos y sin mayúsculas', async () => {
    const respuesta = await get('/api/v1/believers?search=jesus').expect(200);
    const pagina = body<Paginated<BelieverListItem>>(respuesta);

    expect(pagina.total).toBe(1);
    expect(pagina.items[0]?.id).toBe(jesus);
  });

  it('quien no tiene ninguna nota va primero al ordenar por última nota', async () => {
    await post(`/api/v1/believers/${jesus}/notes`, {
      kind: 'seguimiento',
      occurredAt: '2026-08-01',
      told: 'Me contó que le va bien en el trabajo nuevo',
      advice: 'Que venga al grupo de los jueves',
    }).expect(201);

    const respuesta = await get('/api/v1/believers?sort=lastNote&order=asc').expect(200);
    const items = body<Paginated<BelieverListItem>>(respuesta).items;

    // Los tres son de esta iglesia; los dos sin nota, delante.
    expect(items.at(-1)?.id).toBe(jesus);
    expect(items.slice(0, -1).every((one) => one.lastNoteAt === null)).toBe(true);
  });

  it('escribir una nota vacía la sonda de esa persona', async () => {
    const respuesta = await get(`/api/v1/believers/${jesus}`).expect(200);
    const ficha = body<BelieverListItem>(respuesta);

    expect(ficha.lastNoteAt).toBe('2026-08-01');
    expect(ficha.notesCount).toBe(1);
    expect(ficha.needsAttention).toBe(false);
  });

  it('una nota de tipo don se lo añade a la ficha, y borrarla no se lo quita', async () => {
    const creada = await post(`/api/v1/believers/${jesus}/notes`, {
      kind: 'don',
      occurredAt: '2026-08-02',
      told: 'Pidió oración por su espalda',
      advice: 'Oramos por él y quedó bien',
      giftId: sanidad,
    }).expect(201);

    const nota = body<BelieverNote>(creada);
    expect(nota.giftName).toBe('Sanidad');

    const conDon = await get(`/api/v1/believers/${jesus}`).expect(200);
    expect(body<BelieverListItem>(conDon).gifts.map((one) => one.id)).toEqual([sanidad]);

    await request(app.getHttpServer())
      .delete(`/api/v1/believers/${jesus}/notes/${nota.id}`)
      .set('Cookie', cookie)
      .expect(200);

    const despues = await get(`/api/v1/believers/${jesus}`).expect(200);
    expect(body<BelieverListItem>(despues).gifts.map((one) => one.id)).toEqual([sanidad]);
    // Y el margen vuelve a contar desde la nota que queda.
    expect(body<BelieverListItem>(despues).lastNoteAt).toBe('2026-08-01');
  });

  it('una nota de tipo don sin don elegido no se guarda', async () => {
    await post(`/api/v1/believers/${jesus}/notes`, {
      kind: 'don',
      occurredAt: '2026-08-03',
      told: 'Sin decir cuál',
    }).expect(400);
  });

  it('la bitácora se lee hacia atrás y trae sus cuentas por tipo', async () => {
    const respuesta = await get(`/api/v1/believers/${jesus}/notes?limit=20`).expect(200);
    const pagina = body<Paginated<BelieverNote> & { counts: NoteCounts }>(respuesta);

    expect(pagina.total).toBe(1);
    expect(pagina.counts.seguimiento).toBe(1);
    expect(pagina.counts.don).toBe(0);
    expect(pagina.items[0]?.authorName).toBe('Quien acompaña');
    // El cuerpo son dos campos, no uno (D15).
    expect(pagina.items[0]?.told).toContain('trabajo nuevo');
    expect(pagina.items[0]?.advice).toContain('grupo de los jueves');
  });

  it('la bitácora se busca en el servidor, no en lo que ya se ha traído', async () => {
    const encontrada = await get(`/api/v1/believers/${jesus}/notes?search=JUEVES`).expect(200);
    // Busca también en la indicación dada, y sin distinguir mayúsculas.
    expect(body<Paginated<BelieverNote>>(encontrada).total).toBe(1);

    const vacia = await get(`/api/v1/believers/${jesus}/notes?search=zzzz`).expect(200);
    expect(body<Paginated<BelieverNote>>(vacia).total).toBe(0);
  });

  it('un recordatorio guarda día y hora, y se puede dar por atendido', async () => {
    const creada = await post(`/api/v1/believers/${jesus}/notes`, {
      kind: 'seguimiento',
      occurredAt: '2026-08-04',
      told: 'Está preocupado por su madre',
      remindAt: '2026-08-12T19:00',
      remindText: 'Preguntarle cómo sigue su madre',
    }).expect(201);

    const nota = body<BelieverNote>(creada);
    expect(nota.remindAt).not.toBeNull();
    expect(new Date(nota.remindAt ?? '').getHours()).toBe(19);
    expect(nota.remindDoneAt).toBeNull();

    const atendida = await request(app.getHttpServer())
      .patch(`/api/v1/believers/${jesus}/notes/${nota.id}`)
      .set('Cookie', cookie)
      .send({ remindDone: true })
      .expect(200);

    expect(body<BelieverNote>(atendida).remindDoneAt).not.toBeNull();

    // Y se limpia para no dejar el resumen contaminado en los tests de abajo.
    await request(app.getHttpServer())
      .delete(`/api/v1/believers/${jesus}/notes/${nota.id}`)
      .set('Cookie', cookie)
      .expect(200);
  });

  it('los días con notas alimentan la vista de calendario', async () => {
    const respuesta = await get(
      `/api/v1/believers/${jesus}/notes/days?from=2026-01-01&to=2026-12-31`,
    ).expect(200);

    const dias = body<NoteDay[]>(respuesta);
    expect(dias.map((one) => one.date)).toContain('2026-08-01');
    expect(dias.find((one) => one.date === '2026-08-01')?.kinds).toEqual(['seguimiento']);
  });

  it('graba un audio en la nota y lo devuelve al descargarlo', async () => {
    const pagina = await get(`/api/v1/believers/${jesus}/notes`).expect(200);
    const nota = body<Paginated<BelieverNote>>(pagina).items[0];
    expect(nota).toBeDefined();

    const subida = await request(app.getHttpServer())
      .post(`/api/v1/believers/${jesus}/notes/${nota?.id ?? ''}/audios`)
      .set('Cookie', cookie)
      .field('recorded', 'true')
      .field('durationSeconds', '12')
      .attach('file', Buffer.from('esto-hace-de-audio'), {
        filename: 'nota.webm',
        contentType: 'audio/webm',
      })
      .expect(201);

    const audio = body<NoteAudio>(subida);
    expect(audio.recorded).toBe(true);
    expect(audio.durationSeconds).toBe(12);

    const descarga = await get(`/api/v1/audios/${audio.id}`).expect(200);
    expect(descarga.headers['content-type']).toContain('audio/webm');

    // Y aparece colgando de su nota, sin una consulta por línea.
    const conAudio = await get(`/api/v1/believers/${jesus}/notes`).expect(200);
    expect(body<Paginated<BelieverNote>>(conAudio).items[0]?.audios).toHaveLength(1);
  });

  it('un fichero que no es audio no se guarda', async () => {
    const pagina = await get(`/api/v1/believers/${jesus}/notes`).expect(200);
    const nota = body<Paginated<BelieverNote>>(pagina).items[0];

    await request(app.getHttpServer())
      .post(`/api/v1/believers/${jesus}/notes/${nota?.id ?? ''}/audios`)
      .set('Cookie', cookie)
      .attach('file', Buffer.from('MZ'), {
        filename: 'virus.exe',
        contentType: 'application/x-msdownload',
      })
      .expect(400);
  });

  it('las cuentas de la cabecera salen de una consulta y cuadran', async () => {
    const respuesta = await get('/api/v1/believers/summary').expect(200);
    const resumen = body<BelieversSummary>(respuesta);

    expect(resumen.total).toBe(3);
    expect(resumen.byStatus.nuevo).toBe(1);
    expect(resumen.byStatus.activo).toBe(2);
    // Se acaban de crear: los tres son de este mes.
    expect(resumen.newThisMonth).toBe(3);
  });

  it('el filtro por estado y el de atención acotan de verdad', async () => {
    const nuevos = await get('/api/v1/believers?status=nuevo').expect(200);
    expect(body<Paginated<BelieverListItem>>(nuevos).total).toBe(1);

    // Nadie ha agotado su margen todavía: se acaban de dar de alta.
    const piden = await get('/api/v1/believers?attention=true').expect(200);
    expect(body<Paginated<BelieverListItem>>(piden).total).toBe(0);
  });

  it('un creyente de otra iglesia no existe para quien pregunta', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/believers/8f14e45f-ceea-467a-9a4a-1a0b5f6e4e2b')
      .set('Cookie', cookie)
      .expect(404);
  });
});
