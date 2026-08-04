import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Calendar, CalendarRange, Congregation, Meeting, MeetingPattern } from '@navis/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';

const body = <T>(response: { body: unknown }): T => response.body as T;

/**
 * El recorrido real de quien programa: crea su iglesia, una sede más, una
 * reunión fija, una persona, y la pone en una fase.
 *
 * Lo que se comprueba de verdad aquí es lo que no se puede comprobar con
 * dobles: que el patrón se expande sobre el mes sin crear filas, que asignar
 * materializa la reunión **una sola vez**, y que dos sedes conviven el mismo
 * día (RFC 0002).
 */
describe('Calendario (e2e)', () => {
  let app: NestExpressApplication;
  const email = `calendario-${String(Date.now())}@navis.test`;
  const password = 'Rebano2026Seguro';
  let cookie = '';
  let elda = '';
  let calendarId = '';
  let patternId = '';
  let believerId = '';

  /** Un viernes con sus siguientes: el 7 de agosto de 2026 lo es. */
  const viernes = '2026-08-07';
  const rango = { from: '2026-08-01', to: '2026-08-31' };

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
      .send({ email, password, name: 'Quien programa' })
      .expect(200);

    /*
     * Quien se registra nace `creyente` y no llega al panel. Se le sube el rol
     * en la base y se vuelve a entrar: la sesión de Better Auth se cachea en
     * cookie cinco minutos, así que sin un login nuevo el guard seguiría
     * viendo el rol viejo (RFC 0008, §Riesgos).
     */
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

    await request(app.getHttpServer())
      .post('/api/v1/churches')
      .set('Cookie', cookie)
      .send({ name: `Iglesia ${String(Date.now())}`, city: 'Elda' })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('cada iglesia nace con sus cuatro calendarios', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/v1/calendars')
      .set('Cookie', cookie)
      .expect(200);

    const calendarios = body<Calendar[]>(respuesta);
    expect(calendarios.map((one) => one.slug)).toEqual([
      'pulpito',
      'recepcion',
      'sonido',
      'biblias',
    ]);

    calendarId = calendarios[0]?.id ?? '';
    expect(calendarios[0]?.ministry).toBe('pulpito');
  });

  it('cada iglesia nace con una sede, y se puede añadir otra', async () => {
    const inicial = await request(app.getHttpServer())
      .get('/api/v1/congregations')
      .set('Cookie', cookie)
      .expect(200);

    expect(body<Congregation[]>(inicial)).toHaveLength(1);

    const creada = await request(app.getHttpServer())
      .post('/api/v1/congregations')
      .set('Cookie', cookie)
      .send({ name: 'Elda' })
      .expect(201);

    elda = body<Congregation>(creada).id;
    expect(body<Congregation>(creada).accent).not.toBe(body<Congregation[]>(inicial)[0]?.accent);
  });

  it('cada sede nace con la semana de serie, y el mes se llena solo', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/api/v1/calendars/${calendarId}/patterns`)
      .set('Cookie', cookie)
      .expect(200);

    const semana = body<MeetingPattern[]>(respuesta).filter((one) => one.congregationId === elda);

    expect(semana).toHaveLength(7);
    expect(semana.find((one) => one.weekday === 3)?.name).toBe('Enseñanza');
    expect(semana.find((one) => one.weekday === 0)?.startTime.slice(0, 5)).toBe('10:00');
    expect(semana.find((one) => one.weekday === 6)?.startTime.slice(0, 5)).toBe('18:00');
    // El púlpito reparte los tramos de la reunión y, todos los días, quién
    // queda encargado y quién abre la iglesia.
    expect(semana.find((one) => one.weekday === 3)?.phases.map((phase) => phase.name)).toEqual([
      'Introducción',
      'Predicación',
      'Testimonios',
      'Encargado',
      'Abre iglesia',
    ]);

    // El viernes de Elda sale del patrón, sin crear una sola fila.
    patternId = semana.find((one) => one.weekday === 5)?.id ?? '';

    const calendario = await request(app.getHttpServer())
      .get(`/api/v1/calendars/${calendarId}/schedule?from=${viernes}&to=${viernes}`)
      .set('Cookie', cookie)
      .expect(200);

    const propuestas = body<CalendarRange>(calendario).days[0]?.meetings ?? [];
    expect(propuestas.some((meeting) => meeting.patternId === patternId)).toBe(true);
    expect(propuestas.every((meeting) => meeting.id === null)).toBe(true);
  });

  it('asignar a alguien materializa la reunión, y repetirlo no la duplica', async () => {
    const persona = await request(app.getHttpServer())
      .post('/api/v1/believers')
      .set('Cookie', cookie)
      .send({ firstName: 'Luis Fernando', lastName: 'Ruiz', ministries: ['pulpito'] })
      .expect(201);

    believerId = body<{ id: string }>(persona).id;

    const asignar = () =>
      request(app.getHttpServer())
        .put(`/api/v1/calendars/${calendarId}/slots`)
        .set('Cookie', cookie)
        .send({ date: viernes, patternId, position: 1, believerId })
        .expect(200);

    const primera = await asignar();
    const segunda = await asignar();

    expect(body<Meeting>(primera).id).toBe(body<Meeting>(segunda).id);
    expect(body<Meeting>(segunda).slots[1]?.believer?.name).toBe('Luis Fernando Ruiz');

    const calendario = await request(app.getHttpServer())
      .get(`/api/v1/calendars/${calendarId}/schedule?from=${viernes}&to=${viernes}`)
      .set('Cookie', cookie)
      .expect(200);

    const delDia = body<CalendarRange>(calendario).days[0]?.meetings ?? [];
    const materializada = delDia.filter((meeting) => meeting.patternId === patternId);
    expect(materializada).toHaveLength(1);
    expect(materializada[0]?.id).not.toBeNull();
  });

  it('el mismo día admite la programación de otra sede', async () => {
    const congregaciones = await request(app.getHttpServer())
      .get('/api/v1/congregations')
      .set('Cookie', cookie)
      .expect(200);

    const otra = body<Congregation[]>(congregaciones).find((one) => one.id !== elda);

    await request(app.getHttpServer())
      .post(`/api/v1/calendars/${calendarId}/meetings`)
      .set('Cookie', cookie)
      .send({
        congregationId: otra?.id,
        date: viernes,
        startTime: '22:00',
        name: 'Vigilia',
        phases: [{ name: 'Introducción' }],
      })
      .expect(201);

    const calendario = await request(app.getHttpServer())
      .get(`/api/v1/calendars/${calendarId}/schedule?from=${viernes}&to=${viernes}`)
      .set('Cookie', cookie)
      .expect(200);

    const delDia = body<CalendarRange>(calendario).days[0]?.meetings ?? [];
    const deLaOtra = delDia.filter((meeting) => meeting.congregationId === otra?.id);
    expect(deLaOtra.some((meeting) => meeting.name === 'Vigilia')).toBe(true);
    // Y la de Elda sigue ahí: dos sedes conviven el mismo día.
    expect(delDia.some((meeting) => meeting.congregationId === elda)).toBe(true);
  });

  it('el resumen cuenta el reparto y avisa de lo que falta', async () => {
    const resumen = await request(app.getHttpServer())
      .get(`/api/v1/calendars/${calendarId}/summary?from=${rango.from}&to=${rango.to}`)
      .set('Cookie', cookie)
      .expect(200);

    const datos = body<{
      people: { believerId: string; times: number }[];
      warnings: { kind: string }[];
    }>(resumen);

    expect(datos.people.find((one) => one.believerId === believerId)?.times).toBe(1);
    expect(datos.warnings.some((warning) => warning.kind === 'unassigned')).toBe(true);
  });

  it('rechaza un rango de más de 92 días', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/calendars/${calendarId}/schedule?from=2026-01-01&to=2026-12-31`)
      .set('Cookie', cookie)
      .expect(400);
  });
});
