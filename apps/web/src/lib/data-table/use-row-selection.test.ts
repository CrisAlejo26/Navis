import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useRowSelection } from './use-row-selection';

interface Fila {
    id: string;
    nombre: string;
}

const getKey = (fila: Fila) => fila.id;
const a: Fila = { id: 'a', nombre: 'Ana' };
const b: Fila = { id: 'b', nombre: 'Beto' };
const c: Fila = { id: 'c', nombre: 'Cira' };

describe('useRowSelection', () => {
    it('marca y desmarca de una en una', () => {
        const { result } = renderHook(() => useRowSelection(getKey, 'k'));

        act(() => {
            result.current.toggle(a);
        });
        expect(result.current.has('a')).toBe(true);
        expect(result.current.count).toBe(1);

        act(() => {
            result.current.toggle(a);
        });
        expect(result.current.count).toBe(0);
    });

    it('marca y desmarca varias a la vez, sin tocar las demás', () => {
        const { result } = renderHook(() => useRowSelection(getKey, 'k'));

        act(() => {
            result.current.toggle(c);
            result.current.setMany([a, b], true);
        });
        expect(result.current.items.map((fila) => fila.id).sort()).toEqual(['a', 'b', 'c']);

        act(() => {
            result.current.setMany([a, b], false);
        });
        expect(result.current.items).toEqual([c]);
    });

    // Regresión: en modo servidor la fila de la página 1 ya no está en memoria en la
    // 2, y la acción masiva la necesita entera.
    it('conserva el dato entero de lo marcado aunque la fila ya no esté a la vista', () => {
        const { result, rerender } = renderHook(() => useRowSelection(getKey, 'k'));
        act(() => {
            result.current.toggle(a);
        });
        rerender();
        expect(result.current.items).toEqual([a]);
    });

    // Regresión: actuar sobre filas que ya no se ven es actuar a ciegas.
    it('se vacía sola cuando cambia la clave de reinicio (filtros o búsqueda)', () => {
        const { result, rerender } = renderHook(({ key }) => useRowSelection(getKey, key), {
            initialProps: { key: 'sin filtros' },
        });
        act(() => {
            result.current.setMany([a, b], true);
        });
        expect(result.current.count).toBe(2);

        rerender({ key: 'con filtros' });
        expect(result.current.count).toBe(0);
    });

    it('clear vacía todo', () => {
        const { result } = renderHook(() => useRowSelection(getKey, 'k'));
        act(() => {
            result.current.setMany([a, b, c], true);
        });
        act(() => {
            result.current.clear();
        });
        expect(result.current.count).toBe(0);
    });
});
