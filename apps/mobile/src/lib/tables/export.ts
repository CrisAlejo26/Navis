import type { CustomTableWithColumns } from '@navis/shared';
import type { TableContext } from '@/data/repos/tables-context';
import { tableDb } from '@/data/repos/tables-context';
import { readTableRows, revealPassword } from '@/data/repos/table-rows-read';
import type { TableQuery } from '@/data/repos/table-query';
import type { ListExportTable } from '@/lib/lists/export-table';
import { formatCell } from './format';

export async function tableExport(
    context: TableContext,
    table: CustomTableWithColumns,
    query: TableQuery,
    keys: string[],
    signal: AbortSignal,
): Promise<ListExportTable> {
    await tableDb(context, true, table.id);
    const columns = table.columns.filter((column) => keys.includes(column.key));
    const output: ListExportTable = {
        title: table.name,
        headers: columns.map((column) => column.label),
        rows: [],
    };
    let page = 1;
    while (true) {
        if (signal.aborted) throw new Error('cancelled');
        const batch = await readTableRows(context, table.id, query, page, 200);
        for (const row of batch.items) {
            if (signal.aborted) throw new Error('cancelled');
            const values: string[] = [];
            for (const column of columns)
                values.push(
                    column.type === 'password' && row.data[column.key]
                        ? await revealPassword(context, table.id, row.id, column.key)
                        : formatCell(column, row.data[column.key]),
                );
            output.rows.push(values);
        }
        if (page * 200 >= batch.total) return output;
        page++;
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
}
