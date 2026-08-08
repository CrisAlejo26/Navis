import { expect, test } from '@playwright/test';

import { montarApi } from './servidor';

/**
 * El selector geográfico en cascada de la ficha de iglesia (RFC 0011,
 * ampliación): país, comunidad, ciudad y zona horaria.
 *
 * Sin service worker, por el mismo motivo que `creyentes.spec.ts`: con él, la
 * recarga deja de pasar por los `page.route` de este fichero.
 */
test.use({ serviceWorkers: 'block', locale: 'es-ES' });

test.describe('El selector geográfico de la ficha de iglesia', () => {
  test.beforeEach(async ({ page }) => {
    await montarApi(page, { believers: [] });
    await page.route('**/api/v1/geocode/cities**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      }),
    );
    await page.goto('/settings');
    await expect(page.getByRole('combobox', { name: 'País' })).toBeVisible();
  });

  test('el país se busca por nombre, no se escribe un código', async ({ page }) => {
    const country = page.getByRole('combobox', { name: 'País' });
    await country.click();
    await country.fill('colomb');

    await expect(page.getByRole('option', { name: 'Colombia' })).toBeVisible();
  });

  test('elegir un país distinto de España enseña sus comunidades con nombre', async ({ page }) => {
    const country = page.getByRole('combobox', { name: 'País' });
    await country.click();
    await country.fill('francia');
    await page.getByRole('option', { name: 'Francia' }).click();

    const region = page.getByRole('combobox', { name: 'Comunidad' });
    await region.click();

    // Antes de esta ampliación, un país que no fuera España enseñaba un
    // campo de texto para el código ISO 3166-2 a mano: aquí hay nombres.
    // El nombre viene tal cual de la fuente (en francés), no traducido.
    await expect(page.getByRole('option', { name: 'Bretagne' })).toBeVisible();
  });

  test('cambiar de país limpia la comunidad elegida', async ({ page }) => {
    // Sale de España (que trae Comunitat Valenciana puesta) y entra en
    // Alemania, cuyas comunidades no tienen nada que ver.
    const country = page.getByRole('combobox', { name: 'País' });
    await country.click();
    await country.fill('alemania');
    await page.getByRole('option', { name: 'Alemania' }).click();

    // Vuelve a «sin comunidad», no a la de España que traía antes.
    await expect(page.getByRole('combobox', { name: 'Comunidad' })).toHaveValue(
      'Solo los festivos nacionales',
    );
  });
});
