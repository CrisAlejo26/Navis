import type { RowData as TableRowData } from '@tanstack/react-table';
import type { ReactNode } from 'react';

import { SelectionCheckbox } from '@/components/data-table/selection-checkbox';
import type { SelectionProps } from '@/components/data-table/selection-props';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import type { DataTableColumn } from '@/lib/data-table/columns';

interface CardsViewProps<TItem extends TableRowData> {
    items: readonly TItem[];
    columns: readonly DataTableColumn<TItem>[];
    getKey: (item: TItem) => string;
    isLoading: boolean;
    /** La ficha propia de la pantalla; sin ella, sale una genérica «etiqueta: valor». */
    renderCard?: (item: TItem, index: number) => ReactNode;
    /** Sin esto no hay casillas: cada ficha lleva la suya a la izquierda. */
    selection?: SelectionProps<TItem>;
}

/** Ficha genérica: la primera columna de título y el resto como pares etiqueta/valor. */
function GenericCard<TItem extends TableRowData>({
    item,
    index,
    columns,
}: {
    item: TItem;
    index: number;
    columns: readonly DataTableColumn<TItem>[];
}) {
    const [title, ...rest] = columns;
    return (
        <div className="gap-2 flex flex-col">
            {title && <div className="font-medium">{title.cell(item, index)}</div>}
            <dl className="gap-x-4 gap-y-1 text-sm grid grid-cols-[auto_1fr]">
                {rest.map((column) => (
                    <div key={column.id} className="col-span-2 grid grid-cols-subgrid items-center">
                        <dt className="text-muted-foreground">{column.label}</dt>
                        <dd>{column.cell(item, index)}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

/** La lista de fichas de por debajo de `md` (Regla 5 §2). */
export function CardsView<TItem extends TableRowData>({
    items,
    columns,
    getKey,
    isLoading,
    renderCard,
    selection,
}: CardsViewProps<TItem>) {
    return (
        <ul className="md:hidden gap-3 flex flex-col">
            {isLoading
                ? Array.from({ length: 4 }, (_, row) => (
                      <li key={row} className="gap-2 p-4 flex flex-col rounded-xl border bg-card">
                          <Skeleton className="w-40" />
                          <Skeleton className="w-56" />
                      </li>
                  ))
                : items.map((item, index) => {
                      const isMarked = selection?.state.has(selection.getKey(item)) ?? false;
                      return (
                          <li
                              key={getKey(item)}
                              className={cn(
                                  'gap-1 p-4 flex items-start rounded-xl border bg-card',
                                  isMarked && 'border-primary/40 bg-primary/5',
                              )}
                          >
                              {selection && (
                                  <span className="-mt-2 -ml-3 shrink-0">
                                      <SelectionCheckbox
                                          label={selection.rowLabel(item)}
                                          disabled={!selection.isSelectable(item)}
                                          checked={isMarked}
                                          onChange={() => {
                                              selection.state.toggle(item);
                                          }}
                                      />
                                  </span>
                              )}
                              <div className="min-w-0 flex-1">
                                  {renderCard ? (
                                      renderCard(item, index)
                                  ) : (
                                      <GenericCard item={item} index={index} columns={columns} />
                                  )}
                              </div>
                          </li>
                      );
                  })}
        </ul>
    );
}
