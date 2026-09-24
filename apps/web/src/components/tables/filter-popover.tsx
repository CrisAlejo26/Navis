import { cloneElement, isValidElement, useRef, useState, type ReactElement } from 'react';
import type { CustomTableColumn, RowFilter } from '@navis/shared';

import { ColumnFilterControl } from '@/components/tables/column-filter-control';
import { FloatingPanel } from '@/components/ui/floating-panel';

/**
 * El filtro de una columna, en un panel flotante bajo su disparador (D1): el
 * control que le toca a su tipo vive dentro, y solo se monta al abrirse — no
 * hay controles de filtro en pantalla si nadie pide uno.
 */
export function FilterPopover({
    column,
    filter,
    onChange,
    trigger,
}: {
    column: CustomTableColumn;
    filter: RowFilter | undefined;
    onChange: (filter: RowFilter | null) => void;
    /** El botón que abre el panel; se le inyectan `onClick` y `aria-expanded`. */
    trigger: ReactElement<{ onClick?: () => void; 'aria-expanded'?: boolean }>;
}) {
    const [open, setOpen] = useState(false);
    const anchor = useRef<HTMLSpanElement>(null);

    const disparador = isValidElement(trigger)
        ? cloneElement(trigger, {
              onClick: () => {
                  setOpen((previous) => !previous);
              },
              'aria-expanded': open,
          })
        : trigger;

    return (
        <span ref={anchor} className="inline-flex">
            {disparador}

            <FloatingPanel
                open={open}
                onClose={() => setOpen(false)}
                anchorRef={anchor}
                label={column.label}
                className="p-3"
            >
                <ColumnFilterControl
                    column={column}
                    filter={filter}
                    label={column.label}
                    onChange={onChange}
                />
            </FloatingPanel>
        </span>
    );
}
