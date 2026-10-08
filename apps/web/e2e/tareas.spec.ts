import { expect, test, type Page } from '@playwright/test';

import {
    FLUJO_PREDICACION,
    FLUJO_VISITAS,
    flujo,
    montarTareas,
    ocurrencia,
} from './tareas-servidor';

/**
 * Tareas (RFC 0018, Fase 7): el flujo y el límite en el listado, el filtro por
 * flujo y el cronómetro de una tarea.
 *
 * Sin service worker: con él, tras una recarga los `page.route` de este
 * fichero dejan de verse (mismo motivo que `creyentes.spec.ts`).
 */
test.use({ serviceWorkers: 'block', locale: 'es-ES' });

const hoy = new Date().toISOString().slice(0, 10);
const dia = (delta: number) =>
    new Date(Date.parse(`${hoy}T12:00:00Z`) + delta * 86_400_000).toISOString().slice(0, 10);

const VISITAS = flujo(FLUJO_VISITAS, 'Visitas', '#0e7490');
const PREDICACION = flujo(FLUJO_PREDICACION, 'Predicación', '#2140cf');

const TAREAS = [
    ocurrencia(1, {
        title: 'Visitar a Carmen',
        workflow: { id: VISITAS.id, name: VISITAS.name, accent: VISITAS.accent },
        dueDate: dia(3),
    }),
    ocurrencia(2, {
        title: 'Preparar el sermón',
        workflow: { id: PREDICACION.id, name: PREDICACION.name, accent: PREDICACION.accent },
        dueDate: dia(-2),
    }),
    ocurrencia(3, { title: 'Llamar a Andrés' }),
];

async function abrirListado(page: Page) {
    const server = await montarTareas(page, { tasks: TAREAS, workflows: [VISITAS, PREDICACION] });
    await page.goto('/tasks/list?date=week');
    await expect(page.getByRole('button', { name: /Visitar a Carmen/ })).toBeVisible();
    return server;
}

test.describe('El flujo y el límite en el listado', () => {
    test('cada tarea enseña su flujo y cuándo vence, y la vencida lo dice con la palabra', async ({
        page,
    }) => {
        await abrirListado(page);
        const carmen = page.getByRole('button', { name: /Visitar a Carmen/ });
        await expect(carmen.getByText('Visitas')).toBeVisible();
        await expect(carmen.getByText(/^Vence /)).toBeVisible();

        const sermon = page.getByRole('button', { name: /Preparar el sermón/ });
        await expect(sermon.getByText('Predicación')).toBeVisible();
        await expect(sermon.getByText(/^Vencida · /)).toBeVisible();

        const andres = page.getByRole('button', { name: /Llamar a Andrés/ });
        await expect(andres.getByText(/Vence|Vencida/)).toHaveCount(0);
    });

    test('filtrar por flujo pide solo ese flujo y deja las demás fuera', async ({ page }) => {
        const server = await abrirListado(page);
        await page.getByLabel('Flujo').selectOption(FLUJO_VISITAS);
        await expect(page.getByRole('button', { name: /Preparar el sermón/ })).toHaveCount(0);
        await expect(page.getByRole('button', { name: /Visitar a Carmen/ })).toBeVisible();
        expect(
            server.consultas.some((query) => query.includes(`workflowId=${FLUJO_VISITAS}`)),
        ).toBe(true);

        await page.getByLabel('Flujo').selectOption('');
        await expect(page.getByRole('button', { name: /Preparar el sermón/ })).toBeVisible();
    });
});

test.describe('El cronómetro', () => {
    test('empezar en una tarea enseña la barra «en marcha» y parar la quita', async ({ page }) => {
        const server = await abrirListado(page);
        await expect(page.getByRole('status')).toHaveCount(0);

        await page.getByRole('button', { name: /Visitar a Carmen/ }).click();
        await page.getByRole('button', { name: 'Empezar' }).click();
        await expect(page.getByText(/^En marcha · /)).toBeVisible();
        expect(server.arrancadas).toHaveLength(1);

        await page.keyboard.press('Escape');
        const barra = page.getByRole('status', { name: /Visitar a Carmen/ });
        await expect(barra).toBeVisible();
        await expect(barra.getByText(/^0[1-9]:\d\d$/)).toBeVisible();

        await barra.getByRole('button', { name: 'Parar' }).click();
        await expect(page.getByRole('status')).toHaveCount(0);
    });
});
