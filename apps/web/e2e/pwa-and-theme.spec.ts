import { expect, test } from '@playwright/test';

test.describe('PWA y tema', () => {
  test('sirve un manifest válido con iconos', async ({ page, request }) => {
    await page.goto('/login');

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /.+/);

    const manifestHref = await manifestLink.getAttribute('href');
    const manifest = (await (await request.get(manifestHref ?? '')).json()) as {
      name: string;
      display: string;
      icons: unknown[];
    };

    expect(manifest.name).toBe('PastorTools');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('registra el service worker', async ({ page }) => {
    await page.goto('/login');
    const registered = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return Boolean(registration.active ?? registration.installing ?? registration.waiting);
    });
    expect(registered).toBe(true);
  });

  test('el tema oscuro persiste tras recargar', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('radio').nth(1).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('redirige a /login cuando no hay sesión', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });
});
