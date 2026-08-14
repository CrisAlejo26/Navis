import type { CustomTableColumn } from '@navis/shared';

import { Select } from '@/components/ui/select';

/**
 * La columna que le hace falta a la vista, según su tipo (RFC 0021 D25):
 * de selección única para el tablero, de fecha para el calendario. Si la
 * tabla no tiene ninguna del tipo que toca, lo dice en vez de ofrecer un
 * desplegable vacío.
 */
export function ViewFormColumnPicker({
  label,
  columns,
  value,
  onChange,
  emptyHint,
}: {
  label: string;
  columns: readonly CustomTableColumn[];
  value: string;
  onChange: (value: string) => void;
  emptyHint: string;
}) {
  if (columns.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyHint}</p>;
  }

  return (
    <Select
      label={label}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    >
      {columns.map((column) => (
        <option key={column.key} value={column.key}>
          {column.label}
        </option>
      ))}
    </Select>
  );
}
