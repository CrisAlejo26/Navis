import type { Paginated } from '@navis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { TableRequest } from './types';
import { useDataTableQuery } from './use-data-table-query';

const request: TableRequest = { page: 1, limit: 10, search: '', sorts: [], filters: [] };

function pageOf(page: number, totalPages: number): Paginated<string> {
    return { items: [`fila ${page}`], total: totalPages * 10, page, limit: 10, totalPages };
}

function setup(fetchPage: (r: TableRequest) => Promise<Paginated<string>>) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { client, wrapper, fetchPage };
}

describe('useDataTableQuery', () => {
    it('pide la página y precarga la siguiente', async () => {
        const fetchPage = vi.fn((r: TableRequest) => Promise.resolve(pageOf(r.page, 3)));
        const { wrapper } = setup(fetchPage);

        const { result } = renderHook(
            () => useDataTableQuery({ queryKey: ['demo'], request, fetchPage }),
            { wrapper },
        );

        await waitFor(() => {
            expect(result.current.data?.items).toEqual(['fila 1']);
        });
        await waitFor(() => {
            expect(fetchPage).toHaveBeenCalledWith(
                expect.objectContaining({ page: 2 }),
                expect.anything(),
            );
        });
    });

    it('no precarga nada en la última página', async () => {
        const fetchPage = vi.fn((r: TableRequest) => Promise.resolve(pageOf(r.page, 1)));
        const { wrapper } = setup(fetchPage);

        const { result } = renderHook(
            () => useDataTableQuery({ queryKey: ['demo'], request, fetchPage }),
            { wrapper },
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });
        expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    // Regresión: sin `keepPreviousData` la tabla volvía a esqueleto en cada clic
    // de paginación aunque la página anterior ya estuviera en pantalla.
    it('conserva la página anterior mientras llega la nueva', async () => {
        let release: () => void = () => undefined;
        const fetchPage = vi.fn((r: TableRequest) =>
            r.page === 1
                ? Promise.resolve(pageOf(1, 5))
                : new Promise<Paginated<string>>((resolve) => {
                      release = () => {
                          resolve(pageOf(r.page, 5));
                      };
                  }),
        );
        const { wrapper } = setup(fetchPage);

        const { result, rerender } = renderHook(
            ({ page }) =>
                useDataTableQuery({ queryKey: ['demo'], request: { ...request, page }, fetchPage }),
            { wrapper, initialProps: { page: 1 } },
        );
        await waitFor(() => {
            expect(result.current.data?.items).toEqual(['fila 1']);
        });

        rerender({ page: 4 });
        expect(result.current.isPlaceholderData).toBe(true);
        expect(result.current.data?.items).toEqual(['fila 1']);

        release();
        await waitFor(() => {
            expect(result.current.data?.items).toEqual(['fila 4']);
        });
    });
});
