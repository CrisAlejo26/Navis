import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type {
    RunningTimer,
    RunningTimerState,
    Task,
    TaskTime,
    TaskTimeEntry as TimeEntryView,
    TaskTimeSummary,
    WorkflowWithCount,
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
import { TaskTimeEntry } from '../src/tasks/task-time-entry.entity';

const body = <T>(response: { body: unknown }): T => response.body as T;

/**
 * El cronómetro de las tareas (Fase 7c): un solo cronómetro en marcha por
 * persona, entradas que sobreviven a borrar la tarea y un resumen por tarea y
 * por flujo. Las horas se fijan a mano en la base: el cronómetro real mide
 * milisegundos y un resumen de «0 s» no demostraría nada.
 */
describe('Seguimiento de tiempo (e2e)', () => {
    let app: NestExpressApplication;
    let dataSource: DataSource;
    const email = `tiempo-${String(Date.now())}@navis.test`;
    const password = 'Rebano2026Seguro';
    let cookie = '';
    let today = '';

    const post = (path: string, payload: object = {}) =>
        request(app.getHttpServer()).post(path).set('Cookie', cookie).send(payload);
    const get = (path: string) => request(app.getHttpServer()).get(path).set('Cookie', cookie);
    const del = (path: string) => request(app.getHttpServer()).delete(path).set('Cookie', cookie);

    const newTask = async (title: string, workflowId?: string) =>
        body<Task>(await post('/api/v1/tasks', { title, date: today, workflowId }).expect(201));
    const setTimes = (id: string, startedAt: string, endedAt: string | null) =>
        dataSource.getRepository(TaskTimeEntry).update(id, {
            startedAt: new Date(startedAt),
            endedAt: endedAt ? new Date(endedAt) : null,
        });

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
            .send({ email, password, name: 'Quien trabaja' })
            .expect(200);
        dataSource = app.get(DataSource);
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
        today = await app.get(ChurchClockService).today(body<{ id: string }>(iglesia).id);
    });

    afterAll(async () => {
        await app.close();
    });

    it('sin cronómetro en marcha no hay nada que parar', async () => {
        expect(
            body<RunningTimerState>(await get('/api/v1/tasks/time/running').expect(200)).timer,
        ).toBeNull();
        await post('/api/v1/tasks/time/stop').expect(404);
    });

    it('empieza, se ve en marcha y al parar queda cerrado', async () => {
        const task = await newTask('Preparar sermón');
        const started = body<RunningTimer>(
            await post(`/api/v1/tasks/${task.id}/time/start`).expect(201),
        );
        expect(started.entry.endedAt).toBeNull();
        expect(started.task).toEqual({ id: task.id, title: 'Preparar sermón' });
        const running = body<RunningTimerState>(
            await get('/api/v1/tasks/time/running').expect(200),
        ).timer;
        expect(running?.entry.id).toBe(started.entry.id);
        const stopped = body<TimeEntryView>(await post('/api/v1/tasks/time/stop').expect(201));
        expect(stopped.id).toBe(started.entry.id);
        expect(stopped.endedAt).not.toBeNull();
        expect(
            body<RunningTimerState>(await get('/api/v1/tasks/time/running').expect(200)).timer,
        ).toBeNull();
    });

    it('empezar la misma tarea dos veces no parte la entrada', async () => {
        const task = await newTask('Doble toque');
        const first = body<RunningTimer>(
            await post(`/api/v1/tasks/${task.id}/time/start`).expect(201),
        );
        const second = body<RunningTimer>(
            await post(`/api/v1/tasks/${task.id}/time/start`).expect(201),
        );
        expect(second.entry.id).toBe(first.entry.id);
        await post('/api/v1/tasks/time/stop').expect(201);
        const time = body<TaskTime>(await get(`/api/v1/tasks/${task.id}/time`).expect(200));
        expect(time.entries).toHaveLength(1);
    });

    it('empezar otra tarea detiene la anterior: solo hay un cronómetro en marcha', async () => {
        const one = await newTask('Una');
        const two = await newTask('Dos');
        const first = body<RunningTimer>(
            await post(`/api/v1/tasks/${one.id}/time/start`).expect(201),
        );
        await post(`/api/v1/tasks/${two.id}/time/start`).expect(201);
        const running = body<RunningTimerState>(
            await get('/api/v1/tasks/time/running').expect(200),
        ).timer;
        expect(running?.task.id).toBe(two.id);
        const closed = body<TaskTime>(await get(`/api/v1/tasks/${one.id}/time`).expect(200));
        expect(closed.entries.find((entry) => entry.id === first.entry.id)?.endedAt).not.toBeNull();
        await post('/api/v1/tasks/time/stop').expect(201);
    });

    it('no se puede cronometrar una tarea que no existe', async () => {
        await post('/api/v1/tasks/00000000-0000-4000-8000-000000000000/time/start').expect(404);
        await get('/api/v1/tasks/00000000-0000-4000-8000-000000000000/time').expect(404);
    });

    it('el resumen suma por tarea y por flujo, y deja aparte la tarea sin flujo', async () => {
        const flow = body<WorkflowWithCount>(
            await post('/api/v1/workflows', {
                name: `Tiempo ${String(Date.now())}`,
                accent: '#2140cf',
            }).expect(201),
        );
        const inFlow = await newTask('Con flujo', flow.id);
        const loose = await newTask('Sin flujo');
        const day = addDays(today, -1);
        for (const [task, minutes] of [
            [inFlow, 60],
            [inFlow, 30],
            [loose, 10],
        ] as const) {
            const started = body<RunningTimer>(
                await post(`/api/v1/tasks/${task.id}/time/start`).expect(201),
            );
            await post('/api/v1/tasks/time/stop').expect(201);
            const start = `${day}T12:00:00.000Z`;
            await setTimes(
                started.entry.id,
                start,
                new Date(Date.parse(start) + minutes * 60_000).toISOString(),
            );
        }
        const summary = body<TaskTimeSummary>(
            await get(`/api/v1/tasks/time/summary?from=${day}&to=${day}`).expect(200),
        );
        expect(summary.byTask.find((row) => row.taskId === inFlow.id)?.seconds).toBe(5400);
        expect(summary.byTask.find((row) => row.taskId === loose.id)?.seconds).toBe(600);
        expect(summary.byWorkflow.find((row) => row.workflowId === flow.id)?.seconds).toBe(5400);
        expect(
            summary.byWorkflow.find((row) => row.workflowId === null)?.seconds,
        ).toBeGreaterThanOrEqual(600);
        expect(summary.totalSeconds).toBeGreaterThanOrEqual(6000);
    });

    it('el cronómetro en marcha no cuenta y lo de otro día queda fuera', async () => {
        const task = await newTask('Fuera de rango');
        const started = body<RunningTimer>(
            await post(`/api/v1/tasks/${task.id}/time/start`).expect(201),
        );
        const old = addDays(today, -20);
        await setTimes(started.entry.id, `${old}T10:00:00.000Z`, null);
        const open = body<TaskTimeSummary>(
            await get(`/api/v1/tasks/time/summary?from=${old}&to=${old}`).expect(200),
        );
        expect(open.byTask.find((row) => row.taskId === task.id)).toBeUndefined();
        await post('/api/v1/tasks/time/stop').expect(201);
        const elsewhere = body<TaskTimeSummary>(
            await get(`/api/v1/tasks/time/summary?from=${today}&to=${today}`).expect(200),
        );
        expect(elsewhere.byTask.find((row) => row.taskId === task.id)).toBeUndefined();
    });

    it('borrar la tarea conserva su tiempo en el resumen, y se puede borrar una entrada', async () => {
        const task = await newTask('Se borra');
        const started = body<RunningTimer>(
            await post(`/api/v1/tasks/${task.id}/time/start`).expect(201),
        );
        await post('/api/v1/tasks/time/stop').expect(201);
        const day = addDays(today, -2);
        await setTimes(started.entry.id, `${day}T08:00:00.000Z`, `${day}T08:20:00.000Z`);
        await del(`/api/v1/tasks/${task.id}`).expect(200);
        const summary = body<TaskTimeSummary>(
            await get(`/api/v1/tasks/time/summary?from=${day}&to=${day}`).expect(200),
        );
        expect(summary.byTask.find((row) => row.taskId === task.id)?.seconds).toBe(1200);
        await del(`/api/v1/tasks/time/entries/${started.entry.id}`).expect(200);
        const after = body<TaskTimeSummary>(
            await get(`/api/v1/tasks/time/summary?from=${day}&to=${day}`).expect(200),
        );
        expect(after.byTask.find((row) => row.taskId === task.id)).toBeUndefined();
        await del(`/api/v1/tasks/time/entries/${started.entry.id}`).expect(404);
    });

    it('rechaza un rango del revés o demasiado largo', async () => {
        await get(`/api/v1/tasks/time/summary?from=${today}&to=${addDays(today, -1)}`).expect(400);
        await get(`/api/v1/tasks/time/summary?from=${addDays(today, -400)}&to=${today}`).expect(
            400,
        );
        await get('/api/v1/tasks/time/summary?from=ayer&to=hoy').expect(400);
    });

    it('sin sesión nada responde', async () => {
        await request(app.getHttpServer()).get('/api/v1/tasks/time/running').expect(401);
        await request(app.getHttpServer()).post('/api/v1/tasks/time/stop').expect(401);
    });
});
