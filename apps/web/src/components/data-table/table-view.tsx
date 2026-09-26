import type { RowData as TableRowData } from '@tanstack/react-table';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { ColumnHeader } from '@/components/data-table/column-header';
import { SelectionCheckbox } from '@/components/data-table/selection-checkbox';
import type { SelectionProps } from '@/components/data-table/selection-props';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/cn';
import { cellClass, type DataTableColumn } from '@/lib/data-table/columns';
import type { TableDensity } from '@/lib/data-table/types';
import type { DataTableInstance } from '@/lib/data-table/use-data-table';
import type { DataTableState } from '@/lib/data-table/use-data-table-state';

const SKELETON_ROWS = 5;

/** El alto de las filas: solo el relleno vertical de las celdas, nunca su contenido. */
const DENSITY_CLASS: Record<TableDensity, string> = {
    compact: '[&_td]:py-1.5',
    normal: '',
    comfortable: '[&_td]:py-5',
};

interface TableViewProps<TItem extends TableRowData> {
    table: DataTableInstance<TItem>;
    columns: readonly DataTableColumn<TItem>[];
    state: DataTableState;
    isLoading: boolean;
    /** Con error no se enseñan filas viejas: manda el aviso de reintentar. */
    isError: boolean;
    rowClassName?: (item: TItem) => string | undefined;
    rowStyle?: (item: TItem, index: number) => CSSProperties | undefined;
    /** Sin esto no hay columna de casillas. */
    selection?: SelectionProps<TItem>;
}

/** La tabla de `md` para arriba: cabeceras ordenables y las columnas que quedan visibles. */
export function TableView<TItem extends TableRowData>({
    table,
    columns,
    state,
    isLoading,
    isError,
    rowClassName,
    rowStyle,
    selection,
}: TableViewProps<TItem>) {
    const { t } = useTranslation();
    const byId = new Map(columns.map((column) => [column.id, column]));
    const headers = table.getHeaderGroups().flatMap((group) => group.headers);
    const rows = isError ? [] : table.getRowModel().rows;

    // El «seleccionar todo» es de **esta página** y solo de lo que se puede marcar.
    const markable = selection
        ? rows.map((row) => row.original).filter(selection.isSelectable)
        : [];
    const marked = selection
        ? markable.filter((item) => selection.state.has(selection.getKey(item))).length
        : 0;

    return (
        <div
            data-density={state.preferences.density}
            className={cn(
                'md:block hidden w-full overflow-x-auto rounded-xl border bg-card',
                DENSITY_CLASS[state.preferences.density],
            )}
        >
            <Table>
                <TableHead className="border-b-0 bg-primary">
                    <tr>
                        {selection && (
                            <TableHeader tone="solid" className="w-12 pr-0 pl-2">
                                <SelectionCheckbox
                                    onSolid
                                    label={t('dataTable.selection.selectAll')}
                                    disabled={markable.length === 0}
                                    checked={markable.length > 0 && marked === markable.length}
                                    indeterminate={marked > 0 && marked < markable.length}
                                    onChange={(on) => {
                                        selection.state.setMany(markable, on);
                                    }}
                                />
                            </TableHeader>
                        )}
                        {headers.map((header) => {
                            const column = byId.get(header.column.id);
                            return column ? (
                                <ColumnHeader key={header.id} column={column} state={state} />
                            ) : null;
                        })}
                    </tr>
                </TableHead>
                <TableBody>
                    {isLoading
                        ? Array.from({ length: SKELETON_ROWS }, (_, row) => (
                              <tr key={row}>
                                  {selection && <TableCell className="w-12 pr-0 pl-2" />}
                                  {headers.map((header, index) => (
                                      <TableCell key={header.id}>
                                          <Skeleton className={index === 0 ? 'w-40' : 'w-24'} />
                                      </TableCell>
                                  ))}
                              </tr>
                          ))
                        : rows.map((row, index) => {
                              const item = row.original;
                              const isMarked =
                                  selection?.state.has(selection.getKey(item)) ?? false;
                              return (
                                  <TableRow
                                      key={row.id}
                                      data-selected={isMarked || undefined}
                                      className={cn(
                                          isMarked && 'bg-primary/5',
                                          rowClassName?.(item),
                                      )}
                                      style={rowStyle?.(item, index)}
                                  >
                                      {selection && (
                                          <TableCell className="w-12 pr-0 pl-2">
                                              <SelectionCheckbox
                                                  label={selection.rowLabel(item)}
                                                  disabled={!selection.isSelectable(item)}
                                                  checked={isMarked}
                                                  onChange={() => {
                                                      selection.state.toggle(item);
                                                  }}
                                              />
                                          </TableCell>
                                      )}
                                      {row.getVisibleCells().map((cell) => (
                                          <TableCell
                                              key={cell.id}
                                              className={cellClass(byId.get(cell.column.id))}
                                          >
                                              <table.FlexRender cell={cell} />
                                          </TableCell>
                                      ))}
                                  </TableRow>
                              );
                          })}
                </TableBody>
            </Table>
        </div>
    );
}
