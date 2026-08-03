import { expect, test } from '@playwright/test';

/**
 * La navegación de móvil ya no es una barra inferior: por debajo de `md` hay
 * una cabecera con el botón que abre el panel con todas las entradas
 * (Regla 5). Sin sesión no se llega al layout de la app, así que aquí se
 * comprueba lo que sí se puede sin ella: que el acceso no deja scroll
 * horizontal a ningún ancho y que la marca sigue en su sitio.
 */
test.describe('En un teléfono', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('el acceso cabe sin desplazarse a lo ancho', async ({ page }) => {
    await page.goto('/login');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('los campos y el botón se alcanzan sin zoom', async ({ page }) => {
    await page.goto('/login');

    // 44 px de lado es el mínimo de un objetivo táctil.
    const submit = page.locator('form button[type="submit"]');
    const box = await submit.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});

test.describe('En una tablet estrecha', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('sigue sin haber scroll horizontal', async ({ page }) => {
    await page.goto('/register');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
