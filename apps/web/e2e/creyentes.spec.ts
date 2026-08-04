import { expect, test, type Page } from '@playwright/test';

import { believer, montarApi, note } from './servidor';

/**
 * El listado de creyentes y su bitácora (RFC 0003).
 *
 * Corre en los dos perfiles del proyecto —Chromium de escritorio y Pixel 7—
 * porque la pantalla cambia de forma en `md` y en `lg` (Regla 5).
 *
 * Casi todo se busca con `visible=true`: la tabla y las fichas están **las dos**
 * en el DOM y es el CSS el que esconde la que no toca, así que sin ese filtro
 * cada texto aparecería dos veces.
 */
/**
 * Sin service worker.
 *
 * Con él, tras una recarga la PWA intercepta las peticiones y los `page.route`
 * de este fichero dejan de verlas: la aplicación se queda sin sesión y vuelve
 * al login. Lo que prueba este fichero son las pantallas de creyentes; el
 * service worker tiene su propio spec (`pwa-and-theme.spec.ts`).
 */
test.use({ serviceWorkers: 'block' });

const PERSONAS = [
  believer(1, { firstName: 'Andrés', lastNoteAt: null, needsAttention: false, notesCount: 0 }),
  believer(2, { firstName: 'Lucía' }),
  believer(8, { firstName: 'María', daysWithoutNote: 56, needsAttention: true }),
];

const persona = (page: Page, name: string) =>
  page.getByRole('link', { name }).locator('visible=true');

/** La única pastilla con icono es la de «piden atención» (§7.2). */
const ATENCION = 'button[aria-pressed]:has(svg)';

test.describe('Creyentes', () => {
  test.beforeEach(async ({ page }) => {
    await montarApi(page, { believers: PERSONAS });
    await page.goto('/believers');
    await expect(persona(page, 'Andrés De prueba')).toBeVisible();
  });

  test('sin ninguna nota lo dice con palabras, no con un cero', async ({ page }) => {
    // Es la llamada más fuerte de la pantalla y por eso no se disfraza (§7.3).
    await expect(page.getByText(/^(sin notas|no notes)$/i).locator('visible=true')).toHaveCount(1);
  });

  test('quien ha agotado su margen se distingue sin depender del color', async ({ page }) => {
    // Filete a la izquierda además del icono y del texto: es lo que se ve
    // cuando la animación está apagada (Regla 3 §7).
    await expect(
      page.locator('[class*="border-l-destructive"]').locator('visible=true'),
    ).toHaveCount(1);
  });

  test('no hay scroll horizontal a ningún ancho', async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('El filtro de atención en escritorio', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('va a la URL y sobrevive a entrar en una ficha y volver', async ({ page }) => {
    await montarApi(page, { believers: PERSONAS });
    await page.goto('/believers');
    await expect(persona(page, 'Andrés De prueba')).toBeVisible();

    await page.locator(ATENCION).click();

    await expect(page).toHaveURL(/attention=true/);
    await expect(persona(page, 'María De prueba')).toBeVisible();
    await expect(persona(page, 'Andrés De prueba')).toHaveCount(0);

    // Se entra a una ficha y se vuelve: el filtro sigue puesto, porque vive en
    // la URL y no en un estado que se pierde al navegar (§7.2).
    await persona(page, 'María De prueba').click();
    await expect(page).toHaveURL(/\/believers\/[0-9a-f-]+$/);

    await page.goBack();
    await expect(page).toHaveURL(/attention=true/);
    await expect(persona(page, 'María De prueba')).toBeVisible();
  });
});

test.describe('El listado en un teléfono', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('las personas se leen como fichas y no como una tabla', async ({ page }) => {
    await montarApi(page, { believers: PERSONAS });
    await page.goto('/believers');

    await expect(persona(page, 'Andrés De prueba')).toBeVisible();
    // Una tabla de seis columnas aquí se leería desplazándose a lo ancho.
    await expect(page.locator('table')).toBeHidden();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('los filtros se abren en un panel y dicen cuántos hay puestos', async ({ page }) => {
    await montarApi(page, { believers: PERSONAS });
    await page.goto('/believers');
    await expect(persona(page, 'Andrés De prueba')).toBeVisible();

    // En línea ocuparían media pantalla antes de llegar al primer nombre (§7.7).
    await expect(page.locator(ATENCION)).toBeHidden();

    await page.getByRole('button', { name: /filtros|filters|filtre|filter/i }).click();
    // Con el panel abierto hay dos juegos de pastillas en el DOM —el de la
    // barra y el del panel—; se pulsa el que se está viendo.
    await page.locator(ATENCION).locator('visible=true').click();

    await expect(page).toHaveURL(/attention=true/);
    await expect(page.getByRole('button', { name: /\(1\)/ })).toBeVisible();
  });
});

/**
 * El alemán es el idioma más largo y el que rompe pastillas y botones (Reglas
 * 2 §9 y 5 §6), así que el ancho más estrecho se repite con él puesto.
 */
test.describe('Con el texto en alemán y a 375 px', () => {
  test.use({ viewport: { width: 375, height: 812 }, locale: 'de-DE' });

  test('sigue sin desbordarse a lo ancho', async ({ page }) => {
    await montarApi(page, { believers: PERSONAS });
    await page.goto('/believers');
    await expect(persona(page, 'Andrés De prueba')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('La bitácora de un hermano', () => {
  const PERSONA = believer(2, { firstName: 'Jesús' });
  const NOTAS = Array.from({ length: 25 }, (_unused, index) => note(index + 1));

  test.beforeEach(async ({ page }) => {
    await montarApi(page, { believers: [PERSONA], notes: NOTAS });
    await page.goto(`/believers/${PERSONA.id}`);
    await expect(page.getByRole('heading', { level: 1, name: /Jesús/ })).toBeVisible();
  });

  test('carga más notas al pulsar «Ver más»', async ({ page }) => {
    // De veinte en veinte, y con un botón explícito que funciona con teclado (D11).
    await expect(page.getByText('Nota 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Nota 21', { exact: true })).toHaveCount(0);

    await page
      .getByRole('button', { name: /ver más|show more|voir plus|mehr|vedi altro/i })
      .click();

    await expect(page.getByText('Nota 21', { exact: true })).toBeVisible();
  });

  test('se busca en el servidor, no en lo que ya se ha traído', async ({ page }) => {
    await page.getByRole('searchbox').fill('Nota 23');

    // La 23 está en la segunda página: si se filtrase aquí, no aparecería.
    await expect(page.getByText('Nota 23', { exact: true })).toBeVisible();
    await expect(page.getByText('Nota 1', { exact: true })).toHaveCount(0);
  });

  test('tiene cuatro formas de verse, y la elegida se recuerda', async ({ page }) => {
    const vistas = page.getByRole('tablist', {
      name: /bitácora|log|journal|diário|logbuch|diario/i,
    });
    await expect(vistas.getByRole('tab')).toHaveCount(4);

    // El calendario es la única que enseña los huecos: no lista notas.
    await vistas.getByRole('tab').last().click();
    await expect(page.getByText('Nota 1', { exact: true })).toHaveCount(0);

    // Se recuerda entre visitas: es preferencia de quien mira, no del enlace.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /Jesús/ })).toBeVisible();
    await expect(vistas.getByRole('tab').last()).toHaveAttribute('aria-selected', 'true');
  });
});
