import type { Page, Route } from '@playwright/test';

/**
 * Un servidor de mentira para los e2e del cuaderno de la iglesia (RFC 0017).
 *
 * Aparte de `servidor.ts`, que es el de creyentes: son dos dominios distintos
 * y cada fichero se queda con el suyo (Regla 6 §1).
 */

const CHURCH = '11111111-1111-4111-8111-111111111111';

export function entry(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `${String(index).padStart(8, '0')}-4444-4444-8444-444444444444`,
    title: `Entrada ${String(index)}`,
    kind: 'testimonio',
    occurredAt: `2026-0${String((index % 6) + 1)}-1${String(index % 8)}`,
    excerpt: `Extracto de la entrada ${String(index)}`,
    hasLearned: false,
    hasAudio: false,
    remindAt: null,
    remindDoneAt: null,
    authorName: 'Quien acompaña',
    ...overrides,
  };
}

const json = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const EMPTY_DASHBOARD = {
  believers: { total: 0, newThisMonth: 0 },
  attention: { count: 0, people: [] },
  upcomingEvents: [],
  recentNotes: [],
  composition: { byCongregation: [], byMinistry: [], byGift: [] },
  weeklyActivity: [],
};

const EMPTY_BY_KIND = {
  observacion: 0,
  testimonio: 0,
  sueno: 0,
  bienHecho: 0,
  correccion: 0,
  oracion: 0,
  decision: 0,
};

/**
 * Deja la aplicación con sesión, una iglesia y las entradas que se le pasen.
 * `permissions` decide qué ve quien entra — sin `journal.view`, la sección no
 * debe aparecer ni por navegación ni por URL directa (D10).
 */
export async function montarCuaderno(
  page: Page,
  data: { entries: ReturnType<typeof entry>[]; permissions?: string[] },
): Promise<void> {
  const entries = data.entries;
  const permissions = data.permissions ?? ['*'];

  await page.route('**/api/auth/get-session', (route) =>
    json(route, {
      user: { id: 'u1', name: 'Quien acompaña', email: 'quien@navis.test', role: 'pastor' },
      session: { id: 's1', userId: 'u1', expiresAt: '2099-01-01T00:00:00.000Z' },
    }),
  );

  await page.route('**/api/v1/**', (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api\/v1/, '');

    if (path === '/roles/mine') return json(route, { slug: 'pastor', permissions });
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
      ['/congregations', '/gifts', '/ministries', '/calendars', '/lists', '/list-viewers'].includes(
        path,
      )
    ) {
      return json(route, []);
    }

    if (path === '/journal/stats') {
      const byKind = { ...EMPTY_BY_KIND };
      for (const one of entries) {
        const kind = one.kind as keyof typeof byKind;
        byKind[kind] += 1;
      }

      return json(route, {
        total: entries.length,
        byKind,
        pendingReminders: entries.filter((one) => one.remindAt && !one.remindDoneAt).length,
        thisMonth: 0,
        monthly: Array.from({ length: 12 }, (_unused, index) => ({
          month: `2026-${String(index + 1).padStart(2, '0')}`,
          total: 0,
        })),
      });
    }

    if (path === '/journal') {
      return json(route, {
        items: entries,
        total: entries.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    }

    const one = entries.find((each) => path === `/journal/${each.id}`);
    if (one) {
      return json(route, {
        ...one,
        churchId: CHURCH,
        annotation: 'La anotación completa de esta entrada.',
        learned: null,
        remindText: null,
        audios: [],
        authorId: 'u1',
        createdAt: '2026-08-01T10:00:00.000Z',
      });
    }

    return json(route, {});
  });
}
