import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  ChannelDetail,
  ChannelListItem,
  ChatContact,
  Message,
  MessagesPage,
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
 * El chat de Comunicaciones (RFC 0016): dos cuentas de la misma iglesia se
 * escriben por REST, una tercera de otra iglesia no llega ni a verlo (alcance,
 * RFC 0008 §6.2), y un adjunto se sube y se descarga. Necesita Postgres
 * arrancado y migrado.
 */
describe('Comunicaciones: chat (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  const stamp = Date.now();
  const password = 'Rebano2026Seguro';

  const signIn = async (email: string): Promise<string> => {
    const entrada = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email, password })
      .expect(200);

    const setCookie = entrada.headers['set-cookie'];
    return (Array.isArray(setCookie) ? setCookie : [setCookie]).join('; ');
  };

  /** Registra una cuenta y la eleva por SQL, como `access.e2e-spec.ts`. */
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

    return signIn(email);
  };

  const as = (cookie: string) => ({
    post: (path: string, payload: object = {}) =>
      request(app.getHttpServer()).post(path).set('Cookie', cookie).send(payload),
    get: (path: string) => request(app.getHttpServer()).get(path).set('Cookie', cookie),
    delete: (path: string) => request(app.getHttpServer()).delete(path).set('Cookie', cookie),
  });

  let pastorCookie = '';
  let sonidoCookie = '';
  let ajenaCookie = '';
  let sonidoId = '';
  let channelId = '';
  let messageId = '';

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

    pastorCookie = await registerWithRole(`pastor-chat-${String(stamp)}@navis.test`, 'pastor');
    await as(pastorCookie)
      .post('/api/v1/churches', { name: `Iglesia Chat ${String(stamp)}`, city: 'Elda' })
      .expect(201);

    const sonidoEmail = `sonido-chat-${String(stamp)}@navis.test`;
    await as(pastorCookie)
      .post('/api/v1/admin/users', { name: 'Sonido', email: sonidoEmail, password, role: 'sonido' })
      .expect(201);
    sonidoCookie = await signIn(sonidoEmail);

    // Una cuenta de otra iglesia, para el alcance (RFC 0008 §6.2).
    ajenaCookie = await registerWithRole(
      `pastor-otra-iglesia-${String(stamp)}@navis.test`,
      'pastor',
    );
    await as(ajenaCookie)
      .post('/api/v1/churches', { name: `Otra iglesia ${String(stamp)}`, city: 'Alicante' })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('el rol sonido aparece en el buscador de contactos del pastor (§2)', async () => {
    const response = await as(pastorCookie).get('/api/v1/channels/contacts');
    expect(response.status).toBe(200);

    const contactos = body<ChatContact[]>(response);
    const sonido = contactos.find((one) => one.email.startsWith('sonido-chat-'));
    expect(sonido).toBeDefined();
    sonidoId = sonido?.id ?? '';
  });

  it('crea una conversación individual', async () => {
    const response = await as(pastorCookie).post('/api/v1/channels', {
      kind: 'individual',
      memberIds: [sonidoId],
    });

    expect(response.status).toBe(201);
    const canal = body<ChannelDetail>(response);
    expect(canal.kind).toBe('individual');
    expect(canal.members).toHaveLength(2);
    channelId = canal.id;
  });

  it('reabre la misma conversación en vez de crear una segunda (evita duplicados)', async () => {
    const response = await as(pastorCookie).post('/api/v1/channels', {
      kind: 'individual',
      memberIds: [sonidoId],
    });

    expect(body<ChannelDetail>(response).id).toBe(channelId);
  });

  it('las dos cuentas se escriben por REST y el historial se pagina por cursor', async () => {
    const primero = await as(pastorCookie).post(`/api/v1/channels/${channelId}/messages`, {
      body: '¿Confirmamos el ensayo del jueves?',
    });
    expect(primero.status).toBe(201);
    messageId = body<Message>(primero).id;

    const respuesta = await as(sonidoCookie).post(`/api/v1/channels/${channelId}/messages`, {
      body: 'Sí, a las siete',
      replyToId: messageId,
    });
    expect(respuesta.status).toBe(201);
    expect(body<Message>(respuesta).replyTo?.id).toBe(messageId);

    const historial = await as(pastorCookie).get(`/api/v1/channels/${channelId}/messages`);
    expect(historial.status).toBe(200);
    const pagina = body<MessagesPage>(historial);
    expect(pagina.items.map((one) => one.body)).toEqual([
      '¿Confirmamos el ensayo del jueves?',
      'Sí, a las siete',
    ]);
  });

  it('los no leídos suben para quien no ha escrito, y bajan al marcar como leído', async () => {
    const antes = body<ChannelListItem[]>(await as(pastorCookie).get('/api/v1/channels'));
    expect(antes.find((one) => one.id === channelId)?.unreadCount).toBe(1);

    await as(pastorCookie).post(`/api/v1/channels/${channelId}/read`).expect(201);

    const despues = body<ChannelListItem[]>(await as(pastorCookie).get('/api/v1/channels'));
    expect(despues.find((one) => one.id === channelId)?.unreadCount).toBe(0);
  });

  it('reaccionar y borrar: el mensaje borrado deja «Mensaje eliminado» sin desaparecer', async () => {
    await as(sonidoCookie)
      .post(`/api/v1/messages/${messageId}/reactions`, { emoji: '👍' })
      .expect(201);

    await as(pastorCookie).delete(`/api/v1/messages/${messageId}`).expect(200);

    const historial = body<MessagesPage>(
      await as(pastorCookie).get(`/api/v1/channels/${channelId}/messages`),
    );
    const borrado = historial.items.find((one) => one.id === messageId);
    expect(borrado?.body).toBeNull();
    expect(borrado?.deletedAt).not.toBeNull();
  });

  it('un canal de aviso solo lo escribe quien modera', async () => {
    const aviso = await as(pastorCookie).post('/api/v1/channels', {
      kind: 'aviso',
      memberIds: [sonidoId],
      name: 'Avisos de la semana',
    });
    expect(aviso.status).toBe(201);
    const canal = body<ChannelDetail>(aviso).id;

    const rechazado = await as(sonidoCookie).post(`/api/v1/channels/${canal}/messages`, {
      body: 'Intento escribir aquí',
    });
    expect(rechazado.status).toBe(403);

    const aceptado = await as(pastorCookie).post(`/api/v1/channels/${canal}/messages`, {
      body: 'El ensayo se mueve al jueves',
    });
    expect(aceptado.status).toBe(201);
  });

  it('sube un adjunto y lo descarga con su nombre original', async () => {
    const subida = await request(app.getHttpServer())
      .post(`/api/v1/channels/${channelId}/attachments`)
      .set('Cookie', sonidoCookie)
      .field('body', 'El acta de la reunión')
      .attach('file', Buffer.from('contenido del acta'), {
        filename: 'acta reunión.txt',
        contentType: 'text/plain',
      });

    expect(subida.status).toBe(201);
    const mensaje = body<Message>(subida);
    expect(mensaje.attachments).toHaveLength(1);
    expect(mensaje.attachments[0]?.originalName).toBe('acta reunión.txt');
    expect(mensaje.attachments[0]?.kind).toBe('archivo');

    const descarga = await as(pastorCookie).get(
      `/api/v1/attachments/${mensaje.attachments[0]?.id}`,
    );
    expect(descarga.status).toBe(200);
    expect(descarga.text).toBe('contenido del acta');
  });

  it('un tercero de otra iglesia no llega a ver el canal ni sus mensajes (RFC 0008 §6.2)', async () => {
    expect((await as(ajenaCookie).get(`/api/v1/channels/${channelId}`)).status).toBe(404);
    expect((await as(ajenaCookie).get(`/api/v1/channels/${channelId}/messages`)).status).toBe(404);
    expect(
      (await as(ajenaCookie).post(`/api/v1/channels/${channelId}/messages`, { body: 'Intruso' }))
        .status,
    ).toBe(404);

    // Ni siquiera aparece en su bandeja.
    const suyos = body<ChannelListItem[]>(await as(ajenaCookie).get('/api/v1/channels'));
    expect(suyos.map((one) => one.id)).not.toContain(channelId);
  });

  it('sin sesión no se llega a nada', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/channels')).status).toBe(401);
  });
});
