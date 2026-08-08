import { expect, test } from '@playwright/test';

import { dashboardSummary, montarApi } from './servidor';

/**
 * El panel de inicio (RFC 0001).
 *
 * Sin service worker, por el mismo motivo que `creyentes.spec.ts`: con él, la
 * recarga deja de pasar por los `page.route` de este fichero.
 */
test.use({ serviceWorkers: 'block' });

const PANEL = dashboardSummary({
  believers: { total: 42, newThisMonth: 3 },
  attention: {
    count: 1,
    people: [{ id: 'b1', name: 'María de prueba', hasPhoto: false, daysWithoutNote: 40 }],
  },
  upcomingEvents: [
    {
      meetingId: null,
      date: '2026-08-09',
      startTime: '18:00',
      name: 'Culto',
      congregationName: 'Central',
      accent: 'primary',
    },
  ],
  recentNotes: [
    {
      id: 'n1',
      believerId: 'b1',
      believerName: 'María de prueba',
      kind: 'seguimiento',
      occurredAt: '2026-08-01',
      excerpt: 'Se le hizo seguimiento tras el culto.',
    },
  ],
});

test.describe('el panel de inicio', () => {
  test('enseña las tarjetas con datos reales, no una pantalla que gira para siempre', async ({
    page,
  }) => {
    await montarApi(page, { believers: [], dashboard: PANEL });
    await page.goto('/');

    await expect(page).toHaveURL('/');
    await expect(page.getByText('42')).toBeVisible();
    await expect(page.getByText('Culto', { exact: true })).toBeVisible();
    await expect(page.getByText('Se le hizo seguimiento tras el culto.')).toBeVisible();
    // El nombre aparece dos veces: en «piden atención» y en notas recientes.
    await expect(page.getByText('María de prueba')).toHaveCount(2);
  });

  test('la tarjeta de atención enlaza al listado ya filtrado', async ({ page }) => {
    await montarApi(page, { believers: [], dashboard: PANEL });
    await page.goto('/');

    const enlaces = page.locator('a[href="/believers?attention=true"]');
    await expect(enlaces.first()).toBeVisible();
  });

  test('con una iglesia recién creada, sin datos, no revienta', async ({ page }) => {
    await montarApi(page, { believers: [] });
    await page.goto('/');

    await expect(page).toHaveURL('/');
    // Nada de «undefined» ni «NaN» colándose por un dato que faltaba (D-panel).
    await expect(page.locator('body')).not.toContainText('undefined');
    await expect(page.locator('body')).not.toContainText('NaN');
  });

  /**
   * Regresión: un `/weather` que no trae `kind` —proveedor caído, caché a
   * medias— tumbaba **todo el panel**, no solo el chip del tiempo, porque
   * `WeatherChip` indexaba su mapa de iconos con `undefined` y React recibía
   * un tipo de elemento inválido. Lo destapó este mismo spec, siendo el primer
   * e2e que abre el panel autenticado de verdad.
   */
  test('un tiempo sin forma reconocible no se lleva el panel entero por delante', async ({
    page,
  }) => {
    await montarApi(page, { believers: [], dashboard: PANEL, weather: {} });
    await page.goto('/');

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Culto', { exact: true })).toBeVisible();
  });
});
