import { expect, test, type Page } from '@playwright/test';

const TOKEN = 'aaaaaaaaaaaaaaaaaaaaaa';
const RUTA = `/lists/s/${TOKEN}`;

const LISTA = {
  churchName: 'Iglesia El Faro',
  name: 'Púlpito',
  description: 'Quién predica este mes',
  accent: '#2140cf',
  updatedAt: '2026-08-03T10:00:00.000Z',
  allowDownload: true,
  restricted: false,
  viewerLabel: null,
  members: [
    {
      position: 0,
      name: 'Juan Pérez',
      note: null,
      congregation: null,
      ministry: null,
      photoId: null,
    },
    {
      position: 1,
      name: 'Ana Ruiz',
      note: null,
      congregation: null,
      ministry: null,
      photoId: null,
    },
    {
      position: 2,
      name: 'Pedro Gil',
      note: null,
      congregation: null,
      ministry: null,
      photoId: null,
    },
  ],
};

const GATE = { churchName: 'Iglesia El Faro', name: 'Púlpito', accent: '#2140cf' };

/** La puerta: 401 con lo justo para pintarla, y 200 al acertar (RFC 0010 §7.3). */
async function montarPuerta(page: Page, options: { abre: boolean }): Promise<void> {
  let dentro = false;

  await page.route(`**/api/v1/public/lists/${TOKEN}`, (route) =>
    dentro
      ? route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...LISTA, restricted: true, viewerLabel: 'Juan Pérez' }),
        })
      : route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 401,
            message: 'Hace falta un acceso para ver esta lista',
            data: GATE,
          }),
        }),
  );

  await page.route(`**/api/v1/public/lists/${TOKEN}/access`, (route) => {
    if (!options.abre) {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ statusCode: 401, message: 'Usuario o contraseña incorrectos' }),
      });
    }

    dentro = true;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...LISTA, restricted: true, viewerLabel: 'Juan Pérez' }),
    });
  });
}

/**
 * La página pública de una lista (RFC 0010 §8.6).
 *
 * **Con el service worker bloqueado**: una vez activo se come los `page.route`
 * y la aplicación se quedaría sin datos (CLAUDE.md). Que el enlace llegue a la
 * red con la PWA instalada se prueba aparte, al final de este mismo fichero.
 */
test.describe('La página pública de una lista', () => {
  test.use({ serviceWorkers: 'block' });

  test('se abre sin sesión y sin el chrome de la aplicación (D40)', async ({ page }) => {
    await page.route(`**/api/v1/public/lists/${TOKEN}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LISTA) }),
    );

    await page.goto(RUTA);

    await expect(page.getByRole('heading', { name: 'Púlpito' })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${RUTA}$`));

    // Ni barra lateral, ni selector de iglesia, ni «iniciar sesión».
    await expect(page.getByRole('navigation')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /iniciar sesión|sign in/i })).toHaveCount(0);
  });

  /*
   * Regresión: el bloque `location /l/` del proxy se instala a mano en el
   * servidor y, cuando falta, el enlace repartido cae en la SPA. Antes moría en
   * el 404 de React Router con los nombres de media iglesia detrás.
   */
  test('si `/l/` llega a la SPA, lleva a la lista en vez de morir en un 404', async ({ page }) => {
    await page.route(`**/api/v1/public/lists/${TOKEN}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LISTA) }),
    );

    await page.goto(`/l/${TOKEN}`);

    await expect(page).toHaveURL(new RegExp(`${RUTA}$`));
    await expect(page.getByRole('heading', { name: 'Púlpito' })).toBeVisible();
  });

  /*
   * Las descargas se deciden al publicar y nacen apagadas: sin ellas la lista
   * se mira en la página y ahí se queda. Que el pie no las ofrezca es la mitad
   * visible de esa decisión —la otra es el valor por defecto de la columna—.
   */
  test('sin descargas activadas, la lista solo se mira', async ({ page }) => {
    await page.route(`**/api/v1/public/lists/${TOKEN}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...LISTA, allowDownload: false }),
      }),
    );

    await page.goto(RUTA);

    await expect(page.getByRole('heading', { name: 'Púlpito' })).toBeVisible();
    await expect(page.getByRole('button', { name: /descargar|download/i })).toHaveCount(0);
  });

  test('con las descargas activadas, el pie ofrece el PDF y la imagen', async ({ page }) => {
    await page.route(`**/api/v1/public/lists/${TOKEN}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LISTA) }),
    );

    await page.goto(RUTA);

    await expect(page.getByRole('button', { name: /descargar|download/i })).toHaveCount(2);
  });

  test('es un pase de lista: los nombres en su orden, con su ordinal', async ({ page }) => {
    await page.route(`**/api/v1/public/lists/${TOKEN}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LISTA) }),
    );

    await page.goto(RUTA);

    const filas = page.getByRole('listitem');
    await expect(filas).toHaveCount(3);
    // El orden **es el dato**: el ordinal va delante de cada nombre (D6).
    await expect(filas.first()).toContainText('1');
    await expect(filas.first()).toContainText('Juan Pérez');
    await expect(filas.nth(2)).toContainText('3');
    await expect(filas.nth(2)).toContainText('Pedro Gil');
  });

  test('no tiene scroll horizontal a 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.route(`**/api/v1/public/lists/${TOKEN}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LISTA) }),
    );

    await page.goto(RUTA);
    await expect(page.getByRole('heading', { name: 'Púlpito' })).toBeVisible();

    const desbordado = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(desbordado).toBe(false);
  });

  test('la puerta enseña el cartel con los nombres tapados y sin decir cuántos son', async ({
    page,
  }) => {
    await montarPuerta(page, { abre: false });
    await page.goto(RUTA);

    // La banda de color se queda igual: quien tiene el enlace ya sabe adónde va.
    await expect(page.getByRole('heading', { name: 'Púlpito' })).toBeVisible();
    await expect(page.getByText('Iglesia El Faro')).toBeVisible();

    // Y ni un nombre…
    await expect(page.getByText('Juan Pérez')).toHaveCount(0);
    await expect(page.getByText('Ana Ruiz')).toHaveCount(0);

    // …ni el número de personas: las barras son **siempre seis**, no las tres
    // que hay de verdad, porque el número también es un dato (§8.6). Van con
    // `aria-hidden`, así que no son `listitem` para un lector de pantalla.
    await expect(page.locator('ol[aria-hidden="true"] > li')).toHaveCount(6);
  });

  test('la puerta se recorre con el teclado y anuncia el error (§8.6)', async ({ page }) => {
    await montarPuerta(page, { abre: false });
    await page.goto(RUTA);

    const usuario = page.getByLabel(/usuario|username/i);
    await usuario.fill('juan.perez');
    await page.keyboard.press('Tab');

    const contrasena = page.getByLabel(/contraseña|password/i).first();
    await contrasena.fill('zzzz-zzzz-zzzz');
    await page.getByRole('button', { name: /entrar|come in/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('al acertar, las barras se convierten en los nombres', async ({ page }) => {
    await montarPuerta(page, { abre: true });
    await page.goto(RUTA);

    await page.getByLabel(/usuario|username/i).fill('juan.perez');
    await page
      .getByLabel(/contraseña|password/i)
      .first()
      .fill('k7fr-m3np-t9wx');
    await page.getByRole('button', { name: /entrar|come in/i }).click();

    await expect(page.getByText('Juan Pérez').first()).toBeVisible();
    // Y dice con qué llave se está entrando: en un teléfono prestado importa.
    await expect(page.getByText(/Juan Pérez/).last()).toBeVisible();
  });
});

/**
 * **El enlace público con la aplicación instalada** (RFC 0010 D15).
 *
 * Sin `navigateFallbackDenylist`, el service worker contesta `index.html` a
 * cualquier navegación —incluida `/l/<token>`— y la petición nunca llega ni a
 * nginx ni a la API: el enlace funcionaría en un teléfono cualquiera y fallaría
 * justo en el de quien tiene la PWA instalada, que es quien lo comparte.
 *
 * Aquí el service worker **sí** se deja activo a propósito: es lo que se está
 * probando. Y precisamente por eso el `page.route` de abajo solo llega si la
 * denylist funciona (CLAUDE.md).
 */
test.describe('El enlace público con la PWA instalada', () => {
  test('la ruta `/l/` no la contesta el service worker', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();

    const controlada = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
    expect(controlada).toBe(true);

    await page.route('**/l/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<h1>Lo sirve el servidor</h1>',
      }),
    );

    await page.goto(`/l/${TOKEN}`);

    await expect(page.getByRole('heading', { name: 'Lo sirve el servidor' })).toBeVisible();
  });

  test('la robots.txt excluye los enlaces de listas (D10)', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();

    expect(robots).toContain('Disallow: /l/');
    expect(robots).toContain('Disallow: /lists/s/');
  });
});
