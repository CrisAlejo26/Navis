// Primero el soporte: registra los mocks de expo-crypto/expo-secure-store
// antes de que carguen los módulos que los usan.
import { setupLocalDb } from '@/data/test-support';
import { addDays, startOfWeek } from '@navis/shared';
import { setDbForTests } from '@/data/db';
import { createChurch } from '@/data/repos/church-repo';
import { localDashboardRepository, todayIso } from '@/data/repos/dashboard-repo';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

describe('el panel de inicio en local', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;
    let churchId: string;
    const ownerId = 'usuario-local';

    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
        const church = await createChurch({
            name: 'Iglesia del Sur',
            city: 'Elda',
            ownerId,
        });
        churchId = church.id;
    });

    beforeEach(() => {
        // Se conserva la iglesia; se limpia lo que siembran los casos.
        db.memory.exec(
            'DELETE FROM believer_notes; DELETE FROM believers; DELETE FROM meetings; DELETE FROM task_occurrences; DELETE FROM task_tags; DELETE FROM tasks; DELETE FROM tags; DELETE FROM believer_ministries; DELETE FROM ministries; DELETE FROM believer_gifts; DELETE FROM gifts;',
        );
    });

    afterAll(() => {
        db.close();
    });

    async function insertBeliever(values: {
        id: string;
        firstName: string;
        lastName?: string;
        status?: string;
        createdDaysAgo?: number;
        lastNoteAt?: string | null;
        alertAfterDays?: number | null;
        congregationId?: string | null;
    }): Promise<void> {
        const today = new Date();
        const createdAt = new Date(
            today.getTime() - (values.createdDaysAgo ?? 0) * 24 * 60 * 60 * 1000,
        ).toISOString();
        await db.adapter.runAsync(
            `INSERT INTO believers (id, created_at, updated_at, deleted_at, church_id, congregation_id, first_name, last_name, status, alert_after_days, last_note_at)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
            values.id,
            createdAt,
            createdAt,
            churchId,
            values.congregationId ?? null,
            values.firstName,
            values.lastName ?? '',
            values.status ?? 'activo',
            values.alertAfterDays === undefined ? 30 : values.alertAfterDays,
            values.lastNoteAt ?? null,
        );
    }

    async function insertNote(values: {
        id: string;
        believerId: string;
        told: string;
        occurredAt: string;
    }): Promise<void> {
        await db.adapter.runAsync(
            `INSERT INTO believer_notes (id, created_at, updated_at, deleted_at, church_id, believer_id, kind, occurred_at, told)
       VALUES (?, ?, ?, NULL, ?, ?, 'visita', ?, ?)`,
            values.id,
            new Date().toISOString(),
            new Date().toISOString(),
            churchId,
            values.believerId,
            values.occurredAt,
            values.told,
        );
    }

    it('calcula el total, los nuevos del mes y quién pide atención', async () => {
        await insertBeliever({ id: 'b-viejo', firstName: 'Juan', createdDaysAgo: 400 });
        // Su nota es de hoy: no pide atención aunque lleve siglos en la iglesia.
        db.memory.exec("UPDATE believers SET last_note_at = date('now') WHERE id = 'b-viejo'");
        await insertBeliever({
            id: 'b-nuevo',
            firstName: 'María',
            createdDaysAgo: 3,
            alertAfterDays: null,
        });
        // Sin nota hace 40 días con aviso a 30: pide atención.
        await insertBeliever({
            id: 'b-olvidado',
            firstName: 'Pedro',
            createdDaysAgo: 100,
            lastNoteAt: null,
        });
        db.memory.exec(
            "UPDATE believers SET last_note_at = date('now', '-40 days') WHERE id = 'b-olvidado'",
        );

        const summary = await localDashboardRepository.summary(churchId, ownerId);
        const today = todayIso();

        expect(summary.believers.total).toBe(3);
        expect(summary.believers.newThisMonth).toBeGreaterThanOrEqual(1);
        expect(summary.attention.count).toBe(1);
        expect(summary.attention.people[0]).toMatchObject({ id: 'b-olvidado', hasPhoto: false });
        expect(summary.attention.people[0].daysWithoutNote).toBeGreaterThan(30);

        // La semana de hoy no puede aparecer vacía del todo: el conteo semanal
        // cubre seis semanas con ceros donde no hubo notas.
        expect(summary.weeklyActivity).toHaveLength(6);
        expect(summary.weeklyActivity[5].week).toBe(startOfWeek(today));
    });

    it('trae las últimas notas con su excerpt y el nombre del hermano', async () => {
        await insertBeliever({ id: 'b-ana', firstName: 'Ana', lastName: 'Ruiz' });
        await insertNote({
            id: 'n-1',
            believerId: 'b-ana',
            told: 'x'.repeat(200),
            occurredAt: '2026-08-01',
        });
        await insertNote({
            id: 'n-2',
            believerId: 'b-ana',
            told: 'Corta',
            occurredAt: '2026-08-05',
        });

        const summary = await localDashboardRepository.summary(churchId, ownerId);

        expect(summary.recentNotes).toHaveLength(2);
        expect(summary.recentNotes[0].id).toBe('n-2');
        expect(summary.recentNotes[0].believerName).toBe('Ana Ruiz');
        // 140 caracteres recortados más el punto final, como en la API.
        expect(summary.recentNotes[1].excerpt).toHaveLength(141);
    });

    it('una iglesia recién creada ya propone su próximo culto en la portada, sin que nadie lo haya tocado (regresión: leer solo lo materializado la dejaba vacía)', async () => {
        const summary = await localDashboardRepository.summary(churchId, ownerId);

        // El patrón de púlpito de serie cubre los siete días de la semana
        // (`DEFAULT_WEEK`), así que la ventana de 30 días tiene que proponer algo
        // aunque nadie haya asignado ni creado una sola reunión a mano.
        expect(summary.upcomingEvents.length).toBeGreaterThan(0);
        // Propuesta, no materializada: sin fila propia todavía (D3).
        expect(summary.upcomingEvents[0]?.meetingId).toBeNull();
    });

    it('lista las reuniones programadas de la ventana y salta las canceladas', async () => {
        const today = todayIso();
        const congregation = await db.adapter.getFirstAsync<{ id: string }>(
            'SELECT id FROM congregations WHERE church_id = ?',
            churchId,
        );
        if (!congregation) throw new Error('la iglesia de prueba no tiene sede');
        const calendar = await db.adapter.getFirstAsync<{ id: string }>(
            "SELECT id FROM calendars WHERE church_id = ? AND slug = 'pulpito'",
            churchId,
        );
        if (!calendar) throw new Error('la iglesia de prueba no tiene calendario de púlpito');
        // Se apaga el patrón sembrado de serie: esta prueba mira lo materializado
        // y lo cancelado, no la expansión de propuestas (ya probada arriba).
        await db.adapter.runAsync(
            'UPDATE meeting_patterns SET is_active = 0 WHERE calendar_id = ?',
            calendar.id,
        );
        const seed = [
            {
                id: 'm-1',
                date: today,
                startTime: '10:00',
                name: 'Culto mañana',
                status: 'programada',
            },
            {
                id: 'm-2',
                date: today,
                startTime: '20:00',
                name: 'Culto noche',
                status: 'cancelada',
            },
        ];
        for (const one of seed) {
            await db.adapter.runAsync(
                `INSERT INTO meetings (id, created_at, updated_at, deleted_at, church_id, calendar_id, congregation_id, pattern_id, date, start_time, name, accent, status, notes)
         VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, ?, ?, ?, 'primary', ?, NULL)`,
                one.id,
                new Date().toISOString(),
                new Date().toISOString(),
                churchId,
                calendar.id,
                congregation.id,
                one.date,
                one.startTime,
                one.name,
                one.status,
            );
        }

        const summary = await localDashboardRepository.summary(churchId, ownerId);

        expect(summary.upcomingEvents).toHaveLength(1);
        expect(summary.upcomingEvents[0]).toMatchObject({ name: 'Culto mañana' });
    });

    it('cuenta las tareas de hoy y la racha de días completados', async () => {
        const today = todayIso();
        const addTask = async (id: string, date: string) => {
            await db.adapter.runAsync(
                `INSERT INTO tasks (id, created_at, updated_at, deleted_at, church_id, owner_id, title, date, priority, is_recurring, repeat_interval)
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 'media', 0, 1)`,
                id,
                new Date().toISOString(),
                new Date().toISOString(),
                churchId,
                ownerId,
                `Tarea ${id}`,
                date,
            );
        };

        // Ayer: dos ocurrencias, las dos completadas → cuenta para la racha.
        const yesterday = addDays(today, -1);
        await addTask('t-1', yesterday);
        await addTask('t-2', yesterday);
        for (const id of ['t-1', 't-2']) {
            await db.adapter.runAsync(
                "INSERT INTO task_occurrences (id, created_at, updated_at, deleted_at, task_id, date, status, completed_at) VALUES (?, ?, ?, NULL, ?, ?, 'completada', NULL)",
                `o-${id}`,
                new Date().toISOString(),
                new Date().toISOString(),
                id,
                yesterday,
            );
        }

        // Anteayer: una sin completar → corta la racha en 1.
        const beforeYesterday = addDays(today, -2);
        await addTask('t-3', beforeYesterday);
        await db.adapter.runAsync(
            "INSERT INTO task_occurrences (id, created_at, updated_at, deleted_at, task_id, date, status, completed_at) VALUES (?, ?, ?, NULL, 't-3', ?, 'pendiente', NULL)",
            'o-t-3',
            new Date().toISOString(),
            new Date().toISOString(),
            beforeYesterday,
        );

        // Hoy: dos de hoy, una completada.
        await addTask('t-4', today);
        await addTask('t-5', today);
        await db.adapter.runAsync(
            "INSERT INTO task_occurrences (id, created_at, updated_at, deleted_at, task_id, date, status, completed_at) VALUES (?, ?, ?, NULL, 't-4', ?, 'completada', NULL)",
            'o-t-4',
            new Date().toISOString(),
            new Date().toISOString(),
            today,
        );
        await db.adapter.runAsync(
            "INSERT INTO task_occurrences (id, created_at, updated_at, deleted_at, task_id, date, status, completed_at) VALUES (?, ?, ?, NULL, 't-5', ?, 'pendiente', NULL)",
            'o-t-5',
            new Date().toISOString(),
            new Date().toISOString(),
            today,
        );

        const summary = await localDashboardRepository.summary(churchId, ownerId);

        expect(summary.taskStreak).toBe(1);
        expect(summary.todayTasks).toHaveLength(2);
        expect(summary.todayTasks.map((one) => one.completed)).toEqual([true, false]);
    });

    it('con todo vacío devuelve ceros y listas vacías, no errores', async () => {
        // Los patrones de serie seguirían proponiendo su culto (se prueba
        // aparte, arriba): aquí se apagan para comprobar el resto de la portada
        // en un vacío de verdad.
        db.memory.exec('UPDATE meeting_patterns SET is_active = 0');

        const summary = await localDashboardRepository.summary(churchId, ownerId);

        expect(summary.believers).toEqual({ total: 0, newThisMonth: 0 });
        expect(summary.attention).toEqual({ count: 0, people: [] });
        expect(summary.upcomingEvents).toEqual([]);
        expect(summary.recentNotes).toEqual([]);
        expect(summary.composition.byCongregation).toEqual([]);
        expect(summary.weeklyActivity).toHaveLength(6);
        expect(summary.weeklyActivity.every((week) => week.notes === 0)).toBe(true);
        expect(summary.todayTasks).toEqual([]);
        expect(summary.taskStreak).toBe(0);
    });
});
