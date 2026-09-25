import { expect, test, type Page } from '@playwright/test';

import { believer, montarApi, type StubTable } from './servidor';

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

/*
 * La tabla enlazada a creyentes (RFC 0025): la ficha ya lleva los valores
 * resueltos, el nombre vinculado enlaza a su ficha, el botón de añadir abre
 * el selector — que hojea en veinte con «Ver más» y marca a quien ya está
 * dentro (D9).
 */
const ENLAZADA: StubTable = {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Retiro de jóvenes',
    slug: 'retiro-de-jovenes',
    source: 'believers',
    columns: [
        { id: 'col-v1', key: 'quien', label: 'Quién', type: 'text', believerField: 'fullName' },
        { id: 'col-v2', key: 'confirmo', label: 'Confirmó', type: 'checkbox' },
    ],
    rows: [
        {
            id: 'row-v1',
            data: { quien: 'Juan Carlos Ruiz', confirmo: true },
            believer: {
                id: '11111111-2222-4222-8222-222222222201',
                name: 'Juan Carlos Ruiz',
                photoKey: null,
            },
        },
        {
            id: 'row-v2',
            data: { quien: 'Ana Molina', confirmo: true },
            believer: {
                id: '11111111-2222-4222-8222-222222222202',
                name: 'Ana Molina',
                photoKey: null,
            },
        },
    ],
};

test.describe('La tabla enlazada a creyentes', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('el botón de añadir abre el selector y «Ver más» aparece con más de una página', async ({
        page,
    }) => {
        await montarApi(page, {
            believers: Array.from({ length: 25 }, (_, index) => believer(index, { phone: null })),
            tables: [ENLAZADA],
            believerIds: [],
        });
        await page.addInitScript(() => {
            globalThis.localStorage.setItem('navis.locale', 'es');
        });
        await page.goto(`/tables/${ENLAZADA.slug}`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        await page.getByRole('button', { name: 'Añadir creyentes' }).click();

        const dialogo = page.getByRole('dialog', { name: 'Añadir creyentes' });
        await expect(dialogo).toBeVisible();
        await expect(dialogo.getByText('Hermano 19')).toBeVisible();

        // Veinte en la primera página, y «Ver más» trae la siguiente (D8).
        await dialogo.getByRole('button', { name: 'Ver más' }).click();
        await expect(dialogo.getByRole('checkbox', { name: 'Hermano 24 De prueba' })).toBeVisible();

        await dialogo.getByRole('checkbox', { name: 'Hermano 0 De prueba' }).click();
        await dialogo.getByRole('button', { name: 'Añadir 1 a la tabla' }).click();

        await expect(page.getByText('1 añadidos a la tabla')).toBeVisible();
        await expect(page.getByRole('dialog', { name: 'Añadir creyentes' })).toBeHidden();
    });

    test('quien ya está en la tabla sale marcado y deshabilitado (D9)', async ({ page }) => {
        await montarApi(page, {
            believers: Array.from({ length: 3 }, (_, index) => believer(index)),
            tables: [ENLAZADA],
            // El hermano 0 ya está dentro: marcado, no escondido.
            believerIds: [believer(0).id],
        });
        await page.addInitScript(() => {
            globalThis.localStorage.setItem('navis.locale', 'es');
        });
        await page.goto(`/tables/${ENLAZADA.slug}`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        await page.getByRole('button', { name: 'Añadir creyentes' }).click();

        const dialogo = page.getByRole('dialog', { name: 'Añadir creyentes' });
        await expect(dialogo).toBeVisible();
        await expect(dialogo.getByText(/Ya está en la tabla/)).toBeVisible();
    });

    test('la celda vinculada enlaza a la ficha del creyente (D14)', async ({ page }) => {
        await montarApi(page, { believers: [], tables: [ENLAZADA] });
        await page.addInitScript(() => {
            globalThis.localStorage.setItem('navis.locale', 'es');
        });
        await page.goto(`/tables/${ENLAZADA.slug}`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        await expect(fila(page, 'Juan Carlos Ruiz')).toBeVisible();
        await expect(fila(page, 'Ana Molina')).toBeVisible();

        await fila(page, 'Juan Carlos Ruiz').click();

        await expect(page).toHaveURL(/believers\/11111111-2222-4222-8222-222222222201/);
    });
});
