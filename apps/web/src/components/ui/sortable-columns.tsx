import type { SortOrder } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { TableHeader } from '@/components/ui/table';

export interface SortableColumn<TField extends string> {
  field: TField;
  /** Ya traducido: quien lo pasa sabe con qué clave (Regla 2). */
  label: string;
  align?: 'left' | 'right';
}

interface SortableColumnsProps<TField extends string> {
  columns: readonly SortableColumn<TField>[];
  sort: TField;
  order: SortOrder;
  onToggle: (field: TField) => void;
}

/**
 * Cabeceras ordenables a partir de una lista de columnas. Lo usan las dos
 * tablas de accesos, y cualquiera que venga después: la lógica de «cuál está
 * activa y en qué sentido» se escribe una vez.
 */
export function SortableColumns<TField extends string>({
  columns,
  sort,
  order,
  onToggle,
}: SortableColumnsProps<TField>) {
  const { t } = useTranslation();

  return (
    <>
      {columns.map((column) => (
        <TableHeader
          key={column.field}
          sorted={sort === column.field && order}
          sortLabel={t('roles.sortBy', { column: column.label })}
          className={column.align === 'right' ? 'text-right' : undefined}
          onSort={() => {
            onToggle(column.field);
          }}
        >
          {column.label}
        </TableHeader>
      ))}
    </>
  );
}
