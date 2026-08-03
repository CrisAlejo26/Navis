import { expect, test } from '@playwright/test';

/**
 * Las pantallas de acceso corren en los dos perfiles del proyecto —Chromium de
 * escritorio y Pixel 7— porque el rediseño cambia de forma en `lg` (Regla 5).
 *
 * No hace falta que la API esté levantada: SetupGate deja pasar al login
 * cuando no puede consultar el estado de la instalación.
 */
/**
 * Los campos se localizan por `name` y no por su etiqueta: el idioma de la
 * interfaz lo decide el navegador, y en el caso de la contraseña la etiqueta
 * accesible del interruptor de ver/ocultar también la contiene.
 */
test.describe('Acceso', () => {
  test('el login enseña sus campos y el enlace al alta', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('el interruptor deja ver la contraseña', async ({ page }) => {
    await page.goto('/login');

    const password = page.locator('input[name="password"]');
    await expect(password).toHaveAttribute('type', 'password');

    await page.locator('input[name="password"] ~ * button').click();
    await expect(password).toHaveAttribute('type', 'text');
  });

  test('el alta mide la fuerza de la contraseña', async ({ page }) => {
    await page.goto('/register');

    await page.locator('input[name="password"]').fill('Rebano2026Seguro');
    await expect(page.getByText(/fuerte|strong|solide|forte|stark/i)).toBeVisible();
  });

  test('no hay scroll horizontal en ningún ancho', async ({ page }) => {
    await page.goto('/login');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  // El nombre se ve siempre, y una sola vez: el panel y la banda están los dos
  // en el DOM y es el CSS el que esconde el que no toca.
  test('la marca se ve exactamente una vez', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Navis', { exact: true }).locator('visible=true')).toHaveCount(1);
  });
});

/**
 * El corte de la Regla 5 se comprueba con anchos fijos y no con el del perfil,
 * para que cada caso tenga su test y no haya condicionales dentro de uno.
 * El panel de marca es el `<aside>`; por debajo de `lg` (1024 px) se sustituye
 * por la banda superior.
 */
test.describe('El panel de marca en escritorio', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('ocupa su columna', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('aside')).toBeVisible();
  });
});

test.describe('El panel de marca en móvil', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('deja sitio al formulario y se queda en la banda superior', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('aside')).toBeHidden();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
