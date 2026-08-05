import type { ListExportRow } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import {
  cellNumber,
  cellTag,
  cellTags,
  cellText,
  NEUTRAL_ACCENT,
  type ExportColumn,
} from '@/lib/export/columns';

/**
 * Las columnas del fichero de una lista (RFC 0009 D7, RFC 0010 D41).
 *
 * Es **todo** lo que hizo falta escribir para que una lista salga en los cinco
 * formatos: si esto hubiera necesitado un sexto escritor, el juego de allí
 * estaba mal puesto.
 *
 * El orden va primero porque en una lista el orden es el dato (D6), y la llave
 * porque leer el cartel fuera de la aplicación no dice quién puede abrirlo.
 */
export function useListExportColumns(): ExportColumn<ListExportRow>[] {
  const { t } = useTranslation();

  return [
    {
      key: 'position',
      header: t('lists.order'),
      value: (row) => cellNumber(row.position),
      width: 6,
      align: 'right',
    },
    {
      key: 'name',
      header: t('believers.columnName'),
      value: (row) => cellText(row.name),
      width: 26,
    },
    {
      key: 'congregation',
      header: t('calendar.congregation'),
      value: (row) =>
        row.congregation
          ? cellTag(row.congregation, row.congregationAccent ?? NEUTRAL_ACCENT)
          : cellText(''),
    },
    {
      key: 'ministries',
      header: t('believers.ministries'),
      value: (row) =>
        cellTags(row.ministries.map((one) => ({ text: one, accent: NEUTRAL_ACCENT }))),
    },
    { key: 'note', header: t('lists.note'), value: (row) => cellText(row.note), width: 24 },
    {
      key: 'access',
      header: t('lists.canSee'),
      value: (row) => cellText(row.hasAccess ? t('common.yes') : ''),
      width: 8,
    },
  ];
}
