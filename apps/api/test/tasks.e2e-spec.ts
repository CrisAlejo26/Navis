import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type {
  Habit,
  HabitOccurrence,
  Paginated,
  Tag,
  Task,
  TaskOccurrence,
  TaskStreak,
} from '@navis/shared';
import { addDays } from '@navis/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';
import { ChurchClockService } from '../src/churches/church-clock.service';

const body = <T>(response: { body: unknown }): T => response.body as T;

/**
 * Tareas y hábitos (RFC 0018): plantilla, expansión, ocurrencias, racha y
 * etiquetas. Lo que se comprueba aquí y no con dobles es justo lo que
 * depende del motor: la expansión de una repetitiva, la materialización al
 * tocar un día (D3) y el cálculo de racha (D8, D9).
 */
describe('Tareas y hábitos (e2e)', () => {
  let app: NestExpressApplication;
  const email = `tareas-${String(Date.now())}@navis.test`;
  const password = 'Rebano2026Seguro';
  let cookie = '';
  let churchId = '';
  let today = '';

  const post = (path: string, payload: object) =>
    request(app.getHttpServer()).post(path).set('Cookie', cookie).send(payload);
  const get = (path: string) => request(app.getHttpServer()).get(path).set('Cookie', cookie);
  const patch = (path: string, payload: object) =>
    request(app.getHttpServer()).patch(path).set('Cookie', cookie).send(payload);
  const put = (path: string, payload: object) =>
    request(app.getHttpServer()).put(path).set('Cookie', cookie).send(payload);
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
      .send({ email, password, name: 'Quien organiza' })
      .expect(200);

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

    const iglesia = await post('/api/v1/churches', {
      name: `Iglesia ${String(Date.now())}`,
      city: 'Elda',
    }).expect(201);
    churchId = body<{ id: string }>(iglesia).id;

    today = await app.get(ChurchClockService).today(churchId);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('etiquetas', () => {
    let etiquetaId = '';

    it('crea una etiqueta con icono y color', async () => {
      const creada = await post('/api/v1/tags', {
        name: 'Sermón',
        icon: 'book-open',
        accent: '#2140cf',
      }).expect(201);
      const tag = body<Tag>(creada);
      etiquetaId = tag.id;
      expect(tag.name).toBe('Sermón');
      expect(tag.icon).toBe('book-open');
    });

    it('un icono fuera del catálogo se rechaza', async () => {
      await post('/api/v1/tags', {
        name: 'Rara',
        icon: 'cruz-inventada',
        accent: '#2140cf',
      }).expect(400);
    });

    it('el nombre no se repite en la misma cuenta', async () => {
      await post('/api/v1/tags', { name: 'Sermón', icon: 'mic', accent: '#0284c7' }).expect(409);
    });

    it('la lista trae la etiqueta creada', async () => {
      const lista = await get('/api/v1/tags').expect(200);
      expect(body<Tag[]>(lista).some((tag) => tag.id === etiquetaId)).toBe(true);
    });
  });

  describe('una tarea puntual', () => {
    let taskId = '';

    it('se crea con su etiqueta y su recordatorio por defecto', async () => {
      const etiqueta = body<Tag>(
        await post('/api/v1/tags', { name: 'Trabajo', icon: 'briefcase', accent: '#0891b2' }),
      );

      const creada = await post('/api/v1/tasks', {
        title: 'Preparar la predicación',
        date: today,
        time: '09:00',
        priority: 'alta',
        tagIds: [etiqueta.id],
      }).expect(201);

      const task = body<Task>(creada);
      taskId = task.id;
      expect(task.priority).toBe('alta');
      expect(task.isRecurring).toBe(false);
      expect(task.tags).toHaveLength(1);
      expect(task.reminder?.enabled).toBe(true);
      expect(task.reminder?.remindAt.startsWith(today)).toBe(true);
    });

    it('aparece hoy, expandida, con estado pendiente', async () => {
      const rango = await get(`/api/v1/tasks?from=${today}&to=${today}`).expect(200);
      const pagina = body<Paginated<TaskOccurrence>>(rango);
      expect(
        pagina.items.some((item) => item.taskId === taskId && item.status === 'pendiente'),
      ).toBe(true);
    });

    it('completarla la materializa y sube la racha de hoy', async () => {
      await put(`/api/v1/tasks/${taskId}/occurrences/${today}`, { status: 'completada' }).expect(
        200,
      );

      const racha = await get('/api/v1/tasks/streak').expect(200);
      expect(body<TaskStreak>(racha).current).toBeGreaterThanOrEqual(1);
    });

    it('editar la plantilla no toca lo ya completado (D18)', async () => {
      await patch(`/api/v1/tasks/${taskId}`, {
        title: 'Preparar la predicación del domingo',
      }).expect(200);

      const rango = await get(`/api/v1/tasks?from=${today}&to=${today}&hideCompleted=false`).expect(
        200,
      );
      const item = body<Paginated<TaskOccurrence>>(rango).items.find(
        (one) => one.taskId === taskId,
      );
      expect(item?.status).toBe('completada');
      expect(item?.title).toBe('Preparar la predicación del domingo');
    });

    it('se borra con borrado lógico: ya no se puede editar, pero lo completado sigue contando (D18)', async () => {
      await del(`/api/v1/tasks/${taskId}`).expect(200);
      await get(`/api/v1/tasks/${taskId}`).expect(404);

      const rango = await get(`/api/v1/tasks?from=${today}&to=${today}&hideCompleted=false`).expect(
        200,
      );
      const item = body<Paginated<TaskOccurrence>>(rango).items.find(
        (one) => one.taskId === taskId,
      );
      expect(item?.status).toBe('completada');
    });
  });

  describe('una tarea repetitiva', () => {
    let taskId = '';
    const mañana = () => addDays(today, 1);

    it('exige una frecuencia si es repetitiva (422)', async () => {
      await post('/api/v1/tasks', {
        title: 'Sin frecuencia',
        date: today,
        isRecurring: true,
      }).expect(422);
    });

    it('se crea diaria y se propone dos días seguidos', async () => {
      const creada = await post('/api/v1/tasks', {
        title: 'Leer un salmo',
        date: today,
        isRecurring: true,
        repeatFreq: 'diaria',
      }).expect(201);
      taskId = body<Task>(creada).id;

      const rango = await get(
        `/api/v1/tasks?from=${today}&to=${mañana()}&hideCompleted=false`,
      ).expect(200);
      const items = body<Paginated<TaskOccurrence>>(rango).items.filter(
        (one) => one.taskId === taskId,
      );
      expect(items).toHaveLength(2);
      expect(items.every((one) => one.status === 'pendiente')).toBe(true);
    });

    it('completar un día no afecta al otro (D3)', async () => {
      await put(`/api/v1/tasks/${taskId}/occurrences/${today}`, { status: 'completada' }).expect(
        200,
      );

      const rango = await get(
        `/api/v1/tasks?from=${today}&to=${mañana()}&hideCompleted=false`,
      ).expect(200);
      const items = body<Paginated<TaskOccurrence>>(rango).items.filter(
        (one) => one.taskId === taskId,
      );
      const hoy = items.find((one) => one.date === today);
      const otro = items.find((one) => one.date === mañana());
      expect(hoy?.status).toBe('completada');
      expect(otro?.status).toBe('pendiente');
    });

    it('borrarla no borra lo ya materializado, pero deja de proponer hacia adelante (D18)', async () => {
      await del(`/api/v1/tasks/${taskId}`).expect(200);
      const rango = await get(
        `/api/v1/tasks?from=${today}&to=${mañana()}&hideCompleted=false`,
      ).expect(200);
      const items = body<Paginated<TaskOccurrence>>(rango).items.filter(
        (one) => one.taskId === taskId,
      );
      // Hoy ya se completó (materializado): sigue ahí. Mañana nunca se tocó: desaparece.
      expect(items).toHaveLength(1);
      expect(items[0]?.date).toBe(today);
      expect(items[0]?.status).toBe('completada');
    });
  });

  describe('un hábito', () => {
    it('nace con dos estados y sin prioridad', async () => {
      const creado = await post('/api/v1/habits', {
        title: 'Orar',
        date: today,
        repeatFreq: 'diaria',
      }).expect(201);
      const habit = body<Habit>(creado);
      expect(habit.repeatFreq).toBe('diaria');

      const rango = await get(`/api/v1/habits?from=${today}&to=${today}`).expect(200);
      const item = body<Paginated<HabitOccurrence>>(rango).items.find(
        (one) => one.habitId === habit.id,
      );
      expect(item?.status).toBe('pendiente');

      await put(`/api/v1/habits/${habit.id}/occurrences/${today}`, { status: 'completada' }).expect(
        200,
      );
    });

    it('un hábito nunca aparece en el cálculo de la racha de tareas', async () => {
      const antes = body<TaskStreak>(await get('/api/v1/tasks/streak'));
      await post('/api/v1/habits', {
        title: 'Otro hábito',
        date: today,
        repeatFreq: 'ninguna',
      }).expect(201);
      const despues = body<TaskStreak>(await get('/api/v1/tasks/streak'));
      expect(despues.current).toBe(antes.current);
    });
  });

  it('sin sesión, nada responde (guard global)', async () => {
    await request(app.getHttpServer()).get('/api/v1/tasks').expect(401);
  });
});
