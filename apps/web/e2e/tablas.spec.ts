import { expect, test, type Page } from '@playwright/test';

import { montarApi, type StubTable } from './servidor';

/**
 * Los filtros de las tablas personalizadas (mejora del RFC 0021, plan
 * `docs/filtros-tablas-plan.md`): popover por columna, chips activos, menú
 * aditivo, filtros en la URL y guardarlos como vista.
 *
 * Sin service worker: con él, tras una recarga los `page.route` dejan de
 * verse (CLAUDE.md, «En Playwright, un service worker activo…»).
 */
test.use({ serviceWorkers: 'block' });

const TABLA: StubTable = {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Inventario del sonido',
    slug: 'inventario-del-sonido',
    columns: [
        { id: 'col-1', key: 'nombre', label: 'Nombre', type: 'text' },
        {
            id: 'col-2',
            key: 'estado',
            label: 'Estado',
            type: 'single_select',
            options: [
                { value: 'bueno', label: 'Bueno' },
                { value: 'roto', label: 'Roto' },
            ],
        },
        { id: 'col-3', key: 'precio', label: 'Precio', type: 'number' },
        { id: 'col-4', key: 'secreto', label: 'Secreto', type: 'password' },
    ],
    rows: [
        { id: 'row-1', data: { nombre: 'Micrófono Shure', estado: 'bueno', precio: 120 } },
        { id: 'row-2', data: { nombre: 'Cable XLR', estado: 'roto', precio: 5 } },
        { id: 'row-3', data: { nombre: 'Pedestal de altavoz', estado: 'bueno' } },
    ],
};

/** Monta la API y abre la ficha de la tabla. */
async function abrirTabla(page: Page, ruta = `/tables/${TABLA.slug}`): Promise<void> {
    await montarApi(page, { believers: [], tables: [TABLA] });
    // El idioma lo decide el navegador; aquí lo fijamos para que los textos de
    // los selectores sean los de `es` en cualquier máquina (como el resto del
    // repo hace con `navis.locale`, ver `lib/i18n.ts`).
    await page.addInitScript(() => {
        globalThis.localStorage.setItem('navis.locale', 'es');
    });
    await page.goto(ruta);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/**
 * Una celda se pinta dos veces en el DOM —la tabla de `md` para arriba y las
 * fichas por debajo— y el CSS esconde la que no toca: el aserto va sobre lo
 * **visible** en el ancho del test, no sobre los dos (Regla 5).
 */
function fila(page: Page, texto: string): ReturnType<Page['getByText']> {
    return page.getByText(texto).locator('visible=true');
}

test.describe('La cuadrícula sin filtros', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('enseña las filas y ningún control de filtro ocupando la pantalla', async ({ page }) => {
        await abrirTabla(page);

        await expect(fila(page, 'Micrófono Shure')).toBeVisible();
        await expect(fila(page, 'Cable XLR')).toBeVisible();

        // Sin filtros no hay chips: la tabla queda sola.
        await expect(page.getByRole('button', { name: 'Filtro' })).toBeVisible();
    });

    test('las cabeceras ordenan al clicar', async ({ page }) => {
        await abrirTabla(page);

        // El orden de la cuadrícula no viaja en la URL, pero la cabecera sí
        // declara su estado (`aria-sort`), y eso es lo que comprueba este test.
        await page.getByRole('button', { name: /^Ordenar por: Nombre$/ }).click();
        await expect(page.getByRole('columnheader', { name: /Nombre/ })).toHaveAttribute(
            'aria-sort',
            'ascending',
        );
    });
});

test.describe('El popover de filtro por cabecera', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('filtra por una columna desde su cabecera y lo confirma con un aviso', async ({
        page,
    }) => {
        await abrirTabla(page);

        await page.getByRole('button', { name: 'Filtrar por Estado' }).click();
        await expect(page.getByRole('dialog', { name: 'Estado' })).toBeVisible();

        await page.getByRole('button', { name: 'Bueno' }).click();

        // El chip nace y el toast confirma la acción (peticiones web: 'Filtro aplicado').
        await expect(page.getByText('Filtro aplicado')).toBeVisible();
        await expect(page.getByText('Bueno', { exact: true }).first()).toBeVisible();

        // El filtrado se ve: solo quedan las filas buenas (el stub filtra de verdad).
        await expect(fila(page, 'Micrófono Shure')).toBeVisible();
        await expect(fila(page, 'Cable XLR')).toBeHidden();
    });

    test('el chip se puede editar al tocarlo y quitar con la X', async ({ page }) => {
        await abrirTabla(page);

        await page.getByRole('button', { name: 'Filtrar por Estado' }).click();
        await page.getByRole('button', { name: 'Bueno' }).click();

        // El panel se queda abierto a propósito (Notion/Airtable); se cierra con
        // Escape para volver a la tabla y tocar el chip.
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog', { name: 'Estado' })).toBeHidden();

        await page.getByRole('button', { name: /^Estado/ }).click();
        await expect(page.getByRole('dialog', { name: 'Estado' })).toBeVisible();

        // Quitarlo: desaparece la única opción activa y vuelve la fila rota.
        await page.getByRole('button', { name: 'Bueno', exact: true }).click();
        await expect(fila(page, 'Cable XLR')).toBeVisible();
    });
});

test.describe('El menú de filtros de la barra', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('añade un filtro por columna y muestra cuántos hay', async ({ page }) => {
        await abrirTabla(page);

        await page.getByRole('button', { name: 'Filtro', exact: true }).click();
        await page.getByRole('button', { name: /^Precio/ }).click();

        await page.getByPlaceholder('Valor mínimo').fill('100');

        await expect(page.getByRole('button', { name: 'Filtro (1)' })).toBeVisible();
        await expect(fila(page, 'Micrófono Shure')).toBeVisible();
        await expect(fila(page, 'Cable XLR')).toBeHidden();
    });

    test('la contraseña no aparece entre las columnas filtrables (D29)', async ({ page }) => {
        await abrirTabla(page);

        await page.getByRole('button', { name: 'Filtro', exact: true }).click();

        await expect(page.getByRole('button', { name: /^Secreto/ })).toHaveCount(0);
    });
});

test.describe('Los filtros viven en la URL', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('recargar conserva el filtrado y compartir por enlace lo reproduce', async ({ page }) => {
        await abrirTabla(page);

        await page.getByRole('button', { name: 'Filtrar por Estado' }).click();
        await page.getByRole('button', { name: 'Roto' }).click();

        await expect(page).toHaveURL(/f=/);

        await page.reload();
        await expect(fila(page, 'Cable XLR')).toBeVisible();
        await expect(fila(page, 'Micrófono Shure')).toBeHidden();
    });
});

test.describe('Guardar los filtros como vista', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('el diálogo de vista trae los filtros que había', async ({ page }) => {
        await abrirTabla(page);

        await page.getByRole('button', { name: 'Filtrar por Estado' }).click();
        await page.getByRole('button', { name: 'Bueno' }).click();

        await page.getByRole('button', { name: 'Guardar filtros como vista' }).click();

        await expect(page.getByText(/La vista guardará 1 filtros activos/)).toBeVisible();
    });
});

test.describe('En móvil', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('la toolbar es una fila y los filtros se aplican igual', async ({ page }) => {
        await abrirTabla(page);

        await page.getByRole('button', { name: 'Filtro', exact: true }).click();
        await page.getByRole('button', { name: /^Estado/ }).click();
        await page.getByRole('button', { name: 'Bueno' }).click();

        await expect(fila(page, 'Micrófono Shure')).toBeVisible();
        await expect(fila(page, 'Cable XLR')).toBeHidden();

        const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
    });
});
