import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

import { believer, montarApi } from './servidor';

/**
 * Exportar el listado (RFC 0009).
 *
 * Lo que se comprueba aquí es lo que no puede comprobar un test de unidad: que
 * el diálogo dice **qué se lleva** antes de descargar nada, que cambiar de
 * formato cambia la hoja, y que al pulsar sale un fichero de verdad con el
 * nombre que toca.
 *
 * El PDF y la imagen **solo se pueden probar aquí**: rasterizan la lámina en un
 * `<canvas>`, y eso no existe en jsdom. De ellos se comprueba la firma del
 * fichero, que es lo que dice que el rasterizado ha llegado hasta el final.
 */
test.use({ serviceWorkers: 'block' });

const PERSONAS = [
  believer(1, { firstName: 'Andrés' }),
  believer(2, { firstName: 'Lucía' }),
  believer(3, { firstName: 'María' }),
];

const EXPORTAR = /^(exportar|export|exporter|exportieren|esporta)$/i;
const DESCARGAR = /descargar|download|télécharger|descarregar|herunterladen|scarica/i;

test.describe('Exportar creyentes', () => {
  test.beforeEach(async ({ page }) => {
    await montarApi(page, { believers: PERSONAS });
    await page.goto('/believers');
    await expect(page.getByRole('link', { name: 'Andrés De prueba' }).first()).toBeVisible();

    await page.getByRole('button', { name: EXPORTAR }).locator('visible=true').first().click();
  });

  test('dice cuántas filas se lleva antes de descargar nada', async ({ page }) => {
    const dialogo = page.getByRole('dialog');

    await expect(dialogo).toBeVisible();
    // «3 de 3 filas» en los seis idiomas: lo que importa son las dos cifras.
    await expect(dialogo.getByText(/3.*3/).first()).toBeVisible();
  });

  test('la hoja enseña las primeras filas de verdad, no un dibujo', async ({ page }) => {
    await expect(page.getByRole('dialog').getByText('Andrés').first()).toBeVisible();
  });

  test('cambiar de formato cambia la hoja', async ({ page }) => {
    const dialogo = page.getByRole('dialog');

    // En Excel la muestra es una tabla; en CSV, texto con comas.
    await expect(dialogo.locator('table')).toBeVisible();

    await dialogo.getByRole('button', { name: 'CSV' }).click();

    await expect(dialogo.locator('pre')).toBeVisible();
    await expect(dialogo.locator('table')).toHaveCount(0);
  });

  test('descarga un CSV con el nombre que se entiende sin abrirlo', async ({ page }) => {
    const dialogo = page.getByRole('dialog');
    await dialogo.getByRole('button', { name: 'CSV' }).click();

    const descarga = page.waitForEvent('download');
    await dialogo
      .getByRole('button', {
        name: DESCARGAR,
      })
      .click();

    // `navis-creyentes-2026-08-05.csv`: sin acentos, sin espacios y con la fecha.
    expect((await descarga).suggestedFilename()).toMatch(/^navis-[a-z]+-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  test('descarga un Excel de verdad, con su tipo y su extensión', async ({ page }) => {
    const descarga = page.waitForEvent('download');
    await page
      .getByRole('dialog')
      .getByRole('button', {
        name: DESCARGAR,
      })
      .click();

    expect((await descarga).suggestedFilename()).toMatch(/\.xlsx$/);
  });

  /**
   * El PDF y la imagen son los únicos que **rasterizan** la lámina en un
   * `<canvas>`, así que son los únicos que no se pueden probar sin navegador.
   * Aquí se comprueba lo que importa: que sale un fichero y que empieza por lo
   * que tiene que empezar.
   */
  test('el PDF sale con su firma de fichero PDF', async ({ page }) => {
    const dialogo = page.getByRole('dialog');
    await dialogo.getByRole('button', { name: 'PDF' }).click();

    const descarga = page.waitForEvent('download');
    await dialogo.getByRole('button', { name: DESCARGAR }).click();

    const fichero = await descarga;
    expect(fichero.suggestedFilename()).toMatch(/\.pdf$/);

    const ruta = await fichero.path();
    const cabecera = await readFile(ruta, { encoding: 'latin1' });
    expect(cabecera.slice(0, 5)).toBe('%PDF-');
    expect(cabecera).toContain('%%EOF');
  });

  test('la imagen sale con su firma de PNG', async ({ page }) => {
    const dialogo = page.getByRole('dialog');
    await dialogo.getByRole('button', { name: /imagen|image|bild|immagine/i }).click();

    const descarga = page.waitForEvent('download');
    await dialogo.getByRole('button', { name: DESCARGAR }).click();

    const fichero = await descarga;
    expect(fichero.suggestedFilename()).toMatch(/\.png$/);

    const bytes = await readFile(await fichero.path());
    expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  test('no hay scroll horizontal con el diálogo abierto', async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
  });
});
