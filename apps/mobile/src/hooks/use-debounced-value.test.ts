import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from './use-debounced-value';

// Regresión: sin retardo, cada tecla del buscador de creyentes relanzaba la
// consulta sobre SQLite y varias llamadas nativas solapadas revientan
// `expo-sqlite` con «NativeDatabase.prepareAsync ... NullPointerException».
describe('useDebouncedValue', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('mantiene el valor inicial hasta que pasa el retardo', async () => {
        const { result } = await renderHook(() => useDebouncedValue('', 300));
        expect(result.current).toBe('');
    });

    it('no actualiza el valor mientras se sigue escribiendo', async () => {
        const { result, rerender } = await renderHook<string, { value: string }>(
            ({ value }) => useDebouncedValue(value, 300),
            { initialProps: { value: 'e' } },
        );

        await rerender({ value: 'el' });
        await act(() => jest.advanceTimersByTime(200));
        await rerender({ value: 'ele' });
        await act(() => jest.advanceTimersByTime(200));

        // Cada pulsación reinicia el temporizador: todavía no se ha asentado.
        expect(result.current).toBe('e');
    });

    it('adopta el último valor cuando la escritura hace una pausa', async () => {
        const { result } = await renderHook<string, { value: string }>(
            ({ value }) => useDebouncedValue(value, 300),
            { initialProps: { value: 'elena' } },
        );

        await act(() => jest.advanceTimersByTime(300));

        expect(result.current).toBe('elena');
    });
});
