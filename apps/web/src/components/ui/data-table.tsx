import { TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';

interface DataTableProps<TItem> {
  items: TItem[] | undefined;
  isLoading: boolean;
  /** La consulta ha fallado: se dice y se ofrece reintentar, no se deja en blanco. */
  isError?: boolean;
  onRetry?: () => void;
  /** Las cabeceras, ya montadas con `TableHeader`. */
  columns: ReactNode;
  /** Cuántas columnas hay, para el esqueleto y para la fila vacía. */
  columnCount: number;
  getKey: (item: TItem) => string;
  /** Las celdas de una fila, de `md` para arriba. */
  renderRow: (item: TItem) => ReactNode;
  /** El mismo dato como ficha, por debajo de `md`. */
  renderCard: (item: TItem) => ReactNode;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  /** Búsqueda y filtros, sobre la tabla. */
  toolbar?: ReactNode;
  /** Normalmente `<Pagination />`, bajo la tabla. */
  footer?: ReactNode;
}

/**
 * La tabla de datos de Navis: tarjeta, barra de filtros, cabeceras, esqueleto
 * de carga, estado vacío y pie, todo en un sitio.
 *
 * Cambia de forma con el ancho: de `md` para arriba es una tabla; por debajo,
 * una lista de fichas. Una tabla de cinco columnas en un teléfono obliga a
 * desplazarse a lo ancho para leer una sola fila, y eso no es leerla (Regla 5).
 *
 * Cada pantalla pone sus columnas, su fila y su ficha; lo demás —que es lo que
 * se repetiría— vive aquí.
 */
export function DataTable<TItem>({
  items,
  isLoading,
  isError = false,
  onRetry,
  columns,
  columnCount,
  getKey,
  renderRow,
  renderCard,
  emptyIcon,
  emptyTitle,
  toolbar,
  footer,
}: DataTableProps<TItem>) {
  const { t } = useTranslation();
  const isEmpty = !isLoading && !isError && items?.length === 0;

  const notice = isError ? (
    <EmptyState icon={TriangleAlert} title={t('errors.generic')}>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </EmptyState>
  ) : isEmpty ? (
    <EmptyState icon={emptyIcon} title={emptyTitle} />
  ) : null;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {toolbar && <div className="p-3 border-b">{toolbar}</div>}

      <div className="md:block hidden w-full overflow-x-auto">
        <Table>
          <TableHead>
            <tr>{columns}</tr>
          </TableHead>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }, (_, row) => (
                <tr key={row}>
                  {Array.from({ length: columnCount }, (_, column) => (
                    <TableCell key={column}>
                      <Skeleton className={column === 0 ? 'w-40' : 'w-24'} />
                    </TableCell>
                  ))}
                </tr>
              ))}

            {!isLoading &&
              !isError &&
              items?.map((item) => <TableRow key={getKey(item)}>{renderRow(item)}</TableRow>)}

            {notice && (
              <tr>
                <td colSpan={columnCount}>{notice}</td>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>

      <ul className="md:hidden divide-y">
        {isLoading &&
          Array.from({ length: 4 }, (_, row) => (
            <li key={row} className="gap-2 p-4 flex flex-col">
              <Skeleton className="w-40" />
              <Skeleton className="w-56" />
            </li>
          ))}

        {!isLoading &&
          !isError &&
          items?.map((item) => (
            <li key={getKey(item)} className="p-4">
              {renderCard(item)}
            </li>
          ))}

        {notice && <li>{notice}</li>}
      </ul>

      {footer}
    </div>
  );
}
