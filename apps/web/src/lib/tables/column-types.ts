import {
  NUMERIC_COLUMN_TYPES,
  TABLE_COLUMN_TYPES,
  TEXT_LIKE_COLUMN_TYPES,
  type TableColumnType,
} from '@navis/shared';
import {
  AtSign,
  Calendar,
  CheckSquare,
  Coins,
  Hash,
  Link2,
  Lock,
  Phone,
  List as SelectIcon,
  CheckSquare as MultiSelectIcon,
  Text,
  AlignLeft,
  type LucideIcon,
} from 'lucide-react';

/** `text` → `tables.columnType.text`: la clave de traducción de cada tipo. */
export const COLUMN_TYPE_LABEL_KEY: Record<TableColumnType, string> = {
  text: 'tables.columnType.text',
  long_text: 'tables.columnType.longText',
  number: 'tables.columnType.number',
  currency: 'tables.columnType.currency',
  checkbox: 'tables.columnType.checkbox',
  date: 'tables.columnType.date',
  single_select: 'tables.columnType.singleSelect',
  multi_select: 'tables.columnType.multiSelect',
  email: 'tables.columnType.email',
  phone: 'tables.columnType.phone',
  url: 'tables.columnType.url',
  password: 'tables.columnType.password',
};

export const COLUMN_TYPE_ICON: Record<TableColumnType, LucideIcon> = {
  text: Text,
  long_text: AlignLeft,
  number: Hash,
  currency: Coins,
  checkbox: CheckSquare,
  date: Calendar,
  single_select: SelectIcon,
  multi_select: MultiSelectIcon,
  email: AtSign,
  phone: Phone,
  url: Link2,
  password: Lock,
};

export { TABLE_COLUMN_TYPES };

export function needsOptions(type: TableColumnType): boolean {
  return type === 'single_select' || type === 'multi_select';
}

/** Para elegir el control del filtro (D28): igual reparto que la barra de la RFC. */
export const TEXT_TYPES: ReadonlySet<TableColumnType> = new Set(TEXT_LIKE_COLUMN_TYPES);
export const NUMERIC_TYPES: ReadonlySet<TableColumnType> = new Set(NUMERIC_COLUMN_TYPES);
