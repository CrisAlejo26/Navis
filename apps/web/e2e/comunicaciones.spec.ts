import { expect, test, type Page } from '@playwright/test';

import { montarApi } from './servidor';

/**
 * Comunicaciones (RFC 0016). Lo que se comprueba aquí, con la API simulada
 * de `servidor.ts`, es la pantalla: qué se pinta con la bandeja vacía y que
 * el rol `creyente` no ve la entrada en la navegación (§2). El envío en
 * tiempo real por WebSocket entre dos sesiones lo cubre el e2e de la API
 * (`chat.e2e-spec.ts`), que sí levanta el servidor de verdad.
 */
test.use({ serviceWorkers: 'block', locale: 'es-ES' });

const CHANNEL_ROUTES = (page: Page) =>
  page.route('**/api/v1/channels**', (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api\/v1/, '');

    if (path === '/channels/contacts') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

test.describe('La bandeja de Comunicaciones', () => {
  test.beforeEach(async ({ page }) => {
    await montarApi(page, { believers: [] });
    await CHANNEL_ROUTES(page);
  });

  test('sin conversaciones, invita a escribir a alguien en vez de una lista en blanco', async ({
    page,
  }) => {
    await page.goto('/communications');

    await expect(page.getByText('Todavía no hay ninguna conversación')).toBeVisible();
    // Dos botones con el mismo nombre a propósito: el de la cabecera (icono) y
    // el de la propia invitación del estado vacío.
    await expect(page.getByRole('button', { name: 'Nueva conversación' })).toHaveCount(2);
  });

  test('no hay scroll horizontal en un teléfono', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/communications');
    await expect(page.getByText('Todavía no hay ninguna conversación')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('El rol creyente', () => {
  test('no ve Comunicaciones en la navegación', async ({ page }) => {
    await montarApi(page, { believers: [] });
    await page.route('**/api/v1/roles/mine', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ slug: 'creyente', permissions: [] }),
      }),
    );
    await page.route('**/api/auth/get-session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'u1', name: 'Un creyente', email: 'creyente@navis.test', role: 'creyente' },
          session: { id: 's1', userId: 'u1', expiresAt: '2099-01-01T00:00:00.000Z' },
        }),
      }),
    );

    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Comunicaciones' })).toHaveCount(0);
  });
});
