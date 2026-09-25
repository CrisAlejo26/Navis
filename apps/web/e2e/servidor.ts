import type { Page, Route } from '@playwright/test';

/**
 * Un servidor de mentira para los e2e de la web.
 *
 * Los e2e de este proyecto corren contra el **build real** y sin API levantada
 * (ver `acceso.spec.ts`), así que la sesión y los datos se sirven desde el
 * propio navegador. Lo que se prueba aquí es la pantalla —los filtros de la
 * URL, el «Ver más», los tres anchos—, no la API: eso ya lo cubren los e2e de
 * `apps/api`, y contra los dos motores.
 */

const CHURCH = '11111111-1111-4111-8111-111111111111';

/** Una persona del listado, con su sonda ya calculada como la calcula la API. */
export function believer(index: number, overrides: Record<string, unknown> = {}) {
    const days = index * 7;

    return {
        id: `${String(index).padStart(8, '0')}-2222-4222-8222-222222222222`,
        churchId: CHURCH,
        congregationId: null,
        firstName: `Hermano ${String(index)}`,
        lastName: 'De prueba',
        phone: null,
        status: 'activo',
        alertAfterDays: 30,
        lastNoteAt: '2026-07-01',
        createdAt: '2026-01-01T00:00:00.000Z',
        ministries: [],
        daysWithoutNote: days,
        needsAttention: days > 30,
        gifts: [],
        tags: [],
        featuredTagId: null,
        notesCount: 1,
        ...overrides,
    };
}

export function note(index: number, overrides: Record<string, unknown> = {}) {
    return {
        id: `${String(index).padStart(8, '0')}-3333-4333-8333-333333333333`,
        churchId: CHURCH,
        believerId: believer(1).id,
        kind: 'seguimiento',
        occurredAt: `2026-0${String((index % 6) + 1)}-1${String(index % 10)}`,
        told: `Nota ${String(index)}`,
        advice: null,
        giftId: null,
        giftName: null,
        remindAt: null,
        remindText: null,
        remindDoneAt: null,
        audios: [],
        authorId: 'u1',
        authorName: 'Quien acompaña',
        createdAt: '2026-08-01T10:00:00.000Z',
        ...overrides,
    };
}

const json = (route: Route, body: unknown) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

/**
 * Una tabla personalizada y sus filas (RFC 0021), con el **filtrado real**
 * del lado del stub: los e2e de filtros prueban la pantalla, y para que una
 * fila desaparezca al aplicar un filtro el stub tiene que aplicarlo igual
 * que lo hace `table-row-filters.ts` de la API.
 */
export interface StubTable {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    accent?: string;
    /** El origen de las filas: `'believers'` enlaza el listado de creyentes (RFC 0025 D1). */
    source?: 'believers' | null;
    columns: {
        id: string;
        key: string;
        label: string;
        type: string;
        required?: boolean;
        /** El campo del creyente con el que se rellena (RFC 0025 D2). */
        believerField?: string | null;
        options?: { value: string; label: string; color?: string }[] | null;
    }[];
    rows: {
        id: string;
        data: Record<string, unknown>;
        createdAt?: string;
        /** El creyente enlazado a la fila, ya resuelto como lo resuelve la API (RFC 0025 D11). */
        believer?: { id: string; name: string; photoKey: string | null } | null;
    }[];
}

const COLUMN_TYPE_SETS = {
    textLike: new Set(['text', 'long_text', 'email', 'phone', 'url']),
    numeric: new Set(['number', 'currency']),
};

/** La condición de un filtro, igual que `applyRowFilter` de la API. */
function pasaFiltro(
    row: Record<string, unknown>,
    filter: { columnKey: string; operator: string; value: unknown },
    columns: StubTable['columns'],
): boolean {
    const column = columns.find((one) => one.key === filter.columnKey);
    if (!column) return true;

    const cell = row[filter.columnKey];
    const texto =
        typeof cell === 'string' || typeof cell === 'number' || typeof cell === 'boolean'
            ? String(cell)
            : cell == null
              ? ''
              : JSON.stringify(cell);

    if (filter.operator === 'contains' && COLUMN_TYPE_SETS.textLike.has(column.type)) {
        return texto.toLowerCase().includes(String(filter.value).toLowerCase());
    }
    if (filter.operator === 'between' && COLUMN_TYPE_SETS.numeric.has(column.type)) {
        const { min, max } = (filter.value ?? {}) as { min?: number; max?: number };
        if (min !== undefined && !(typeof cell === 'number' && cell >= min)) return false;
        if (max !== undefined && !(typeof cell === 'number' && cell <= max)) return false;
        return true;
    }
    if (filter.operator === 'between' && column.type === 'date') {
        const { from, to } = (filter.value ?? {}) as { from?: string; to?: string };
        if (from && !(typeof cell === 'string' && cell >= from)) return false;
        if (to && !(typeof cell === 'string' && cell <= to)) return false;
        return true;
    }
    if (filter.operator === 'equals' && column.type === 'checkbox') {
        return filter.value ? cell === true : cell !== true;
    }
    if (filter.operator === 'in' && column.type === 'single_select') {
        return (filter.value as string[]).includes(String(cell));
    }
    if (filter.operator === 'in' && column.type === 'multi_select') {
        const cells = Array.isArray(cell) ? (cell as string[]) : [];
        return (filter.value as string[]).some((value) => cells.includes(value));
    }

    return false;
}

/** La página de filas del stub, con búsqueda y filtros (D30). */
function paginaFilas(
    tabla: StubTable,
    search: URLSearchParams,
): { items: unknown[]; total: number; page: number; limit: number; totalPages: number } {
    const page = Number(search.get('page') ?? 1);
    const limit = Number(search.get('limit') ?? 25);
    const buscado = search.get('search')?.toLowerCase();
    const bruto = search.get('filters');

    let filtradas = tabla.rows;

    if (bruto) {
        try {
            const filtros = JSON.parse(bruto) as {
                columnKey: string;
                operator: string;
                value: unknown;
            }[];
            filtradas = filtradas.filter((row) =>
                filtros.every((filter) => pasaFiltro(row.data, filter, tabla.columns)),
            );
        } catch {
            // Lo que no se puede leer no filtra: la API devolvería 400.
        }
    }

    if (buscado) {
        filtradas = filtradas.filter((row) =>
            JSON.stringify(row.data).toLowerCase().includes(buscado),
        );
    }

    const slice = filtradas.slice((page - 1) * limit, page * limit);

    return {
        items: slice.map((row) => ({
            id: row.id,
            tableId: tabla.id,
            data: row.data,
            mismatches: [],
            believerId: row.believer?.id ?? null,
            believer: row.believer ?? null,
            createdBy: 'u1',
            createdAt: row.createdAt ?? '2026-08-01T10:00:00.000Z',
            updatedAt: '2026-08-01T10:00:00.000Z',
        })),
        total: filtradas.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(filtradas.length / limit)),
    };
}

/** El panel de inicio (RFC 0001), vacío salvo que el spec ponga algo. */
export function dashboardSummary(overrides: Record<string, unknown> = {}) {
    return {
        believers: { total: 0, newThisMonth: 0 },
        attention: { count: 0, people: [] },
        upcomingEvents: [],
        recentNotes: [],
        composition: { byCongregation: [], byMinistry: [], byGift: [] },
        weeklyActivity: [],
        todayTasks: [],
        taskStreak: 0,
        ...overrides,
    };
}

/**
 * Deja la aplicación con sesión, una iglesia y las personas que se le pasen.
 * Lo que no se declara se responde vacío, que es lo que evita que un endpoint
 * olvidado deje la pantalla girando para siempre.
 */
export async function montarApi(
    page: Page,
    data: {
        believers: ReturnType<typeof believer>[];
        notes?: ReturnType<typeof note>[];
        dashboard?: ReturnType<typeof dashboardSummary>;
        /** Una tabla personalizada, para los e2e de filtros y filas (RFC 0021). */
        tables?: StubTable[];
        /** Los creyentes ya enlazados a esa tabla, para el selector (RFC 0025 D9). */
        believerIds?: string[];
        /** Por si un spec necesita simular un tiempo real o una respuesta rara. */
        weather?: unknown;
    },
): Promise<void> {
    const notes = data.notes ?? [];
    const dashboard = data.dashboard ?? dashboardSummary();
    const tabla = data.tables?.[0];
    const idsEnTabla = data.believerIds ?? [];

    await page.route('**/api/auth/get-session', (route) =>
        json(route, {
            user: {
                id: 'u1',
                name: 'Quien acompaña',
                email: 'quien@navis.test',
                role: 'superadmin',
            },
            session: { id: 's1', userId: 'u1', expiresAt: '2099-01-01T00:00:00.000Z' },
        }),
    );

    await page.route('**/api/v1/**', (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname.replace(/^.*\/api\/v1/, '');

        if (path === '/roles/mine') return json(route, { slug: 'superadmin', permissions: ['*'] });
        if (path === '/churches') {
            return json(route, {
                items: [
                    {
                        id: CHURCH,
                        name: 'Iglesia de prueba',
                        slug: 'prueba',
                        city: 'Elda',
                        timezone: 'Europe/Madrid',
                        // De aquí salen los festivos del calendario: el stub tiene que
                        // traerlos o la ficha de la iglesia se queda sin de dónde es.
                        country: 'ES',
                        region: 'ES-VC',
                    },
                ],
                // `activeId`, que es como se llama en el contrato: con otro nombre no
                // hay iglesia activa y las pantallas que dependen de ella no se pintan.
                activeId: CHURCH,
            });
        }
        /*
         * Los que devuelven una lista **tienen que devolver una lista**: con el
         * `{}` del comodín de abajo, un `.filter` de la pantalla revienta y el
         * fallo aparece a diez componentes de distancia (RFC 0010 §8.7).
         */
        if (
            path === '/congregations' ||
            path === '/gifts' ||
            path === '/ministries' ||
            path === '/believer-tags' ||
            path === '/calendars' ||
            path === '/lists' ||
            path === '/list-viewers'
        ) {
            return json(route, []);
        }

        /*
         * Tablas personalizadas (RFC 0021): con `data.tables` se sirven de verdad,
         * con su ficha, sus filas paginadas y filtradas, sus vistas y las
         * mutaciones de vista — el resto responde vacío, como los demás.
         */
        if (path === '/tables') {
            if (tabla) {
                return json(route, [
                    {
                        id: tabla.id,
                        churchId: CHURCH,
                        name: tabla.name,
                        slug: tabla.slug,
                        icon: tabla.icon ?? 'clipboard',
                        accent: tabla.accent ?? 'primary',
                        position: 0,
                        isActive: true,
                        source: tabla.source ?? null,
                    },
                ]);
            }
            return json(route, []);
        }

        if (tabla && path === `/tables/${tabla.id}`) {
            return json(route, {
                id: tabla.id,
                churchId: CHURCH,
                name: tabla.name,
                slug: tabla.slug,
                icon: tabla.icon ?? 'clipboard',
                accent: tabla.accent ?? 'primary',
                position: 0,
                isActive: true,
                source: tabla.source ?? null,
                columns: tabla.columns.map((column, index) => ({
                    id: column.id,
                    tableId: tabla.id,
                    key: column.key,
                    label: column.label,
                    type: column.type,
                    position: index,
                    required: column.required ?? false,
                    options: column.options ?? null,
                    config: null,
                    isActive: true,
                    believerField: column.believerField ?? null,
                })),
            });
        }

        // Los creyentes ya enlazados: los que el spec declare (RFC 0025 D9 —
        // el selector marca a quien ya está dentro, no lo esconde).
        if (tabla && path === `/tables/${tabla.id}/believers`) {
            if (route.request().method() === 'POST') {
                // El lote se salta a los repetidos; para la pantalla basta con
                // cuántos entraron (el refetch trae las filas nuevas).
                const cuerpo = route.request().postDataJSON() as { believerIds?: string[] };
                return json(route, { added: cuerpo.believerIds?.length ?? 0 });
            }
            return json(route, { ids: idsEnTabla });
        }

        if (tabla && path === `/tables/${tabla.id}/rows`) {
            return json(route, paginaFilas(tabla, url.searchParams));
        }

        if (tabla && path === `/tables/${tabla.id}/views`) {
            return json(route, []);
        }

        if (tabla && path.startsWith(`/tables/${tabla.id}/views/`)) {
            // PATCH /tables/:id/views/:vid: se devuelve con lo que llegó, para que
            // la pantalla actualice su caché con lo que el test acaba de mandar.
            const cuerpo = route.request().postDataJSON() as Record<string, unknown> | null;
            return json(route, {
                id: path.split('/').pop(),
                tableId: tabla.id,
                name: 'Vista del test',
                type: 'kanban',
                groupBy: null,
                dateColumn: null,
                filters: [],
                sortBy: null,
                sortOrder: 'desc',
                position: 0,
                ...(cuerpo ?? {}),
            });
        }

        if (path === '/dashboard/summary') return json(route, dashboard);
        // `null` por defecto y no el `{}` del comodín de abajo: la iglesia de
        // prueba no tiene ciudad puesta, que es un caso real y no lo mismo que «no
        // ha llegado nada» (ver el arreglo de `WeatherChip`, RFC 0001).
        if (path === '/weather') return json(route, data.weather ?? null);

        if (path === '/believers/summary') {
            return json(route, {
                total: data.believers.length,
                byStatus: { activo: data.believers.length, nuevo: 0, inactivo: 0, trasladado: 0 },
                needsAttention: data.believers.filter((one) => one.needsAttention).length,
                newThisMonth: 0,
            });
        }

        if (path.endsWith('/notes/days')) {
            return json(route, []);
        }

        if (path.endsWith('/notes')) {
            const page_ = Number(url.searchParams.get('page') ?? 1);
            const limit = Number(url.searchParams.get('limit') ?? 20);
            const buscado = url.searchParams.get('search')?.toLowerCase();
            const encontradas = buscado
                ? notes.filter((one) => one.told.toLowerCase().includes(buscado))
                : notes;
            const slice = encontradas.slice((page_ - 1) * limit, page_ * limit);

            return json(route, {
                items: slice,
                total: encontradas.length,
                page: page_,
                limit,
                totalPages: Math.max(1, Math.ceil(encontradas.length / limit)),
                counts: {
                    seguimiento: encontradas.length,
                    testimonio: 0,
                    sueno: 0,
                    vision: 0,
                    experiencia: 0,
                    don: 0,
                    total: encontradas.length,
                },
            });
        }

        /**
         * Exportar (RFC 0009): las mismas filas sin paginar. Va **antes** que
         * `/believers`, que compara la ruta entera y no la dejaría pasar de todas
         * formas, pero el orden deja claro cuál manda.
         */
        if (path === '/believers/export') {
            const ids = url.searchParams.getAll('ids');
            const rows =
                ids.length > 0
                    ? data.believers.filter((one) => ids.includes(one.id))
                    : data.believers;

            return json(route, {
                rows,
                total: rows.length,
                returned: rows.length,
                truncated: false,
            });
        }

        if (path === '/believers') {
            const only = url.searchParams.get('attention') === 'true';
            const catalogo = only
                ? data.believers.filter((one) => one.needsAttention)
                : data.believers;

            // Paginación de verdad (RFC 0025 D8): el «Ver más» del selector pide
            // la página siguiente, y un stub que siempre devuelva lo mismo la
            // cargaría infinito.
            const page = Number(url.searchParams.get('page') ?? 1);
            const limit = Number(url.searchParams.get('limit') ?? 20);
            const slice = catalogo.slice((page - 1) * limit, page * limit);

            return json(route, {
                items: slice,
                total: catalogo.length,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(catalogo.length / limit)),
            });
        }

        const one = data.believers.find((each) => path === `/believers/${each.id}`);
        if (one) return json(route, one);

        return json(route, {});
    });
}
