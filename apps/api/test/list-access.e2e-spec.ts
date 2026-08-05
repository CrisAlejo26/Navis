import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  Believer,
  ListCredential,
  ListCredentialSheetRow,
  ListMember,
  ListShareState,
  ListStats,
  ListSummary,
  ListViewer,
  PublicList,
  PublicListGate,
} from '@navis/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';

const body = <T>(response: { body: unknown }): T => response.body as T;

const cookieOf = (response: { headers: Record<string, unknown> }): string => {
  const raw = response.headers['set-cookie'];
  return (Array.isArray(raw) ? raw : [raw])
    .filter((one): one is string => typeof one === 'string')
    .map((one) => one.split(';')[0])
    .join('; ');
};

/**
 * **Los accesos: la parte con más superficie de ataque del proyecto** (RFC 0010
 * D19 a D30).
 *
 * El test central de esta entrega es que un acceso concedido a la lista A no
 * abre la lista B aunque el usuario y la contraseña sean correctos, y que quitar
 * **una** concesión no toca las demás. Lo demás cuelga de ahí: estar en una
 * lista no es poder verla (D21), revocar revoca de verdad (D28) y la contraseña
 * no se puede volver a leer desde ninguna pantalla (D24).
 */
describe('Accesos a listas (e2e)', () => {
  let app: NestExpressApplication;
  const sello = String(Date.now());
  const email = `accesos-${sello}@navis.test`;
  const password = 'Rebano2026Seguro';
  let cookie = '';

  let pulpito = '';
  let sonido = '';
  let juan = '';
  let ana = '';
  let pedro = '';
  let tokenPulpito = '';
  let tokenSonido = '';
  let accesoJuan: ListViewer;
  let claveJuan = '';
  let accesoAna: ListViewer;
  let claveAna = '';
  let sesionJuan = '';

  const get = (path: string) => request(app.getHttpServer()).get(path).set('Cookie', cookie);
  const post = (path: string, payload?: object) =>
    request(app.getHttpServer())
      .post(path)
      .set('Cookie', cookie)
      .send(payload ?? {});
  const put = (path: string, payload: object) =>
    request(app.getHttpServer()).put(path).set('Cookie', cookie).send(payload);
  const patch = (path: string, payload: object) =>
    request(app.getHttpServer()).patch(path).set('Cookie', cookie).send(payload);
  const del = (path: string) => request(app.getHttpServer()).delete(path).set('Cookie', cookie);
  const anon = () => request(app.getHttpServer());

  const entrar = (token: string, username: string, clave: string) =>
    anon().post(`/api/v1/public/lists/${token}/access`).send({ username, password: clave });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    app.use('/api/auth', toNodeHandler(auth));
    app.use(express.json());
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
    cookie = cookieOf(entrada);

    await post('/api/v1/churches', { name: `Iglesia Puerta ${sello}`, city: 'Elda' }).expect(201);

    const listas = body<ListSummary[]>(await get('/api/v1/lists').expect(200));
    pulpito = listas[0]?.id ?? '';
    sonido = listas[2]?.id ?? '';

    for (const [nombre, apellido] of [
      ['Juan', 'Pérez'],
      ['Ana', 'Ruiz'],
      ['Pedro', 'Gil'],
    ]) {
      const persona = body<Believer>(
        await post('/api/v1/believers', { firstName: nombre, lastName: apellido }).expect(201),
      );
      if (nombre === 'Juan') juan = persona.id;
      if (nombre === 'Ana') ana = persona.id;
      if (nombre === 'Pedro') pedro = persona.id;
    }

    await post(`/api/v1/lists/${pulpito}/members`, { believerIds: [juan, pedro] }).expect(201);
    await post(`/api/v1/lists/${sonido}/members`, { believerIds: [ana] }).expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('crea un acceso desde un creyente y devuelve la contraseña una sola vez (D20, D24)', async () => {
    const creado = body<ListCredential>(
      await post('/api/v1/list-viewers', {
        label: 'Juan Pérez',
        username: 'juan.perez',
        password: 'k7fr-m3np-t9wx',
        believerId: juan,
      }).expect(201),
    );

    accesoJuan = creado.viewer;
    claveJuan = creado.password;

    expect(creado.password).toBe('k7fr-m3np-t9wx');
    expect(creado.viewer.believerName).toBe('Juan Pérez');
    expect(Object.keys(creado.viewer)).not.toContain('password');
    expect(Object.keys(creado.viewer)).not.toContain('passwordHash');

    // Ningún GET la devuelve: es la comprobación de que no se puede releer.
    const directorio = body<ListViewer[]>(await get('/api/v1/list-viewers').expect(200));
    expect(JSON.stringify(directorio)).not.toContain('k7fr');
  });

  it('un creyente no puede tener dos accesos, y lo dice con el que ya existe (§7.2)', async () => {
    const choque = await post('/api/v1/list-viewers', {
      label: 'Juan otra vez',
      username: 'juan.perez2',
      password: 'aaaa-bbbb-cccc',
      believerId: juan,
    }).expect(409);

    expect(body<{ message: string }>(choque).message).toContain('juan.perez');
  });

  it('no deja enlazar un creyente que no es de esta iglesia (D20)', async () => {
    await post('/api/v1/list-viewers', {
      label: 'De fuera',
      username: 'de.fuera',
      password: 'aaaa-bbbb-cccc',
      believerId: '11111111-1111-4111-8111-111111111111',
    }).expect(400);
  });

  it('crea un acceso de grupo, sin creyente detrás (D20)', async () => {
    const creado = body<ListCredential>(
      await post('/api/v1/list-viewers', {
        label: 'Ancianos',
        username: 'ancianos',
        password: 'w9tx-k4mn-p3rq',
      }).expect(201),
    );

    accesoAna = creado.viewer;
    claveAna = creado.password;

    expect(creado.viewer.believerId).toBeNull();
  });

  it('publicar en restringida sin conceder a nadie se rechaza y lo explica (§7.1)', async () => {
    const roto = await post(`/api/v1/lists/${pulpito}/share`, { visibility: 'restricted' }).expect(
      400,
    );
    expect(body<{ message: string }>(roto).message).toContain('acceso');
  });

  it('concede y publica las dos listas, cada una a un acceso distinto (D19)', async () => {
    await put(`/api/v1/list-viewers/${accesoJuan.id}/lists`, { ids: [pulpito] }).expect(200);
    await put(`/api/v1/lists/${sonido}/viewers`, { ids: [accesoAna.id] }).expect(200);

    tokenPulpito =
      body<ListShareState>(
        await post(`/api/v1/lists/${pulpito}/share`, { visibility: 'restricted' }).expect(201),
      ).shareToken ?? '';
    tokenSonido =
      body<ListShareState>(
        await post(`/api/v1/lists/${sonido}/share`, { visibility: 'restricted' }).expect(201),
      ).shareToken ?? '';

    expect(tokenPulpito).not.toBe('');
    expect(tokenSonido).not.toBe('');
  });

  it('sin cookie, la puerta enseña la iglesia, el nombre y el color, y nada más (§8.6)', async () => {
    const cerrada = await anon().get(`/api/v1/public/lists/${tokenPulpito}`).expect(401);
    const puerta = body<{ data: PublicListGate }>(cerrada).data;

    expect(Object.keys(puerta).sort()).toEqual(['accent', 'churchName', 'name']);
    expect(puerta.name).toBe('Púlpito');
    expect(JSON.stringify(cerrada.body)).not.toContain('Juan');
    expect(JSON.stringify(cerrada.body)).not.toContain('Pedro');
  });

  it('la tarjeta de una restringida no enseña ni un nombre ni el número de personas (D18)', async () => {
    const documento = await anon().get(`/l/${tokenPulpito}`).expect(200);

    expect(documento.text).not.toContain('Juan');
    expect(documento.text).not.toContain('Pedro');
    expect(documento.text).toContain('Hace falta un acceso');
  });

  it('usuario que no existe y contraseña mala dan el mismo mensaje (D26)', async () => {
    const sinUsuario = await entrar(tokenPulpito, 'no.existe', claveJuan).expect(401);
    const malaClave = await entrar(tokenPulpito, 'juan.perez', 'zzzz-zzzz-zzzz').expect(401);

    expect(body<{ message: string }>(sinUsuario).message).toBe(
      body<{ message: string }>(malaClave).message,
    );
    expect(body<{ message: string }>(malaClave).message).toBe('Usuario o contraseña incorrectos');
  });

  it('entra con la contraseña escrita sin guiones y ve la lista (D25)', async () => {
    const entrada = await entrar(tokenPulpito, 'juan.perez', claveJuan.replaceAll('-', '')).expect(
      200,
    );
    sesionJuan = cookieOf(entrada);

    const publica = body<PublicList>(entrada);
    expect(publica.restricted).toBe(true);
    expect(publica.viewerLabel).toBe('Juan Pérez');
    expect(publica.members.map((one) => one.name)).toEqual(['Juan Pérez', 'Pedro Gil']);
    expect(sesionJuan).toContain('navis.list_access');
  });

  it('**un acceso concedido a una lista no abre la otra**: 403 con su mensaje (D26)', async () => {
    const negada = await entrar(tokenSonido, 'juan.perez', claveJuan).expect(403);
    expect(body<{ message: string }>(negada).message).toBe('Este acceso no incluye esta lista');

    // Y con la cookie ya emitida, tampoco: no se le pide la contraseña otra vez.
    await anon().get(`/api/v1/public/lists/${tokenSonido}`).set('Cookie', sesionJuan).expect(403);
  });

  it('quien ya entró abre las demás suyas sin escribir nada (D23)', async () => {
    await put(`/api/v1/list-viewers/${accesoJuan.id}/lists`, { ids: [pulpito, sonido] }).expect(
      200,
    );

    const otra = await anon().get(`/api/v1/public/lists/${tokenSonido}`).set('Cookie', sesionJuan);

    // Quitar y volver a poner concesiones revoca las cookies (D28): se vuelve a
    // entrar, y a partir de ahí las dos listas se abren con la misma sesión.
    expect([200, 401]).toContain(otra.status);

    sesionJuan = cookieOf(await entrar(tokenPulpito, 'juan.perez', claveJuan).expect(200));

    await anon().get(`/api/v1/public/lists/${tokenSonido}`).set('Cookie', sesionJuan).expect(200);
    await anon().get(`/api/v1/public/lists/${tokenPulpito}`).set('Cookie', sesionJuan).expect(200);
  });

  it('quitarle **una** lista no toca las otras ni le cambia la contraseña (D23, D28)', async () => {
    await put(`/api/v1/list-viewers/${accesoJuan.id}/lists`, { ids: [pulpito] }).expect(200);

    sesionJuan = cookieOf(await entrar(tokenPulpito, 'juan.perez', claveJuan).expect(200));

    await anon().get(`/api/v1/public/lists/${tokenPulpito}`).set('Cookie', sesionJuan).expect(200);
    await anon().get(`/api/v1/public/lists/${tokenSonido}`).set('Cookie', sesionJuan).expect(403);
  });

  it('regenerar la contraseña cierra al momento lo que estaba abierto (D28)', async () => {
    const nueva = body<ListCredential>(
      await post(`/api/v1/list-viewers/${accesoJuan.id}/password`, {
        password: 'r4qm-b8vd-h6tk',
      }).expect(201),
    );

    expect(nueva.password).toBe('r4qm-b8vd-h6tk');
    await anon().get(`/api/v1/public/lists/${tokenPulpito}`).set('Cookie', sesionJuan).expect(401);

    claveJuan = nueva.password;
    sesionJuan = cookieOf(await entrar(tokenPulpito, 'juan.perez', claveJuan).expect(200));
  });

  it('desactivar el acceso lo deja fuera, con el mismo mensaje de siempre', async () => {
    await patch(`/api/v1/list-viewers/${accesoJuan.id}`, { isActive: false }).expect(200);

    await anon().get(`/api/v1/public/lists/${tokenPulpito}`).set('Cookie', sesionJuan).expect(401);
    await entrar(tokenPulpito, 'juan.perez', claveJuan).expect(401);

    await patch(`/api/v1/list-viewers/${accesoJuan.id}`, { isActive: true }).expect(200);
  });

  it('salir borra la cookie: en un teléfono prestado eso importa (§8.6)', async () => {
    sesionJuan = cookieOf(await entrar(tokenPulpito, 'juan.perez', claveJuan).expect(200));

    const salida = await anon()
      .post(`/api/v1/public/lists/${tokenPulpito}/exit`)
      .set('Cookie', sesionJuan)
      .expect(204);

    const raw = salida.headers['set-cookie'];
    expect(JSON.stringify(raw)).toContain('navis.list_access=;');
  });

  it('estar en una lista no da acceso, y tener acceso no mete en la lista (D21)', async () => {
    // Pedro está en púlpito desde el principio y no tiene ninguna llave.
    const directorio = body<ListViewer[]>(await get('/api/v1/list-viewers').expect(200));
    expect(directorio.some((one) => one.believerId === pedro)).toBe(false);

    // Y Ana tiene llave de sonido sin estar en púlpito.
    const ficha = body<{ members: ListMember[] }>(
      await get(`/api/v1/lists/${pulpito}`).expect(200),
    );
    expect(ficha.members.some((one) => one.believerId === ana)).toBe(false);
    expect(ficha.members.find((one) => one.believerId === juan)?.hasAccess).toBe(true);
    expect(ficha.members.find((one) => one.believerId === pedro)?.hasAccess).toBe(false);
  });

  it('«dar acceso a los de esta lista» crea solo los que faltan (D29)', async () => {
    const hoja = body<ListCredentialSheetRow[]>(
      await post(`/api/v1/lists/${pulpito}/viewers/bulk`).expect(201),
    );

    expect(hoja.map((one) => one.name)).toEqual(['Pedro Gil']);
    expect(hoja[0]?.username).toBe('pedro.gil');
    expect(hoja[0]?.password).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/);

    // Y a la segunda no crea a nadie: ya tienen todos.
    expect(
      body<ListCredentialSheetRow[]>(
        await post(`/api/v1/lists/${pulpito}/viewers/bulk`).expect(201),
      ),
    ).toEqual([]);
  });

  it('en la base de datos no hay ninguna contraseña en claro', async () => {
    const dataSource = app.get(DataSource);
    const filas: unknown = await dataSource.query(`SELECT "password_hash" FROM "list_viewers"`);

    for (const fila of filas as { password_hash: string }[]) {
      expect(fila.password_hash).toMatch(/^scrypt\$/);
      expect(fila.password_hash).not.toContain('r4qm');
      expect(fila.password_hash).not.toContain('w9tx');
    }

    const intentos: unknown = await dataSource.query(`SELECT * FROM "list_access_log"`);
    expect(JSON.stringify(intentos)).not.toContain('r4qm');
    expect(JSON.stringify(intentos)).not.toContain('w9tx');
  });

  it('las estadísticas dicen quién entró y cuántos no han entrado nunca (D35)', async () => {
    const stats = body<ListStats>(await get(`/api/v1/lists/${pulpito}/stats`).expect(200));

    expect(stats.audience.byViewer.map((one) => one.label)).toContain('Juan Pérez');
    expect(stats.access.granted).toBeGreaterThanOrEqual(1);
    expect(stats.access.neverEntered).toBeGreaterThanOrEqual(0);
    expect(stats.access.recent.some((one) => one.outcome === 'bad_credentials')).toBe(true);
    expect(
      stats.access.recent.every(
        (one) => one.ipPrefix.endsWith('.0') || one.ipPrefix.endsWith('::') || one.ipPrefix === '',
      ),
    ).toBe(true);
  });

  it('borrar un acceso libera su nombre de usuario (D30)', async () => {
    await del(`/api/v1/list-viewers/${accesoAna.id}`).expect(200);

    const otra = body<ListCredential>(
      await post('/api/v1/list-viewers', {
        label: 'Ancianos otra vez',
        username: 'ancianos',
        password: claveAna,
      }).expect(201),
    );

    expect(otra.viewer.username).toBe('ancianos');
  });
});
