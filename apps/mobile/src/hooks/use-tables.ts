import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useListContext } from './use-lists';
import { readTables, readTable, readTableViews } from '@/data/repos/tables-reads';
import { readTableRows } from '@/data/repos/table-rows-read';
import type { TableContext } from '@/data/repos/tables-context';
import type { TableQuery } from '@/data/repos/table-query';
import { useDebouncedValue } from './use-debounced-value';
import { useRef } from 'react';

export const tablesKey = (context: TableContext) =>
    ['local-tables', context.churchId, context.userId] as const;
export function useTableContext() {
    const scope = useListContext();
    return {
        ...scope,
        canView: scope.enabled,
        canEditRows: scope.canManage,
        canManageStructure: scope.canManage,
        canExport: scope.canManage,
    };
}
export function useTables() {
    const { context, enabled } = useTableContext();
    return useQuery({ queryKey: tablesKey(context), queryFn: () => readTables(context), enabled });
}
export function useTable(id: string) {
    const { context, enabled } = useTableContext();
    return useQuery({
        queryKey: [...tablesKey(context), id, 'metadata'],
        queryFn: () => readTable(context, id),
        enabled: enabled && Boolean(id),
    });
}
export function useTableViews(id: string) {
    const { context, enabled } = useTableContext();
    return useQuery({
        queryKey: [...tablesKey(context), id, 'views'],
        queryFn: () => readTableViews(context, id),
        enabled: enabled && Boolean(id),
    });
}
export function useTableRows(id: string, viewId: string, query: TableQuery, enabled = true) {
    const scope = useTableContext();
    const search = useDebouncedValue(query.search, 250);
    const normalized = { ...query, search };
    return useInfiniteQuery({
        queryKey: [...tablesKey(scope.context), id, viewId, 'rows', normalized],
        queryFn: ({ pageParam }) => readTableRows(scope.context, id, normalized, pageParam),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.page * 40 < last.total ? last.page + 1 : undefined),
        enabled: scope.enabled && enabled,
    });
}
export function useTableMutation<T>(
    operation: (context: TableContext, input: T) => Promise<unknown>,
) {
    const { context, enabled } = useTableContext();
    const client = useQueryClient();
    const pending = useRef(false);
    return useMutation({
        mutationFn: async (input: T) => {
            if (!enabled) throw new Error('not-found');
            if (pending.current) throw new Error('operation-pending');
            pending.current = true;
            try {
                return await operation(context, input);
            } finally {
                pending.current = false;
            }
        },
        onSuccess: () => client.invalidateQueries({ queryKey: tablesKey(context) }),
    });
}
