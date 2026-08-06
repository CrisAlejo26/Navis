import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  Believer,
  ExportResponse,
  List,
  ListExportRow,
  ListMember,
  ListMemberships,
  ListShareState,
  ListStats,
  ListSummary,
  PublicList,
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
 * Las listas y **lo que sale a la calle** (RFC 0010).
 *
 * Lo que se comprueba aquí y no con dobles es justo lo que depende del motor y
 * del montaje real: que `/l/<token>` llega fuera del prefijo y del versionado,
 * que la respuesta pública no lleva ni un dato de más, que un creyente borrado
 * desaparece del cartel y que despublicar deja el enlace en 404 al momento.
 */
describe('Listas compartidas (e2e)', () => {
  let app: NestExpressApplication;
  const sello = String(Date.now());
  const email = `listas-${sello}@navis.test`;
  const password = 'Rebano2026Seguro';
  let cookie = '';

  let pulpito: ListSummary;
  let sonido: ListSummary;
  let juan = '';
  let ana = '';
  let pedro = '';
  let token = '';

  const get = (path: string) => request(app.getHttpServer()).get(path).set('Cookie', cookie);
  const post = (path: string, payload?: object) =>
    request(app.getHttpServer())
      .post(path)
      .set('Cookie', cookie)
      .send(payload ?? {});
  const patch = (path: string, payload: object) =>
    request(app.getHttpServer()).patch(path).set('Cookie', cookie).send(payload);
  const put = (path: string, payload: object) =>
    request(app.getHttpServer()).put(path).set('Cookie', cookie).send(payload);
  const del = (path: string) => request(app.getHttpServer()).delete(path).set('Cookie', cookie);
  const anon = () => request(app.getHttpServer());

  async function crearCreyente(firstName: string, lastName: string): Promise<string> {
    const created = await post('/api/v1/believers', { firstName, lastName }).expect(201);
    return body<Believer>(created).id;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    app.use('/api/auth', toNodeHandler(auth));
    app.use(express.json());
    // Las mismas exclusiones que `main.ts`: sin ellas, `/l/<token>` viviría en
    // `/api/v1/l/…` y el enlace dejaría de ser el enlace (D14).
    app.setGlobalPrefix('api', {
      exclude: ['health', 'l/:token', 'l/:token/card.png', 'l/:token/photos/:believerId'],
    });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();

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
    const setCookie = entrada.headers['set-cookie'];
    cookie = (Array.isArray(setCookie) ? setCookie : [setCookie]).join('; ');

    await post('/api/v1/churches', { name: `Iglesia Faro ${sello}`, city: 'Elda' }).expect(201);

    juan = await crearCreyente('Juan', 'Pérez');
    ana = await crearCreyente('Ana', 'Ruiz');
    pedro = await crearCreyente('Pedro', 'Gil');
  });

  afterAll(async () => {
    await app.close();
  });

  it('una iglesia nueva nace con las cinco listas de serie, vacías y sin publicar', async () => {
    const listas = body<ListSummary[]>(await get('/api/v1/lists').expect(200));

    expect(listas.map((one) => one.slug)).toEqual([
      'pulpito',
      'recepcion',
      'sonido',
      'biblias',
      'ofrenda',
    ]);
    expect(listas.every((one) => one.visibility === 'private')).toBe(true);
    expect(listas.every((one) => one.shareToken === null)).toBe(true);
    expect(listas.every((one) => one.memberCount === 0)).toBe(true);
    // Cada una con su color, que es lo que quita el blanco de la sección (D37).
    expect(new Set(listas.map((one) => one.accent)).size).toBe(5);

    [pulpito, , sonido] = listas;
  });

  it('renombrar una lista no cambia su slug (D7)', async () => {
    const renombrada = body<List>(
      await patch(`/api/v1/lists/${pulpito.id}`, { name: 'Predicación' }).expect(200),
    );

    expect(renombrada.name).toBe('Predicación');
    expect(renombrada.slug).toBe('pulpito');

    await patch(`/api/v1/lists/${pulpito.id}`, { name: 'Púlpito' }).expect(200);
  });

  it('no deja dos listas con el mismo nombre', async () => {
    await post('/api/v1/lists', { name: 'Púlpito' }).expect(400);
  });

  it('mete personas de golpe, en el orden en que llegan, y las ordena a mano (D6)', async () => {
    // A propósito **al revés** del orden en que se dieron de alta: un `IN (...)`
    // no garantiza ninguno, y en Postgres salía uno y en SQLite el contrario.
    const metidos = body<ListMember[]>(
      await post(`/api/v1/lists/${pulpito.id}/members`, {
        believerIds: [ana, pedro, juan],
      }).expect(201),
    );

    expect(metidos.map((one) => one.believerId)).toEqual([ana, pedro, juan]);
    expect(metidos.map((one) => one.position)).toEqual([0, 1, 2]);

    // Meterlos otra vez no los duplica.
    const otra = body<ListMember[]>(
      await post(`/api/v1/lists/${pulpito.id}/members`, { believerIds: [juan] }).expect(201),
    );
    expect(otra).toHaveLength(3);

    const ordenados = body<ListMember[]>(
      await put(`/api/v1/lists/${pulpito.id}/order`, {
        believerIds: [pedro, juan, ana],
      }).expect(200),
    );
    expect(ordenados.map((one) => one.believerId)).toEqual([pedro, juan, ana]);
  });

  it('guarda la nota de cada persona en la lista', async () => {
    const conNota = body<ListMember[]>(
      await patch(`/api/v1/lists/${pulpito.id}/members/${juan}`, {
        note: 'Solo primer domingo',
      }).expect(200),
    );

    expect(conNota.find((one) => one.believerId === juan)?.note).toBe('Solo primer domingo');
  });

  it('dice en qué listas está cada persona, en una sola llamada (§8.7)', async () => {
    await post(`/api/v1/lists/${sonido.id}/members`, { believerIds: [juan] }).expect(201);

    const mapa = body<ListMemberships>(await get('/api/v1/lists/memberships').expect(200));

    expect(mapa[juan]?.sort()).toEqual([pulpito.id, sonido.id].sort());
    expect(mapa[pedro]).toEqual([pulpito.id]);
  });

  it('publica en abierta y devuelve un enlace que es un secreto, no un nombre (D10)', async () => {
    const estado = body<ListShareState>(
      await post(`/api/v1/lists/${pulpito.id}/share`, { visibility: 'link' }).expect(201),
    );

    expect(estado.visibility).toBe('link');
    expect(estado.shareToken).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(estado.shareToken).not.toContain('pulpito');

    token = estado.shareToken ?? '';
  });

  it('sirve el documento con las og: fuera del prefijo y del versionado (D14)', async () => {
    const respuesta = await anon().get(`/l/${token}`).expect(200);

    expect(respuesta.headers['content-type']).toContain('text/html');
    expect(respuesta.text).toContain('property="og:title"');
    expect(respuesta.text).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(respuesta.text).toContain(`location.replace("/lists/s/${token}")`);

    // Y **no** existe bajo el prefijo: si existiera, habría dos enlaces.
    await anon().get(`/api/v1/l/${token}`).expect(404);
  });

  /*
   * Las descargas nacen apagadas, como la foto: que la lista se vea en una
   * página es una cosa y que se lleve un fichero con los nombres es otra. Se
   * encienden en el mismo gesto de publicar, no en otro sitio.
   */
  it('nace sin descargas, y se encienden al publicar', async () => {
    const recien = body<PublicList>(await anon().get(`/api/v1/public/lists/${token}`).expect(200));
    expect(recien.allowDownload).toBe(false);

    await post(`/api/v1/lists/${pulpito.id}/share`, {
      visibility: 'link',
      allowDownload: true,
    }).expect(201);

    const abierta = body<PublicList>(await anon().get(`/api/v1/public/lists/${token}`).expect(200));
    expect(abierta.allowDownload).toBe(true);

    // Y se vuelven a apagar por el mismo camino.
    await post(`/api/v1/lists/${pulpito.id}/share`, {
      visibility: 'link',
      allowDownload: false,
    }).expect(201);

    const cerrada = body<PublicList>(await anon().get(`/api/v1/public/lists/${token}`).expect(200));
    expect(cerrada.allowDownload).toBe(false);
  });

  it('sirve el JSON sin sesión, con solo el nombre y la posición (D16)', async () => {
    const publica = body<PublicList>(await anon().get(`/api/v1/public/lists/${token}`).expect(200));

    expect(publica.name).toBe('Púlpito');
    expect(publica.restricted).toBe(false);
    expect(publica.members.map((one) => one.name)).toEqual(['Pedro Gil', 'Juan Pérez', 'Ana Ruiz']);

    for (const miembro of publica.members) {
      expect(Object.keys(miembro).sort()).toEqual([
        'congregation',
        'ministry',
        'name',
        'note',
        'photoId',
        'position',
      ]);
      expect(miembro.photoId).toBeNull();
      expect(miembro.note).toBeNull();
    }

    const crudo = JSON.stringify(publica);
    for (const prohibido of [juan, ana, pedro, 'phone', 'status', 'hasAccess', 'believerId']) {
      expect(crudo).not.toContain(prohibido);
    }
  });

  it('un creyente borrado desaparece del cartel al momento', async () => {
    await del(`/api/v1/believers/${ana}`).expect(200);

    const publica = body<PublicList>(await anon().get(`/api/v1/public/lists/${token}`).expect(200));
    expect(publica.members.map((one) => one.name)).toEqual(['Pedro Gil', 'Juan Pérez']);

    const ficha = body<{ members: ListMember[] }>(
      await get(`/api/v1/lists/${pulpito.id}`).expect(200),
    );
    expect(ficha.members.map((one) => one.believerId)).toEqual([pedro, juan]);
  });

  it('cuenta una visita aunque se recargue cinco veces (D33)', async () => {
    for (let vez = 0; vez < 4; vez += 1) {
      await anon().get(`/api/v1/public/lists/${token}`).expect(200);
    }

    const stats = body<ListStats>(await get(`/api/v1/lists/${pulpito.id}/stats`).expect(200));

    expect(stats.audience.visitors).toBe(1);
    expect(stats.audience.views).toBeGreaterThan(1);
    expect(stats.audience.days).toHaveLength(30);
    expect(stats.audience.days.at(-1)?.views).toBeGreaterThan(0);
  });

  it('no guarda ninguna dirección IP entera, ni contraseñas en claro (D32)', async () => {
    const dataSource = app.get(DataSource);
    const filas: unknown = await dataSource.query(`SELECT "ip_prefix" FROM "list_views"`);

    expect(Array.isArray(filas)).toBe(true);
    for (const fila of filas as { ip_prefix: string }[]) {
      expect(fila.ip_prefix).toMatch(/(\.0|::)$|^$/);
    }
  });

  it('la vista previa de WhatsApp no cuenta como visita (D31)', async () => {
    const antes = body<ListStats>(await get(`/api/v1/lists/${pulpito.id}/stats`).expect(200));
    await anon().get(`/l/${token}`).expect(200);
    const despues = body<ListStats>(await get(`/api/v1/lists/${pulpito.id}/stats`).expect(200));

    expect(despues.audience.views).toBe(antes.audience.views);
  });

  it('la foto de alguien que no está en la lista da 404 aunque el token valga (D17)', async () => {
    // La foto está apagada por defecto: ni siquiera de quien sí está.
    await anon().get(`/l/${token}/photos/${juan}`).expect(404);
    await anon().get(`/l/${token}/photos/${ana}`).expect(404);
  });

  it('el solapamiento cuenta en cuántas listas más está la misma gente (D36)', async () => {
    const stats = body<ListStats>(await get(`/api/v1/lists/${pulpito.id}/stats`).expect(200));

    expect(stats.overlap.inOtherLists.map((one) => one.name)).toEqual(['Juan Pérez']);
    expect(stats.overlap.inOtherLists[0]?.listCount).toBe(2);
    expect(stats.overlap.sharedWith.map((one) => one.name)).toEqual(['Sonido']);
  });

  it('exporta las filas de la lista sin escribir ningún escritor nuevo (D41)', async () => {
    const salida = body<ExportResponse<ListExportRow>>(
      await get(`/api/v1/lists/${pulpito.id}/export`).expect(200),
    );

    expect(salida.total).toBe(2);
    expect(salida.truncated).toBe(false);
    expect(salida.rows[0]).toMatchObject({ position: 1, name: 'Pedro Gil' });
  });

  it('pasar de abierta a restringida cambia el enlace, y sin conceder a nadie no deja (D12)', async () => {
    await post(`/api/v1/lists/${pulpito.id}/share`, { visibility: 'restricted' }).expect(400);

    const cambiado = body<ListShareState>(
      await post(`/api/v1/lists/${pulpito.id}/share/rotate`).expect(201),
    );

    expect(cambiado.tokenRotated).toBe(true);
    expect(cambiado.shareToken).not.toBe(token);
    await anon().get(`/api/v1/public/lists/${token}`).expect(404);

    token = cambiado.shareToken ?? '';
    await anon().get(`/api/v1/public/lists/${token}`).expect(200);
  });

  it('una lista caducada se comporta igual que despublicada (D13)', async () => {
    await post(`/api/v1/lists/${pulpito.id}/share`, {
      visibility: 'link',
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    }).expect(201);

    await anon().get(`/api/v1/public/lists/${token}`).expect(404);
    await anon().get(`/l/${token}`).expect(404);

    await post(`/api/v1/lists/${pulpito.id}/share`, { visibility: 'link', expiresAt: null }).expect(
      201,
    );
    await anon().get(`/api/v1/public/lists/${token}`).expect(200);
  });

  it('dejar de compartir deja el enlace en 404, y volver a publicar da otro (D11)', async () => {
    await del(`/api/v1/lists/${pulpito.id}/share`).expect(200);
    await anon().get(`/api/v1/public/lists/${token}`).expect(404);
    await anon().get(`/l/${token}`).expect(404);

    const otra = body<ListShareState>(
      await post(`/api/v1/lists/${pulpito.id}/share`, { visibility: 'link' }).expect(201),
    );

    expect(otra.shareToken).not.toBe(token);
    token = otra.shareToken ?? '';
  });

  it('un token que no existe da el mismo 404 que uno que existió', async () => {
    const inventado = await anon().get('/api/v1/public/lists/aaaaaaaaaaaaaaaaaaaaaa').expect(404);
    const raro = await anon().get('/api/v1/public/lists/pulpito').expect(404);

    expect(body<{ message: string }>(inventado).message).toBe(
      body<{ message: string }>(raro).message,
    );
  });

  it('borrar una lista la despublica y la saca del tablón', async () => {
    const nueva = body<List>(await post('/api/v1/lists', { name: `Retiro ${sello}` }).expect(201));
    const compartida = body<ListShareState>(
      await post(`/api/v1/lists/${nueva.id}/share`, { visibility: 'link' }).expect(201),
    );

    await del(`/api/v1/lists/${nueva.id}`).expect(200);

    await anon()
      .get(`/api/v1/public/lists/${compartida.shareToken ?? ''}`)
      .expect(404);
    const listas = body<ListSummary[]>(await get('/api/v1/lists').expect(200));
    expect(listas.some((one) => one.id === nueva.id)).toBe(false);
  });

  it('la lista de otra iglesia no se lee ni se edita', async () => {
    const otroEmail = `listas-otro-${sello}@navis.test`;
    await anon()
      .post('/api/auth/sign-up/email')
      .send({ email: otroEmail, password, name: 'Otro pastor' })
      .expect(200);

    const dataSource = app.get(DataSource);
    const marca = dataSource.options.type === 'postgres' ? '$1' : '?';
    await dataSource.query(`UPDATE "user" SET "role" = 'pastor' WHERE "email" = ${marca}`, [
      otroEmail,
    ]);

    const entrada = await anon()
      .post('/api/auth/sign-in/email')
      .send({ email: otroEmail, password })
      .expect(200);
    const setCookie = entrada.headers['set-cookie'];
    const otra = (Array.isArray(setCookie) ? setCookie : [setCookie]).join('; ');

    await request(app.getHttpServer())
      .post('/api/v1/churches')
      .set('Cookie', otra)
      .send({ name: `Iglesia Ajena ${sello}`, city: 'Elda' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/lists/${pulpito.id}`)
      .set('Cookie', otra)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/v1/lists/${pulpito.id}`)
      .set('Cookie', otra)
      .send({ name: 'Mía ahora' })
      .expect(404);
  });
});
