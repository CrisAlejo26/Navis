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
 * Deja la aplicación con sesión, una iglesia y las personas que se le pasen.
 * Lo que no se declara se responde vacío, que es lo que evita que un endpoint
 * olvidado deje la pantalla girando para siempre.
 */
export async function montarApi(
  page: Page,
  data: { believers: ReturnType<typeof believer>[]; notes?: ReturnType<typeof note>[] },
): Promise<void> {
  const notes = data.notes ?? [];

  await page.route('**/api/auth/get-session', (route) =>
    json(route, {
      user: { id: 'u1', name: 'Quien acompaña', email: 'quien@navis.test', role: 'superadmin' },
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
      path === '/calendars' ||
      path === '/lists' ||
      path === '/list-viewers'
    ) {
      return json(route, []);
    }

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
        ids.length > 0 ? data.believers.filter((one) => ids.includes(one.id)) : data.believers;

      return json(route, {
        rows,
        total: rows.length,
        returned: rows.length,
        truncated: false,
      });
    }

    if (path === '/believers') {
      const only = url.searchParams.get('attention') === 'true';
      const items = only ? data.believers.filter((one) => one.needsAttention) : data.believers;

      return json(route, {
        items,
        total: items.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    }

    const one = data.believers.find((each) => path === `/believers/${each.id}`);
    if (one) return json(route, one);

    return json(route, {});
  });
}
