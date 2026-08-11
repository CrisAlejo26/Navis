import { expect, test } from '@playwright/test';

import { entry, montarCuaderno } from './cuaderno-servidor';

/**
 * El cuaderno de la iglesia (RFC 0017).
 *
 * Sin service worker: con él, tras una recarga los `page.route` de este
 * fichero dejan de verse (mismo motivo que `creyentes.spec.ts`).
 */
test.use({ serviceWorkers: 'block' });

const ENTRADAS = [
  entry(1, { title: 'Visita a la familia Gómez' }),
  entry(2, { title: 'Oración por la congregación', kind: 'oracion' }),
];

test.describe('El listado, con sus tres vistas', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('las tres vistas existen y la elegida se recuerda', async ({ page }) => {
    await montarCuaderno(page, { entries: ENTRADAS });
    await page.goto('/journal/list');

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(3);

    // La segunda pestaña es «Tabla» (D9: fichas, tabla, calendario, en ese orden).
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

    const guardado = await page.evaluate(() =>
      globalThis.localStorage.getItem('navis.journalView'),
    );
    expect(guardado).toContain('"table"');

    // La preferencia es de quien mira y no del enlace: sobrevive a recargar.
    await page.reload();
    await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('El oleaje', () => {
  test('no se mueve con prefers-reduced-motion, y no desaparece', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await montarCuaderno(page, { entries: ENTRADAS });
    await page.goto('/journal');

    const banda = page.locator('.animate-oleaje').first();
    await expect(banda).toBeVisible();

    // La regla global deja la animación en un solo fotograma (`CLAUDE.md`,
    // Regla 9 §5): la duración cae a un instante y no se ejecuta en bucle.
    // El navegador puede normalizar `0.01ms` como `1e-05s`: se compara el
    // valor, no la cadena.
    const segundos = await banda.evaluate((node) =>
      Number.parseFloat(globalThis.getComputedStyle(node).animationDuration),
    );
    expect(segundos).toBeLessThan(0.001);
  });
});

test.describe('Sin permiso journal.view', () => {
  test('no aparece en la navegación ni se entra por URL directa', async ({ page }) => {
    await montarCuaderno(page, {
      entries: ENTRADAS,
      // El resto del panel, sin el cuaderno: es lo mínimo para que la
      // aplicación arranque sin quedarse en blanco.
      permissions: ['dashboard.view', 'believers.view', 'calendar.view'],
    });

    await page.goto('/');
    // Por `href` y no por el texto traducido: el idioma del navegador decide
    // cuál de los seis sale, y el enlace es lo único estable entre todos.
    await expect(page.locator('a[href="/journal"]')).toHaveCount(0);

    await page.goto('/journal');
    await expect(page).toHaveURL(/no-access/);
  });
});
