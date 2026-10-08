import type { Page, Route } from '@playwright/test';

/**
 * Un servidor de mentira para los e2e de tareas (RFC 0018, Fase 7): el
 * listado con su flujo y su límite, el filtro por flujo y el cronómetro.
 * Con estado: empezar y parar de verdad cambian lo que contesta `/running`.
 *
 * Aparte de `servidor.ts` y `cuaderno-servidor.ts`: cada dominio, el suyo.
 */

const CHURCH = '11111111-1111-4111-8111-111111111111';
export const FLUJO_VISITAS = '22222222-2222-4222-8222-222222222222';
export const FLUJO_PREDICACION = '33333333-3333-4333-8333-333333333333';

const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const EMPTY_DASHBOARD = {
    believers: { total: 0, newThisMonth: 0 },
    attention: { count: 0, people: [] },
    upcomingEvents: [],
    recentNotes: [],
    composition: { byCongregation: [], byMinistry: [], byGift: [] },
    weeklyActivity: [],
    todayTasks: [],
    taskStreak: 0,
};

export function ocurrencia(index: number, overrides: Record<string, unknown> = {}) {
    return {
        taskId: `${String(index).padStart(8, '0')}-5555-4555-8555-555555555555`,
        date: new Date().toISOString().slice(0, 10),
        title: `Tarea ${String(index)}`,
        description: null,
        time: null,
        priority: 'media',
        status: 'pendiente',
        completedAt: null,
        isRecurring: false,
        tags: [],
        reminder: null,
        createdAt: '2026-10-01T10:00:00.000Z',
        ...overrides,
    };
}

export function flujo(id: string, name: string, accent = '#2140cf') {
    return { id, name, description: null, accent, position: 0, count: 0 };
}

type Ocurrencia = ReturnType<typeof ocurrencia>;

/** Deja la aplicación con sesión, una iglesia, tareas, flujos y un cronómetro que empieza parado. */
export async function montarTareas(
    page: Page,
    data: { tasks: Ocurrencia[]; workflows: ReturnType<typeof flujo>[] },
): Promise<{ consultas: string[]; arrancadas: string[] }> {
    const consultas: string[] = [];
    const arrancadas: string[] = [];
    let running: { entry: Record<string, unknown>; task: { id: string; title: string } } | null =
        null;

    await page.route('**/api/auth/get-session', (route) =>
        json(route, {
            user: { id: 'u1', name: 'Quien acompaña', email: 'quien@navis.test', role: 'pastor' },
            session: { id: 's1', userId: 'u1', expiresAt: '2099-01-01T00:00:00.000Z' },
        }),
    );

    await page.route('**/api/v1/**', async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname.replace(/^.*\/api\/v1/, '');
        const method = route.request().method();

        if (path === '/roles/mine') return json(route, { slug: 'pastor', permissions: ['*'] });
        if (path === '/churches') {
            return json(route, {
                items: [
                    {
                        id: CHURCH,
                        name: 'Iglesia de prueba',
                        slug: 'prueba',
                        city: 'Elda',
                        timezone: 'Europe/Madrid',
                        country: 'ES',
                        region: 'ES-VC',
                    },
                ],
                activeId: CHURCH,
            });
        }
        if (path === '/dashboard/summary') return json(route, EMPTY_DASHBOARD);
        if (path === '/weather') return json(route, null);

        if (
            [
                '/congregations',
                '/gifts',
                '/ministries',
                '/believer-tags',
                '/calendars',
                '/lists',
                '/list-viewers',
                '/tables',
            ].includes(path)
        ) {
            return json(route, []);
        }

        if (path === '/workflows') return json(route, data.workflows);
        if (path === '/tags') return json(route, []);

        if (path === '/tasks') {
            consultas.push(url.search);
            const flow = url.searchParams.get('workflowId');
            const items = data.tasks.filter(
                (task) => !flow || (task as { workflow?: { id: string } }).workflow?.id === flow,
            );
            return json(route, { items, total: items.length, page: 1, limit: 200, totalPages: 1 });
        }
        if (path === '/habits') {
            return json(route, { items: [], total: 0, page: 1, limit: 200, totalPages: 1 });
        }
        if (path === '/tasks/streak') return json(route, { current: 0, longest: 0 });

        if (path === '/tasks/time/running') return json(route, { timer: running });
        if (path === '/tasks/time/stop' && method === 'POST') {
            const entry = running?.entry ?? {};
            running = null;
            return json(route, { ...entry, endedAt: new Date().toISOString() }, 201);
        }
        const start = /^\/tasks\/([^/]+)\/time\/start$/.exec(path);
        if (start && method === 'POST') {
            const task = data.tasks.find((one) => one.taskId === start[1]);
            arrancadas.push(start[1] ?? '');
            running = {
                entry: {
                    id: '99999999-9999-4999-8999-999999999999',
                    taskId: start[1],
                    startedAt: new Date(Date.now() - 65_000).toISOString(),
                    endedAt: null,
                },
                task: { id: start[1] ?? '', title: task?.title ?? '' },
            };
            return json(route, running, 201);
        }
        if (/^\/tasks\/[^/]+\/time$/.test(path))
            return json(route, { entries: [], totalSeconds: 0 });

        return json(route, {});
    });

    return { consultas, arrancadas };
}
