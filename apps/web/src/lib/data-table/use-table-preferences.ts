import { useCallback, useMemo, useSyncExternalStore } from 'react';

import {
    readRawPreferences,
    subscribeToPreferences,
    writeRawPreferences,
} from './preferences-storage';
import { tablePreferencesKey } from './storage-keys';
import { parsePreferences, type TablePreferences } from './table-preferences';
import type { TableColumnSpec } from './types';

export interface TablePreferencesApi {
    preferences: TablePreferences;
    update: (patch: Partial<Omit<TablePreferences, 'v'>>) => void;
    reset: () => void;
}

/**
 * Las preferencias personales de una tabla, guardadas por usuario en
 * `localStorage` y compartidas entre pestañas.
 *
 * `columns` tiene que ser **estable** (una constante o un `useMemo`): de él
 * depende la reconciliación.
 */
export function useTablePreferences(
    userId: string,
    tableId: string,
    columns: readonly TableColumnSpec[],
): TablePreferencesApi {
    const key = tablePreferencesKey(userId, tableId);
    const raw = useSyncExternalStore(
        subscribeToPreferences,
        () => readRawPreferences(key),
        () => null,
    );
    const preferences = useMemo(() => parsePreferences(raw, columns), [raw, columns]);

    const update = useCallback(
        (patch: Partial<Omit<TablePreferences, 'v'>>) => {
            const current = parsePreferences(readRawPreferences(key), columns);
            writeRawPreferences(key, JSON.stringify({ ...current, ...patch }));
        },
        [key, columns],
    );
    const reset = useCallback(() => {
        writeRawPreferences(key, null);
    }, [key]);

    return { preferences, update, reset };
}
