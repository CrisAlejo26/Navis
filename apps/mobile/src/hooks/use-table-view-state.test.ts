import { act, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTableViewState } from './use-table-view-state';
import type { CustomTableView, CustomTableColumn } from '@navis/shared';
import { initialViewState, sanitizeState } from '@/lib/tables/view-state';

const column: CustomTableColumn = {
    id: 'column',
    tableId: 'table',
    key: 'status',
    label: 'Estado',
    type: 'single_select',
    required: false,
    isActive: true,
    position: 0,
    options: [],
    config: null,
    believerField: null,
};
const view = (id: string, type: 'kanban' | 'calendar'): CustomTableView => ({
    id,
    type,
    name: id,
    tableId: 'table',
    groupBy: type === 'kanban' ? 'status' : null,
    dateColumn: type === 'calendar' ? 'day' : null,
    filters: [],
    sortBy: null,
    sortOrder: 'asc',
    position: 0,
});
const views = [
    view('a', 'kanban'),
    view('b', 'kanban'),
    view('c', 'calendar'),
    view('d', 'calendar'),
];
const columns = [column];
beforeEach(async () => {
    await AsyncStorage.clear();
});
it('muestra tarjetas también con preferencias antiguas de cuadrícula horizontal', async () => {
    expect(initialViewState().cards).toBe(true);
    await AsyncStorage.setItem(
        'church:user:table:grid',
        JSON.stringify({
            version: 1,
            hidden: ['status'],
            widths: { status: 200 },
            cards: false,
        }),
    );
    const result = await renderHook(() => useTableViewState('church:user:table', columns, views));
    expect(result.result.current.state.cards).toBe(true);
    expect(result.result.current.state.hidden).toEqual(['status']);
    await result.unmount();
});
it('retira filtros incompatibles cuando cambia el tipo conservando los filtros válidos', () => {
    const state = initialViewState();
    state.query.filters = [
        { columnKey: 'status', operator: 'contains', value: 'old text' },
        { columnKey: 'status', operator: 'in', value: ['open'] },
    ];
    expect(sanitizeState(state, columns).query.filters).toEqual([
        { columnKey: 'status', operator: 'in', value: ['open'] },
    ]);
});
it('separa búsqueda, filtros, carriles, scroll, preferencias y meses de cada instancia', async () => {
    const result = await renderHook(() => useTableViewState('church:user:table', columns, views));
    await act(() => result.result.current.setActive('a'));
    await act(() =>
        result.result.current.update({
            query: {
                search: 'Ana',
                filters: [{ columnKey: 'status', operator: 'in', value: ['open'] }],
            },
            lane: 4,
            scroll: 99,
            hidden: ['status'],
            cards: true,
        }),
    );
    await act(() => result.result.current.setActive('b'));
    expect(result.result.current.state.query.search).toBeUndefined();
    expect(result.result.current.state.query.filters).toEqual([]);
    expect(result.result.current.state.lane).toBe(0);
    expect(result.result.current.state.hidden).toEqual([]);
    await act(() => result.result.current.setActive('a'));
    expect(result.result.current.state.query.search).toBe('Ana');
    expect(result.result.current.state.lane).toBe(4);
    expect(result.result.current.state.scroll).toBe(99);
    await act(() => result.result.current.setActive('c'));
    await act(() => result.result.current.update({ month: '2028-02-01', day: '2028-02-29' }));
    await act(() => result.result.current.setActive('d'));
    expect(result.result.current.state.month).not.toBe('2028-02-01');
    await act(() => result.result.current.setActive('c'));
    expect(result.result.current.state.day).toBe('2028-02-29');
    await act(() => result.result.current.remove('c'));
    expect(result.result.current.active).toBe('grid');
    await act(() => result.result.current.setActive('a'));
    expect(result.result.current.state.query.search).toBe('Ana');
    await result.unmount();
});
it('persiste solo presentación por ámbito y vista, restablece búsqueda y sanea preferencias corruptas', async () => {
    await AsyncStorage.setItem(
        'church:user:table:a',
        JSON.stringify({
            version: 1,
            hidden: ['missing', 'status'],
            widths: { status: 999, missing: 100 },
            cards: true,
        }),
    );
    const result = await renderHook(() => useTableViewState('church:user:table', columns, views));
    await act(() => result.result.current.setActive('a'));
    expect(result.result.current.state.hidden).toEqual(['status']);
    expect(result.result.current.state.widths).toEqual({ status: 360 });
    await act(() => result.result.current.update({ query: { search: 'temporary' } }));
    await result.unmount();
    const reopened = await renderHook(() => useTableViewState('church:user:table', columns, views));
    await act(() => reopened.result.current.setActive('a'));
    expect(reopened.result.current.state.query.search).toBeUndefined();
    expect(reopened.result.current.state.cards).toBe(true);
    await reopened.unmount();
});
