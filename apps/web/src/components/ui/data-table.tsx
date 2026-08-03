import { TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableScroll,
} from '@/components/ui/table';

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
  renderRow: (item: TItem) => ReactNode;
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
 * Cada pantalla pone sus columnas y cómo se pinta una fila; lo demás —que es
 * lo que se repetiría— vive aquí. Así el día que cambie el aspecto de las
 * tablas se cambia una vez.
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
  emptyIcon,
  emptyTitle,
  toolbar,
  footer,
}: DataTableProps<TItem>) {
  const { t } = useTranslation();
  const isEmpty = !isLoading && !isError && items?.length === 0;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {toolbar && <div className="p-3 border-b">{toolbar}</div>}

      <TableScroll>
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

            {isError && (
              <tr>
                <td colSpan={columnCount}>
                  <EmptyState icon={TriangleAlert} title={t('errors.generic')}>
                    {onRetry && (
                      <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
                        {t('common.retry')}
                      </Button>
                    )}
                  </EmptyState>
                </td>
              </tr>
            )}

            {isEmpty && (
              <tr>
                <td colSpan={columnCount}>
                  <EmptyState icon={emptyIcon} title={emptyTitle} />
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </TableScroll>

      {footer}
    </div>
  );
}
