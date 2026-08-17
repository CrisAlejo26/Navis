import { expect, test } from '@playwright/test';

const TOKEN = 'aaaaaaaaaaaaaaaaaaaaaa';

const LISTA = {
  churchName: 'Iglesia El Faro',
  name: 'Púlpito',
  description: null,
  accent: '#2140cf',
  updatedAt: '2026-08-03T10:00:00.000Z',
  allowDownload: false,
  restricted: false,
  viewerLabel: null,
  members: [],
};

/**
 * **El manifest propio de una lista** («PWA por lista», sobre RFC 0010).
 *
 * Instalar desde `/lists/s/<token>` tiene que quedar con un `start_url`
 * propio, o el icono abre el inicio de sesión general en vez de la lista —el
 * fallo que este cambio existe para arreglar—. Aquí solo se comprueba que el
 * documento enlaza el manifest correcto: el contenido de ese JSON (su
 * `start_url`, su `scope`, su `id`) ya lo prueba `list-manifest.test.ts` en la
 * API.
 *
 * Con el service worker bloqueado, como el resto de specs de la página
 * pública: una vez activo se come los `page.route` (CLAUDE.md).
 */
test.describe('El manifest de la página pública de una lista', () => {
  test.use({ serviceWorkers: 'block' });

  test('en /lists/s/<token> el manifest enlazado es el de esa lista, no el general', async ({
    page,
  }) => {
    await page.route(`**/api/v1/public/lists/${TOKEN}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LISTA) }),
    );

    await page.goto(`/lists/s/${TOKEN}`);
    await expect(page.getByRole('heading', { name: 'Púlpito' })).toBeVisible();

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      `/l/${TOKEN}/manifest.webmanifest`,
    );
  });

  test('en cualquier otra pantalla, el manifest sigue siendo el general de Navis', async ({
    page,
  }) => {
    await page.goto('/login');

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      '/manifest.webmanifest',
    );
  });
});
