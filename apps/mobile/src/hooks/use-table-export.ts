import { useEffect, useRef, useState } from 'react';
import type { ViewShotRef } from 'react-native-view-shot';
import type { CustomTableWithColumns } from '@navis/shared';
import type { TableQuery } from '@/data/repos/table-query';
import { useTableContext } from './use-tables';
import { tableExport } from '@/lib/tables/export';
import { shareListFile, type ListFileFormat } from '@/lib/lists/share-file';
import type { ListExportTable } from '@/lib/lists/export-table';

export function useTableExport(table: CustomTableWithColumns, query: TableQuery) {
    const { context } = useTableContext();
    const [passwordWarning, setPasswordWarning] = useState<number | null>(null);
    const confirmation = useRef<((confirmed: boolean) => void) | null>(null);
    function resolvePassword(confirmed: boolean) {
        const resolve = confirmation.current;
        confirmation.current = null;
        setPasswordWarning(null);
        resolve?.(confirmed);
    }
    const [keys, setKeys] = useState(
        table.columns.filter((column) => column.type !== 'password').map((column) => column.key),
    );
    const [format, setFormat] = useState<ListFileFormat>('xlsx'),
        [busy, setBusy] = useState(false),
        [error, setError] = useState<string | null>(null),
        [output, setOutput] = useState<ListExportTable | null>(null);
    const cancel = useRef<AbortController | null>(null),
        poster = useRef<ViewShotRef | null>(null);
    useEffect(
        () => () => {
            cancel.current?.abort();
            confirmation.current?.(false);
        },
        [],
    );
    function cancelExport() {
        cancel.current?.abort();
        resolvePassword(false);
    }
    async function send() {
        if (cancel.current) return;
        const controller = new AbortController();
        cancel.current = controller;
        setBusy(true);
        setError(null);
        try {
            const data = await tableExport(context, table, query, keys, controller.signal);
            if (format === 'image' && data.rows.length > 100) throw new Error('image-too-long');
            if (!data.rows.length) throw new Error('empty-export');
            const selected = table.columns.filter((column) => keys.includes(column.key));
            const sensitive = selected.some((column) => column.type === 'password');
            if (sensitive) {
                const count = data.rows.reduce(
                    (total, row) =>
                        total +
                        row.filter(
                            (value, index) => selected[index].type === 'password' && value !== '—',
                        ).length,
                    0,
                );
                const confirmed = await new Promise<boolean>((resolve) => {
                    confirmation.current = resolve;
                    setPasswordWarning(count);
                });
                if (!confirmed) return;
            }
            if (controller.signal.aborted) return;
            setOutput(data);
            await new Promise<void>((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            );
            if (controller.signal.aborted) return;
            await shareListFile(data, table.slug, format, async () => {
                const uri = await poster.current?.capture();
                if (!uri) throw new Error('capture-failed');
                return uri;
            });
        } catch (failure) {
            if (!controller.signal.aborted)
                setError(failure instanceof Error ? failure.message : 'export-failed');
        } finally {
            setBusy(false);
            setOutput(null);
            cancel.current = null;
        }
    }
    return {
        keys,
        setKeys,
        format,
        setFormat,
        busy,
        error,
        output,
        cancelExport,
        poster,
        send,
        passwordWarning,
        resolvePassword,
    };
}
