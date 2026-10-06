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
            await post('/api/v1/tags', { name: 'Sermón', icon: 'mic', accent: '#0284c7' }).expect(
                409,
            );
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
                await post('/api/v1/tags', {
                    name: 'Trabajo',
                    icon: 'briefcase',
                    accent: '#0891b2',
                }),
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
            await put(`/api/v1/tasks/${taskId}/occurrences/${today}`, {
                status: 'completada',
            }).expect(200);

            const racha = await get('/api/v1/tasks/streak').expect(200);
            expect(body<TaskStreak>(racha).current).toBeGreaterThanOrEqual(1);
        });

        it('editar la plantilla no toca lo ya completado (D18)', async () => {
            await patch(`/api/v1/tasks/${taskId}`, {
                title: 'Preparar la predicación del domingo',
            }).expect(200);

            const rango = await get(
                `/api/v1/tasks?from=${today}&to=${today}&hideCompleted=false`,
            ).expect(200);
            const item = body<Paginated<TaskOccurrence>>(rango).items.find(
                (one) => one.taskId === taskId,
            );
            expect(item?.status).toBe('completada');
            expect(item?.title).toBe('Preparar la predicación del domingo');
        });

        it('se borra con borrado lógico: ya no se puede editar, pero lo completado sigue contando (D18)', async () => {
            await del(`/api/v1/tasks/${taskId}`).expect(200);
            await get(`/api/v1/tasks/${taskId}`).expect(404);

            const rango = await get(
                `/api/v1/tasks?from=${today}&to=${today}&hideCompleted=false`,
            ).expect(200);
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
            await put(`/api/v1/tasks/${taskId}/occurrences/${today}`, {
                status: 'completada',
            }).expect(200);

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

    describe('repetición avanzada, series y orden', () => {
        it('persiste las cinco formas, expande días seleccionados y rechaza opciones incompatibles', async () => {
            const created = body<Task>(await post('/api/v1/tasks', { title: 'Visitas semanales', date: '2026-10-06', isRecurring: true, repeatFreq: 'semanal', repeatInterval: 2, repeatOptions: { kind: 'weekdays', weekdays: [1, 3, 5] }, repeatEndType: 'cantidad', repeatEndCount: 3 }).expect(201));
            const page = body<Paginated<TaskOccurrence>>(await get('/api/v1/tasks?from=2026-10-06&to=2026-10-23&hideCompleted=false&limit=100').expect(200));
            expect(page.items.filter((row) => row.taskId === created.id).map((row) => row.date)).toEqual(['2026-10-07', '2026-10-09', '2026-10-19']);
            for (const repeatOptions of [{ kind: 'monthDay', day: 31 }, { kind: 'monthWeekday', week: -1, weekday: 0 }]) {
                const task = body<Task>(await post('/api/v1/tasks', { title: 'Mensual', date: '2026-10-06', isRecurring: true, repeatFreq: 'mensual', repeatOptions }).expect(201));
                expect(body<Task>(await get(`/api/v1/tasks/${task.id}`).expect(200)).repeatOptions).toEqual(repeatOptions);
            }
            await patch(`/api/v1/tasks/${created.id}`, { repeatFreq: 'diaria' }).expect(422);
            await post('/api/v1/tasks', { title: 'Regla inválida', date: today, isRecurring: true, repeatFreq: 'semanal', repeatOptions: { kind: 'weekdays', weekdays: [7] } }).expect(422);
            await post('/api/v1/tasks', { title: 'Sin fechas', date: today, isRecurring: true, repeatFreq: 'fechas' }).expect(422);
        });
        it('pausa y termina conservando histórico y permitiendo reabrirlo', async () => {
            const task = body<Task>(await post('/api/v1/tasks', { title: 'Serie con histórico', date: '2026-10-05', isRecurring: true, repeatFreq: 'diaria' }).expect(201));
            await put(`/api/v1/tasks/${task.id}/occurrences/2026-10-06`, { status: 'completada' }).expect(200);
            await put(`/api/v1/tasks/${task.id}/series`, { action: 'pause', date: '2026-10-06' }).expect(200);
            await put(`/api/v1/tasks/${task.id}/occurrences/2026-10-07`, { status: 'completada' }).expect(422);
            await put(`/api/v1/tasks/${task.id}/occurrences/2026-10-06`, { status: 'pendiente' }).expect(200);
            await put(`/api/v1/tasks/${task.id}/series`, { action: 'resume', date: '2026-10-08' }).expect(200);
            await put(`/api/v1/tasks/${task.id}/series`, { action: 'finish', date: '2026-10-09' }).expect(200);
            const range = body<Paginated<TaskOccurrence>>(await get('/api/v1/tasks?from=2026-10-05&to=2026-10-10&hideCompleted=false&limit=100').expect(200));
            expect(range.items.filter((row) => row.taskId === task.id).map((row) => row.date)).toEqual(['2026-10-05', '2026-10-06', '2026-10-08']);
            const templates = body<Paginated<Task>>(await get('/api/v1/tasks/templates?recurring=true&limit=100').expect(200));
            expect(templates.items.find((row) => row.id === task.id)?.repeatStoppedAt).toBe('2026-10-09');
            await put(`/api/v1/tasks/${task.id}/series`, { action: 'resume', date: '2026-10-10' }).expect(422);
        });
        it('fechas concretas y reglas editadas conservan las ocurrencias materializadas', async () => {
            const task = body<Task>(await post('/api/v1/tasks', { title: 'Fechas', date: '2026-10-05', isRecurring: true, repeatFreq: 'fechas', repeatOptions: { kind: 'dates', dates: ['2026-10-07', '2026-10-09'] } }).expect(201));
            await put(`/api/v1/tasks/${task.id}/occurrences/2026-10-07`, { status: 'completada' }).expect(200);
            await patch(`/api/v1/tasks/${task.id}`, { repeatOptions: { kind: 'dates', dates: ['2026-10-10'] } }).expect(200);
            const range = body<Paginated<TaskOccurrence>>(await get('/api/v1/tasks?from=2026-10-05&to=2026-10-10&hideCompleted=false&limit=100').expect(200));
            expect(range.items.filter((row) => row.taskId === task.id).map((row) => row.date)).toEqual(['2026-10-07', '2026-10-10']);
        });
        it('guarda el orden de forma atómica y rechaza referencias ajenas o duplicadas', async () => {
            const first = body<Task>(await post('/api/v1/tasks', { title: 'Orden A', date: today }).expect(201));
            const second = body<Task>(await post('/api/v1/tasks', { title: 'Orden B', date: today }).expect(201));
            await put('/api/v1/tasks/order', { ids: [second.id, first.id] }).expect(200);
            await patch(`/api/v1/tasks/${second.id}`, { title: 'Orden B editado' }).expect(200);
            const range = body<Paginated<TaskOccurrence>>(await get(`/api/v1/tasks?from=${today}&to=${today}&sort=manual&hideCompleted=false&limit=100`).expect(200));
            expect(range.items.slice(0, 2).map((row) => row.taskId)).toEqual([second.id, first.id]);
            await put('/api/v1/tasks/order', { ids: [first.id, '00000000-0000-4000-8000-000000000000'] }).expect(422);
            await put('/api/v1/tasks/order', { ids: [first.id, first.id] }).expect(400);
            expect(body<Task>(await get(`/api/v1/tasks/${second.id}`).expect(200)).manualOrder).toBe(0);
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

            await put(`/api/v1/habits/${habit.id}/occurrences/${today}`, {
                status: 'completada',
            }).expect(200);
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
