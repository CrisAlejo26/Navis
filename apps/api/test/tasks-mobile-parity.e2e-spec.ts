import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
    createTaskSchema,
    createHabitSchema,
    createTagSchema,
    type TaskStats,
    type HabitStats,
} from '@navis/shared';
import { ChurchClockService } from '../src/churches/church-clock.service';
import { taskParityApp } from './task-parity-app';

const fixture = z
    .object({
        today: z.string(),
        from: z.string(),
        to: z.string(),
        tag: createTagSchema,
        tasks: z.array(
            createTaskSchema.extend({
                completed: z.array(z.string()),
                inProgress: z.array(z.string()),
                deleted: z.boolean(),
            }),
        ),
        habits: z.array(
            createHabitSchema.extend({ completed: z.array(z.string()), deleted: z.boolean() }),
        ),
    })
    .parse(
        JSON.parse(readFileSync(resolve('../../docs/qa/tareas-movil/paridad-fase4.json'), 'utf8')),
    );

describe('paridad de estadísticas con el repositorio móvil', () => {
    let connection: Awaited<ReturnType<typeof taskParityApp>>;
    const call = (method: 'post' | 'put' | 'get' | 'delete', path: string) =>
        request(connection.app.getHttpServer())
            [method](`/api/v1/${path}`)
            .set('Cookie', connection.cookie);
    beforeAll(async () => {
        connection = await taskParityApp();
        vi.spyOn(connection.app.get(ChurchClockService), 'today').mockResolvedValue(fixture.today);
    });
    afterAll(async () => {
        await connection?.app.close();
    });
    it('produce las mismas cifras, etiquetas, tendencias y 90 días de Faro en SQLite y PostgreSQL', async () => {
        const tag = await call('post', 'tags').send(fixture.tag).expect(201);
        const tagId = (tag.body as { id: string }).id;
        for (const row of fixture.tasks) {
            const response = await call('post', 'tasks')
                .send(createTaskSchema.parse({ ...row, tagIds: [tagId], reminderEnabled: false }))
                .expect(201);
            const id = (response.body as { id: string }).id;
            for (const date of row.completed)
                await call('put', `tasks/${id}/occurrences/${date}`)
                    .send({ status: 'completada' })
                    .expect(200);
            for (const date of row.inProgress)
                await call('put', `tasks/${id}/occurrences/${date}`)
                    .send({ status: 'en_progreso' })
                    .expect(200);
            if (row.deleted) await call('delete', `tasks/${id}`).expect(200);
        }
        for (const row of fixture.habits) {
            const response = await call('post', 'habits')
                .send(createHabitSchema.parse({ ...row, tagIds: [tagId], reminderEnabled: false }))
                .expect(201);
            const id = (response.body as { id: string }).id;
            for (const date of row.completed)
                await call('put', `habits/${id}/occurrences/${date}`)
                    .send({ status: 'completada' })
                    .expect(200);
            if (row.deleted) await call('delete', `habits/${id}`).expect(200);
        }
        const tasks = (
            await call('get', `tasks/stats?from=${fixture.from}&to=${fixture.to}`).expect(200)
        ).body as TaskStats;
        const habits = (
            await call('get', `habits/stats?from=${fixture.from}&to=${fixture.to}`).expect(200)
        ).body as HabitStats;
        expect(tasks.byWeek).toEqual([
            { week: '2026-09-28', completed: 3, pending: 0 },
            { week: '2026-10-05', completed: 0, pending: 4 },
        ]);
        expect(tasks.currentStreak).toBe(3);
        expect(habits.byWeek).toEqual([
            { week: '2026-09-28', completed: 1, pending: 3 },
            { week: '2026-10-05', completed: 2, pending: 2 },
        ]);
        {
            const normalize = <T extends { byTag: { tagId: string }[] }>(stats: T) => ({
                ...stats,
                byTag: stats.byTag.map((bucket) => ({ ...bucket, tagId: 'tag' })),
            });
            const mobile: unknown = JSON.parse(
                readFileSync(
                    process.env.NAVIS_MOBILE_PARITY_INPUT ??
                        resolve('../../docs/qa/tareas-movil/paridad-fase4-esperada.json'),
                    'utf8',
                ),
            );
            expect({ tasks: normalize(tasks), habits: normalize(habits) }).toEqual(mobile);
        }
    });
});
