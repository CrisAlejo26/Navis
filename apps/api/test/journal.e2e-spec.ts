import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type {
  ExportResponse,
  JournalEntry,
  JournalEntryAudio,
  JournalEntryListItem,
  JournalExportRow,
  JournalStats,
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
 * El cuaderno de la iglesia: entradas de siete tipos, un recordatorio que se
 * puede dar por atendido, audios y las cuentas de la portada (RFC 0017).
 *
 * Lo que se comprueba aquí y no con dobles es justo lo que depende del motor:
 * que la búsqueda encuentra sin acentos en los dos, que `pendingReminder` se
 * resuelve en SQL, y que una entrada de otra iglesia no existe para quien
 * pregunta (D1) — la misma barrera que creyentes y calendario.
 */
describe('El cuaderno de la iglesia (e2e)', () => {
  let app: NestExpressApplication;
  const email = `cuaderno-${String(Date.now())}@navis.test`;
  const password = 'Rebano2026Seguro';
  let cookie = '';
  let visita = '';

  const post = (path: string, payload: object) =>
    request(app.getHttpServer()).post(path).set('Cookie', cookie).send(payload);
  const get = (path: string) => request(app.getHttpServer()).get(path).set('Cookie', cookie);
  const patch = (path: string, payload: object) =>
    request(app.getHttpServer()).patch(path).set('Cookie', cookie).send(payload);
  const del = (path: string) => request(app.getHttpServer()).delete(path).set('Cookie', cookie);

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

    // Nace `creyente`; se le sube el rol y se vuelve a entrar, porque la sesión
    // se cachea en cookie (ver `believers.e2e-spec.ts`).
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

    await post('/api/v1/churches', { name: `Iglesia ${String(Date.now())}`, city: 'Elda' }).expect(
      201,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('añade una entrada y la devuelve con su tipo y su fecha', async () => {
    const creada = await post('/api/v1/journal', {
      title: 'Visita a la familia Gómez',
      kind: 'testimonio',
      occurredAt: '2026-07-14',
      annotation: 'Contó que llevaba dos años sin hablar con su hermano.',
      learned: 'Que a veces la reconciliación empieza por una llamada.',
    }).expect(201);

    const vista = body<JournalEntry>(creada);
    visita = vista.id;
    expect(vista.kind).toBe('testimonio');
    expect(vista.occurredAt).toBe('2026-07-14');
    expect(vista.authorName).toBe('Quien acompaña');
    expect(vista.audios).toEqual([]);
  });

  it('un título vacío no se guarda', async () => {
    await post('/api/v1/journal', {
      title: '   ',
      kind: 'observacion',
      occurredAt: '2026-07-14',
      annotation: 'algo',
    }).expect(400);
  });

  it('«gomez» encuentra «Gómez», sin acentos y sin mayúsculas', async () => {
    const respuesta = await get('/api/v1/journal?search=gomez').expect(200);
    const pagina = body<Paginated<JournalEntryListItem>>(respuesta);

    expect(pagina.total).toBe(1);
    expect(pagina.items[0]?.id).toBe(visita);
    // El extracto viene ya recortado, no la anotación entera.
    expect(pagina.items[0]?.excerpt).toContain('hermano');
  });

  it('el filtro por tipo acota de verdad', async () => {
    await post('/api/v1/journal', {
      title: 'Oración por la congregación',
      kind: 'oracion',
      occurredAt: '2026-07-20',
      annotation: 'Se oró por las familias que están pasando dificultades.',
    }).expect(201);

    const testimonios = await get('/api/v1/journal?kind=testimonio').expect(200);
    expect(body<Paginated<JournalEntryListItem>>(testimonios).total).toBe(1);

    const dos = await get('/api/v1/journal?kind=testimonio&kind=oracion').expect(200);
    expect(body<Paginated<JournalEntryListItem>>(dos).total).toBe(2);
  });

  describe('el recordatorio', () => {
    let conRecordatorio = '';

    it('un recordatorio con mensaje pero sin fecha se rechaza', async () => {
      await post('/api/v1/journal', {
        title: 'Sin fecha',
        kind: 'decision',
        occurredAt: '2026-07-21',
        annotation: 'algo',
        remindText: 'Preguntar cómo sigue',
      }).expect(400);
    });

    it('guarda día y hora, y aparece en «recordatorios pendientes»', async () => {
      const creada = await post('/api/v1/journal', {
        title: 'Seguimiento de la familia Gómez',
        kind: 'testimonio',
        occurredAt: '2026-07-22',
        annotation: 'Quedamos en volver a hablar.',
        remindAt: '2026-08-12T19:00',
        remindText: 'Preguntar cómo sigue',
      }).expect(201);

      const vista = body<JournalEntry>(creada);
      conRecordatorio = vista.id;
      expect(new Date(vista.remindAt ?? '').getHours()).toBe(19);
      expect(vista.remindDoneAt).toBeNull();

      const pendientes = await get('/api/v1/journal?pendingReminder=true').expect(200);
      const items = body<Paginated<JournalEntryListItem>>(pendientes).items;
      expect(items.map((one) => one.id)).toContain(conRecordatorio);
    });

    it('dar por atendido lo saca de «pendientes» y no borra la entrada', async () => {
      await patch(`/api/v1/journal/${conRecordatorio}`, { remindDone: true }).expect(200);

      const pendientes = await get('/api/v1/journal?pendingReminder=true').expect(200);
      const items = body<Paginated<JournalEntryListItem>>(pendientes).items;
      expect(items.map((one) => one.id)).not.toContain(conRecordatorio);

      const ficha = await get(`/api/v1/journal/${conRecordatorio}`).expect(200);
      expect(body<JournalEntry>(ficha).remindDoneAt).not.toBeNull();
    });
  });

  it('las cuentas de la portada traen los doce meses, con los vacíos a cero', async () => {
    const respuesta = await get('/api/v1/journal/stats').expect(200);
    const stats = body<JournalStats>(respuesta);

    expect(stats.total).toBe(3);
    expect(stats.byKind.testimonio).toBe(2);
    expect(stats.byKind.oracion).toBe(1);
    expect(stats.monthly).toHaveLength(12);
    expect(stats.monthly.at(-1)?.total).toBeGreaterThanOrEqual(0);
  });

  it('graba un audio en la entrada y lo devuelve al descargarlo, bajo /journal/audios/', async () => {
    const subida = await request(app.getHttpServer())
      .post(`/api/v1/journal/${visita}/audios`)
      .set('Cookie', cookie)
      .field('recorded', 'true')
      .field('durationSeconds', '12')
      .attach('file', Buffer.from('esto-hace-de-audio'), {
        filename: 'entrada.webm',
        contentType: 'audio/webm',
      })
      .expect(201);

    const audio = body<JournalEntryAudio>(subida);
    expect(audio.recorded).toBe(true);
    expect(audio.durationSeconds).toBe(12);

    const descarga = await get(`/api/v1/journal/audios/${audio.id}`).expect(200);
    expect(descarga.headers['content-type']).toContain('audio/webm');

    // Y aparece colgando de su entrada, y en el listado como `hasAudio`.
    const ficha = await get(`/api/v1/journal/${visita}`).expect(200);
    expect(body<JournalEntry>(ficha).audios).toHaveLength(1);

    const listado = await get('/api/v1/journal?search=gomez&kind=testimonio').expect(200);
    const fila = body<Paginated<JournalEntryListItem>>(listado).items.find(
      (one) => one.id === visita,
    );
    expect(fila?.hasAudio).toBe(true);
  });

  it('un fichero que no es audio no se guarda', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/journal/${visita}/audios`)
      .set('Cookie', cookie)
      .attach('file', Buffer.from('MZ'), {
        filename: 'virus.exe',
        contentType: 'application/x-msdownload',
      })
      .expect(400);
  });

  describe('exportar (D12)', () => {
    it('trae las filas del filtro sin paginar, con el cuerpo entero', async () => {
      const salida = body<ExportResponse<JournalExportRow>>(
        await get('/api/v1/journal/export?kind=testimonio').expect(200),
      );

      expect(salida.total).toBe(2);
      expect(salida.rows.every((row) => typeof row.annotation === 'string')).toBe(true);
    });

    it('con una selección manda la selección y se ignora el filtro', async () => {
      const salida = body<ExportResponse<JournalExportRow>>(
        await get(`/api/v1/journal/export?ids=${visita}&kind=oracion`).expect(200),
      );

      expect(salida.rows.map((row) => row.id)).toEqual([visita]);
    });

    it('una selección de nadie no se convierte en «pues entonces todo»', async () => {
      const salida = body<ExportResponse<JournalExportRow>>(
        await get('/api/v1/journal/export?ids=8f14e45f-ceea-467a-9a4a-1a0b5f6e4e2b').expect(200),
      );

      expect(salida.total).toBe(0);
      expect(salida.rows).toEqual([]);
    });
  });

  it('pagina de verdad: página y tamaño se respetan', async () => {
    const primera = body<Paginated<JournalEntryListItem>>(
      await get('/api/v1/journal?limit=2&page=1&sort=date&order=asc').expect(200),
    );
    const segunda = body<Paginated<JournalEntryListItem>>(
      await get('/api/v1/journal?limit=2&page=2&sort=date&order=asc').expect(200),
    );

    expect(primera.total).toBe(3);
    expect(primera.items).toHaveLength(2);
    expect(segunda.items).toHaveLength(1);
    // Sin solapes entre páginas.
    const idsPrimera = new Set(primera.items.map((one) => one.id));
    expect(segunda.items.every((one) => !idsPrimera.has(one.id))).toBe(true);
  });

  it('borra una entrada (borrado lógico) y deja de verse', async () => {
    const creada = body<JournalEntry>(
      await post('/api/v1/journal', {
        title: 'Para borrar',
        kind: 'decision',
        occurredAt: '2026-07-25',
        annotation: 'Se descarta.',
      }).expect(201),
    );

    await del(`/api/v1/journal/${creada.id}`).expect(200);
    await get(`/api/v1/journal/${creada.id}`).expect(404);
  });

  it('una entrada de otra iglesia da 404, no 403', async () => {
    // Una segunda iglesia para la misma cuenta: al crearla se vuelve la activa.
    await post('/api/v1/churches', {
      name: `Otra iglesia ${String(Date.now())}`,
      city: 'Alicante',
    }).expect(201);

    await get(`/api/v1/journal/${visita}`).expect(404);
  });
});
