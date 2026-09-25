import type { CustomTableColumn, CustomTableRow } from '@navis/shared';
import { Link } from 'react-router';

import { RowValueCell } from '@/components/tables/row-value-cell';

/**
 * La celda de una columna en la cuadrícula. Si la columna está vinculada y la
 * fila trae a su creyente, el valor enlaza a su ficha (RFC 0025 D14).
 *
 * `arrival` es la posición de la columna dentro de una fila que acaba de
 * llegar: la celda vinculada entra con su retraso (D16), y el resto se queda
 * quieto. Sin él, no hay animación.
 */
export function BoundCell({
    column,
    row,
    linked,
    arrival,
}: {
    column: CustomTableColumn;
    row: CustomTableRow;
    linked?: boolean;
    arrival?: number;
}) {
    const value = row.data[column.key];

    if (!linked || !column.believerField || !row.believer) {
        return <RowValueCell column={column} value={value} />;
    }

    const cell = (
        <Link
            to={`/believers/${row.believer.id}`}
            className="truncate underline-offset-2 hover:underline"
        >
            <RowValueCell column={column} value={value} />
        </Link>
    );
    if (arrival === undefined) return cell;

    return (
        <span
            className="animate-celda-in block"
            style={{ animationDelay: `${String(arrival * 45)}ms` }}
        >
            {cell}
        </span>
    );
}
