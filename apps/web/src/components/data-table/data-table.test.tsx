import type { Paginated } from '@navis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Inbox } from 'lucide-react';
import { useMemo, type ComponentProps } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DataTable } from '@/components/data-table/data-table';
import { defineBulkAction } from '@/lib/data-table/bulk-actions';
import { Trash2 } from 'lucide-react';
import type { DataTableColumn } from '@/lib/data-table/columns';
import type { DataTableSource } from '@/lib/data-table/source';
import { useDataTableState } from '@/lib/data-table/use-data-table-state';
import { i18n } from '@/lib/i18n';

vi.mock('@/lib/auth-client', () => ({ useSession: () => ({ data: { user: { id: 'u1' } } }) }));

interface Person {
    id: string;
    name: string;
    age: number;
    group: 'a' | 'b';
}

const people: Person[] = Array.from({ length: 12 }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Persona ${String(index + 1).padStart(2, '0')}`,
    age: 20 + ((index * 7) % 30),
    group: index % 2 === 0 ? 'a' : 'b',
}));

function pageOf(items: Person[], page: number, limit: number, total: number): Paginated<Person> {
    return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

type Extra = Partial<ComponentProps<typeof DataTable<Person>>>;

function Harness({
    source,
    onSearch,
    extra,
}: {
    source: (page: number, limit: number) => DataTableSource<Person>;
    onSearch?: (search: string) => void;
    extra?: Extra;
}) {
    const columns = useMemo<DataTableColumn<Person>[]>(
        () => [
            {
                id: 'name',
                label: 'Nombre',
                kind: 'text',
                hideable: false,
                value: (p) => p.name,
                cell: (p) => p.name,
            },
            {
                id: 'age',
                label: 'Edad',
                kind: 'number',
                filterable: true,
                value: (p) => p.age,
                cell: (p) => p.age,
            },
            {
                id: 'group',
                label: 'Grupo',
                kind: 'select',
                filterable: true,
                facet: true,
                sortable: false,
                options: [
                    { value: 'a', label: 'Grupo A' },
                    { value: 'b', label: 'Grupo B' },
                ],
                value: (p) => p.group,
                cell: (p) => p.group,
            },
        ],
        [],
    );
    const state = useDataTableState('personas', columns);
    onSearch?.(state.request.search);
    const location = useLocation();

    return (
        <>
            <output data-testid="url">{location.search}</output>
            <DataTable
                columns={columns}
                state={state}
                source={source(state.request.page, state.request.limit)}
                getKey={(p) => p.id}
                emptyIcon={Inbox}
                emptyTitle="Nadie todavía"
                {...extra}
            />
        </>
    );
}

function mount(
    source: (page: number, limit: number) => DataTableSource<Person>,
    url = '/',
    extra?: Extra,
) {
    const queryClient = new QueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[url]}>
                <Harness source={source} extra={extra} />
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

const server =
    (over: Partial<Extract<DataTableSource<Person>, { kind: 'server' }>> = {}) =>
    (page: number, limit: number): DataTableSource<Person> => ({
        kind: 'server',
        page: pageOf(people.slice((page - 1) * limit, page * limit), page, limit, people.length),
        isLoading: false,
        isFetching: false,
        isError: false,
        ...over,
    });

const client =
    (items: Person[] = people) =>
    (): DataTableSource<Person> => ({
        kind: 'client',
        items,
        isLoading: false,
        isError: false,
    });

describe('DataTable', () => {
    beforeEach(() => {
        localStorage.clear();
        void i18n.changeLanguage('es');
    });

    it('en modo servidor pinta la página que llega y dice cuántas hay', () => {
        mount(server());
        expect(screen.getAllByText('Persona 01').length).toBeGreaterThan(0);
        expect(screen.getByText('1–10 de 12')).toBeInTheDocument();
        expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
        expect(screen.getAllByText('Persona 10')).toHaveLength(2); // tabla + ficha
    });

    it('pulsar una cabecera ordena, otra vez invierte y la tercera quita el orden', async () => {
        const user = userEvent.setup();
        mount(server());
        const header = () => screen.getByRole('button', { name: /^Ordenar por Nombre/ });

        await user.click(header());
        expect(screen.getByTestId('url')).toHaveTextContent('sort=name%3Aasc');
        expect(screen.getByText('Orden: Nombre ↑')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /Nombre/ })).toHaveAttribute(
            'aria-sort',
            'ascending',
        );

        await user.click(header());
        expect(screen.getByTestId('url')).toHaveTextContent('sort=name%3Adesc');

        await user.click(header());
        expect(screen.getByTestId('url')).not.toHaveTextContent('sort=');
    });

    it('con Mayús suma un segundo criterio y numera la prioridad', async () => {
        const user = userEvent.setup();
        mount(server());

        await user.click(screen.getByRole('button', { name: /^Ordenar por Nombre/ }));
        await user.keyboard('{Shift>}');
        await user.click(screen.getByRole('button', { name: /^Ordenar por Edad/ }));
        await user.keyboard('{/Shift}');

        expect(screen.getByTestId('url')).toHaveTextContent('sort=name%3Aasc%2Cage%3Aasc');
        expect(screen.getByText('Orden: Nombre ↑, Edad ↑')).toBeInTheDocument();
        const nombre = screen.getByRole('columnheader', { name: /Nombre/ });
        expect(within(nombre).getByText('1')).toBeInTheDocument();
    });

    it('cambiar de página mueve la URL y el tamaño se guarda como preferencia', async () => {
        const user = userEvent.setup();
        mount(server());

        await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
        expect(screen.getByTestId('url')).toHaveTextContent('page=2');
        expect(screen.getByText('11–12 de 12')).toBeInTheDocument();

        await user.selectOptions(screen.getByLabelText('Filas por página'), '5');
        expect(screen.getByText('1–5 de 12')).toBeInTheDocument();
        expect(screen.getByTestId('url')).not.toHaveTextContent('page=');
        expect(localStorage.getItem('navis.table.u1.personas.prefs')).toContain('"pageSize":5');
    });

    it('vuelve a la última página si la pedida ya no existe', () => {
        mount(server(), '/?page=9');
        expect(screen.getByText('11–12 de 12')).toBeInTheDocument();
        expect(screen.getByTestId('url')).toHaveTextContent('page=2');
    });

    it('muestra el esqueleto mientras carga y no enseña filas', () => {
        mount(server({ isLoading: true, page: undefined }));
        expect(screen.queryByText('Persona 01')).not.toBeInTheDocument();
        expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    });

    it('con error ofrece reintentar y no deja filas viejas', async () => {
        const onRetry = vi.fn();
        const user = userEvent.setup();
        mount(server({ isError: true, onRetry }));

        expect(screen.queryByText('Persona 01')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Reintentar' }));
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it('sin filas dice por qué, con el texto de la pantalla', () => {
        mount(client([]));
        expect(screen.getByText('Nadie todavía')).toBeInTheDocument();
    });

    it('en modo cliente busca, ordena y pagina por su cuenta', async () => {
        const user = userEvent.setup();
        mount(client());

        expect(screen.getByText('1–10 de 12')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /^Ordenar por Nombre/ }));
        await user.click(screen.getByRole('button', { name: /^Ordenar por Nombre/ }));
        const firstRow = screen.getAllByRole('row')[1];
        expect(within(firstRow).getByText('Persona 12')).toBeInTheDocument();

        await user.type(screen.getByRole('searchbox'), 'persona 12');
        expect(await screen.findByText('1–1 de 1')).toBeInTheDocument();
    });

    it('en pantallas estrechas el orden se elige en un selector', async () => {
        const user = userEvent.setup();
        mount(server());

        await user.selectOptions(screen.getByLabelText('Ordenar por'), 'age');
        expect(screen.getByTestId('url')).toHaveTextContent('sort=age%3Aasc');

        await user.click(screen.getByRole('button', { name: 'Invertir el orden' }));
        expect(screen.getByTestId('url')).toHaveTextContent('sort=age%3Adesc');
    });

    describe('filtros', () => {
        it('el botón rápido filtra, pone un chip y el chip lo quita', async () => {
            const user = userEvent.setup();
            mount(client());

            await user.click(screen.getByRole('button', { name: /^Grupo/ }));
            await user.click(screen.getByRole('checkbox', { name: 'Grupo B' }));

            expect(screen.getByText('1–6 de 6')).toBeInTheDocument();
            expect(screen.getByTestId('url')).toHaveTextContent('f=');
            expect(screen.getByLabelText('Filtros activos')).toHaveTextContent(
                'Grupo es uno de Grupo B',
            );

            await user.click(screen.getByRole('button', { name: /^Quitar el filtro Grupo/ }));
            expect(screen.getByText('1–10 de 12')).toBeInTheDocument();
            expect(screen.queryByLabelText('Filtros activos')).not.toBeInTheDocument();
        });

        it('los filtros avanzados aplican una condición numérica y «Quitar filtros» las borra', async () => {
            const user = userEvent.setup();
            mount(client());

            await user.click(screen.getByRole('button', { name: /Filtros avanzados/ }));
            await user.selectOptions(screen.getByLabelText('Edad: Condición'), 'gt');
            await user.type(screen.getByLabelText('Edad: Edad'), '40');

            expect(await screen.findByText('Edad mayor que 40')).toBeInTheDocument();
            const expected = people.filter((person) => person.age > 40).length;
            expect(screen.getByText(`1–${expected} de ${expected}`)).toBeInTheDocument();

            await user.click(screen.getAllByRole('button', { name: 'Quitar filtros' })[0]);
            expect(screen.getByText('1–10 de 12')).toBeInTheDocument();
        });

        it('un filtro de la URL se ve como chip y filtra desde el primer pintado', () => {
            const f = encodeURIComponent(
                JSON.stringify([{ columnId: 'group', operator: 'in', value: ['a'] }]),
            );
            mount(client(), `/?f=${f}`);
            expect(screen.getByText('1–6 de 6')).toBeInTheDocument();
        });

        it('sin resultados que cumplan, dice por qué con el texto de la pantalla', async () => {
            const user = userEvent.setup();
            mount(client());

            await user.click(screen.getByRole('button', { name: /Filtros avanzados/ }));
            await user.selectOptions(screen.getByLabelText('Edad: Condición'), 'gt');
            await user.type(screen.getByLabelText('Edad: Edad'), '999');

            expect(await screen.findByText('Nadie todavía')).toBeInTheDocument();
        });
    });

    describe('columnas', () => {
        it('ocultar una columna la quita de la tabla, lo avisa y se recuerda', async () => {
            const user = userEvent.setup();
            mount(client());

            await user.click(screen.getByRole('button', { name: /^Columnas/ }));
            await user.click(screen.getByRole('checkbox', { name: 'Edad' }));

            expect(screen.queryByRole('columnheader', { name: /Edad/ })).not.toBeInTheDocument();
            expect(screen.getByText('Columnas ocultas: 1')).toBeInTheDocument();
            expect(localStorage.getItem('navis.table.u1.personas.prefs')).toContain('"age":false');

            await user.click(screen.getByRole('button', { name: 'Restablecer columnas' }));
            expect(screen.getByRole('columnheader', { name: /Edad/ })).toBeInTheDocument();
            expect(screen.queryByText('Columnas ocultas: 1')).not.toBeInTheDocument();
        });

        it('las flechas cambian el orden y el nombre no se puede ocultar', async () => {
            const user = userEvent.setup();
            mount(client());

            await user.click(screen.getByRole('button', { name: /^Columnas/ }));
            expect(screen.queryByRole('checkbox', { name: 'Nombre' })).not.toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: 'Subir Grupo' }));
            const headers = screen.getAllByRole('columnheader').map((header) => header.textContent);
            expect(headers.findIndex((text) => text?.includes('Grupo'))).toBeLessThan(
                headers.findIndex((text) => text?.includes('Edad')),
            );
        });
    });

    describe('selección y acciones masivas', () => {
        const rowLabel = (p: Person) => `Seleccionar ${p.name}`;
        const box = (name: string) => screen.getAllByRole('checkbox', { name })[0];

        it('sin acciones no hay casillas: es opt-in', () => {
            mount(client());
            expect(screen.queryByRole('checkbox', { name: /Seleccionar/ })).not.toBeInTheDocument();
        });

        it('marcar filas enseña la barra con cuántas hay y la acción que se declaró', async () => {
            const user = userEvent.setup();
            const run = vi.fn();
            const action = defineBulkAction<Person>({
                id: 'archivar',
                label: 'Archivar',
                icon: Trash2,
                run,
            });
            mount(client(), '/', { bulkActions: [action], rowLabel });

            await user.click(box('Seleccionar Persona 01'));
            await user.click(box('Seleccionar Persona 02'));
            expect(screen.getByText('Seleccionadas: 2')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: 'Archivar' }));
            expect(run).toHaveBeenCalledOnce();
            const received = run.mock.calls[0]?.[0] as Person[];
            expect(received.map((p) => p.name)).toEqual(['Persona 01', 'Persona 02']);
            // Sale bien: la selección se vacía sola.
            await waitFor(() => {
                expect(screen.queryByText(/Seleccionadas:/)).not.toBeInTheDocument();
            });
        });

        it('el «seleccionar todo» marca la página y tiene estado intermedio', async () => {
            const user = userEvent.setup();
            const action = defineBulkAction<Person>({
                id: 'x',
                label: 'X',
                icon: Trash2,
                run: vi.fn(),
            });
            mount(client(), '/', { bulkActions: [action], rowLabel });

            const all = screen.getByRole('checkbox', {
                name: 'Seleccionar todas las filas de esta página',
            });
            await user.click(box('Seleccionar Persona 01'));
            expect((all as HTMLInputElement).indeterminate).toBe(true);

            await user.click(all);
            expect(screen.getByText('Seleccionadas: 10')).toBeInTheDocument();
            await user.click(all);
            expect(screen.queryByText(/Seleccionadas:/)).not.toBeInTheDocument();
        });

        it('una acción con confirmación no corre hasta confirmar, y dice cuántas van', async () => {
            const user = userEvent.setup();
            const run = vi.fn();
            const action = defineBulkAction<Person>({
                id: 'borrar',
                label: 'Borrar',
                icon: Trash2,
                tone: 'destructive',
                confirm: (items) => ({
                    title: `Borrar ${items.length} personas`,
                    description: 'No se puede deshacer.',
                    confirmLabel: 'Sí, borrar',
                    destructive: true,
                }),
                run,
            });
            mount(client(), '/', { bulkActions: [action], rowLabel });

            await user.click(box('Seleccionar Persona 03'));
            await user.click(screen.getByRole('button', { name: 'Borrar' }));
            expect(run).not.toHaveBeenCalled();
            expect(screen.getByText('Borrar 1 personas')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: 'Sí, borrar' }));
            expect(run).toHaveBeenCalledOnce();
        });

        it('si la acción falla se conserva la selección', async () => {
            const user = userEvent.setup();
            const action = defineBulkAction<Person>({
                id: 'falla',
                label: 'Fallar',
                icon: Trash2,
                run: () => Promise.reject(new Error('caída')),
            });
            mount(client(), '/', { bulkActions: [action], rowLabel });

            await user.click(box('Seleccionar Persona 01'));
            await user.click(screen.getByRole('button', { name: 'Fallar' }));

            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Fallar' })).toBeEnabled();
            });
            expect(screen.getByText('Seleccionadas: 1')).toBeInTheDocument();
        });

        it('una acción puede bloquearse según lo marcado, y no corre', async () => {
            const user = userEvent.setup();
            const run = vi.fn();
            const action = defineBulkAction<Person>({
                id: 'solo-a',
                label: 'Solo grupo A',
                icon: Trash2,
                blockedReason: (items) =>
                    items.some((p) => p.group === 'b') ? 'Hay del grupo B' : undefined,
                run,
            });
            mount(client(), '/', { bulkActions: [action], rowLabel });

            await user.click(box('Seleccionar Persona 02'));
            expect(screen.getByRole('button', { name: 'Solo grupo A' })).toBeDisabled();
        });

        it('una fila que no se puede marcar tiene la casilla deshabilitada', () => {
            const action = defineBulkAction<Person>({
                id: 'x',
                label: 'X',
                icon: Trash2,
                run: vi.fn(),
            });
            mount(client(), '/', {
                bulkActions: [action],
                rowLabel,
                isSelectable: (p) => p.group === 'a',
            });
            expect(box('Seleccionar Persona 02')).toBeDisabled();
            expect(box('Seleccionar Persona 01')).toBeEnabled();
        });

        it('cambiar un filtro vacía la selección: no se actúa sobre filas que ya no se ven', async () => {
            const user = userEvent.setup();
            const action = defineBulkAction<Person>({
                id: 'x',
                label: 'X',
                icon: Trash2,
                run: vi.fn(),
            });
            mount(client(), '/', { bulkActions: [action], rowLabel });

            await user.click(box('Seleccionar Persona 01'));
            expect(screen.getByText('Seleccionadas: 1')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /^Grupo/ }));
            await user.click(screen.getByRole('checkbox', { name: 'Grupo B' }));
            expect(screen.queryByText(/Seleccionadas:/)).not.toBeInTheDocument();
        });
    });

    describe('exportar', () => {
        it('sin configuración de exportación no hay botón', () => {
            mount(client());
            expect(screen.queryByRole('button', { name: 'Exportar' })).not.toBeInTheDocument();
        });

        it('el botón abre el diálogo con lo que se ve: filas y formatos', async () => {
            const user = userEvent.setup();
            mount(client(), '/', { exportConfig: { label: 'Personas' } });

            await user.click(screen.getByRole('button', { name: 'Exportar' }));
            const dialog = await screen.findByRole('dialog');
            expect(within(dialog).getAllByText(/12 de 12 filas/).length).toBeGreaterThan(0);
            expect(within(dialog).getByRole('button', { name: 'Excel' })).toBeInTheDocument();
        });

        it('«Exportar selección» lleva solo las marcadas y no vacía la selección', async () => {
            const user = userEvent.setup();
            mount(client(), '/', {
                exportConfig: { label: 'Personas' },
                selectable: true,
                rowLabel: (p) => `Seleccionar ${p.name}`,
            });

            await user.click(
                screen.getAllByRole('checkbox', {
                    name: 'Seleccionar Persona 01',
                })[0],
            );
            await user.click(
                screen.getAllByRole('checkbox', {
                    name: 'Seleccionar Persona 04',
                })[0],
            );
            await user.click(screen.getByRole('button', { name: 'Exportar selección' }));

            const dialog = await screen.findByRole('dialog');
            expect(within(dialog).getAllByText(/2 de 2 filas/).length).toBeGreaterThan(0);
            expect(
                within(dialog).getAllByText(/Solo las filas seleccionadas/).length,
            ).toBeGreaterThan(0);
            expect(screen.getByText('Seleccionadas: 2')).toBeInTheDocument();
        });

        it('lo que se exporta respeta los filtros puestos y lo dice en el fichero', async () => {
            const user = userEvent.setup();
            const f = encodeURIComponent(
                JSON.stringify([{ columnId: 'group', operator: 'in', value: ['a'] }]),
            );
            mount(client(), `/?f=${f}`, { exportConfig: { label: 'Personas' } });

            await user.click(screen.getByRole('button', { name: 'Exportar' }));
            const dialog = await screen.findByRole('dialog');
            expect(
                within(dialog).getAllByText(/6 de 6 filas.*Grupo es uno de Grupo A/).length,
            ).toBeGreaterThan(0);
        });
    });

    describe('vistas y densidad', () => {
        it('guarda la combinación actual con nombre y la recupera con un clic', async () => {
            const user = userEvent.setup();
            const f = encodeURIComponent(
                JSON.stringify([{ columnId: 'group', operator: 'in', value: ['a'] }]),
            );
            mount(client(), `/?f=${f}`);
            expect(screen.getByText('1–6 de 6')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /^Vistas/ }));
            await user.type(screen.getByLabelText('Nombre de la vista'), 'Solo grupo A');
            await user.click(screen.getByRole('button', { name: 'Guardar vista' }));
            expect(
                screen.getByRole('button', { name: 'Aplicar la vista Solo grupo A' }),
            ).toBeInTheDocument();
            expect(localStorage.getItem('navis.table.u1.personas.prefs')).toContain('Solo grupo A');

            // Se quitan los filtros y la vista los devuelve.
            await user.click(screen.getAllByRole('button', { name: 'Quitar filtros' })[0]);
            expect(screen.getByText('1–10 de 12')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /^Vistas/ }));
            await user.click(screen.getByRole('button', { name: 'Aplicar la vista Solo grupo A' }));
            expect(screen.getByText('1–6 de 6')).toBeInTheDocument();
        });

        it('una vista se puede eliminar', async () => {
            const user = userEvent.setup();
            mount(client());

            await user.click(screen.getByRole('button', { name: /^Vistas/ }));
            await user.type(screen.getByLabelText('Nombre de la vista'), 'Temporal');
            await user.click(screen.getByRole('button', { name: 'Guardar vista' }));
            await user.click(screen.getByRole('button', { name: 'Eliminar la vista Temporal' }));

            expect(screen.getByText('Todavía no hay vistas guardadas')).toBeInTheDocument();
        });

        it('la densidad cambia el alto de las filas y se recuerda', async () => {
            const user = userEvent.setup();
            mount(client());
            const wrapper = () => document.querySelector('[data-density]');
            expect(wrapper()).toHaveAttribute('data-density', 'normal');

            await user.click(screen.getByRole('button', { name: /^Columnas/ }));
            await user.click(screen.getByRole('button', { name: 'Compacta' }));

            expect(wrapper()).toHaveAttribute('data-density', 'compact');
            expect(localStorage.getItem('navis.table.u1.personas.prefs')).toContain(
                '"density":"compact"',
            );
        });
    });
});
