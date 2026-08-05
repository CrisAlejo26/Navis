import type { ProphecyExportRow } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { cellDay, cellNumber, cellTag, cellText, type ExportColumn } from '@/lib/export/columns';
import { STATE_ACCENT } from '@/lib/prophecies/state-icons';

/**
 * Las columnas del fichero de profecías (RFC 0009 §6.3).
 *
 * Lleva **el cuerpo entero** y no el extracto de la fila: un fichero que se
 * lleva el texto recortado sin avisar es el mismo error que editar desde el
 * listado (CLAUDE.md).
 */
export function useProphecyExportColumns(): ExportColumn<ProphecyExportRow>[] {
  const { t } = useTranslation();

  return [
    { key: 'title', header: t('prophecies.titleField'), value: (row) => cellText(row.title) },
    {
      key: 'body',
      header: t('prophecies.bodyField'),
      value: (row) => cellText(row.body),
      // Ancha a propósito: es la columna que se va a leer.
      width: 48,
    },
    {
      key: 'receivedAt',
      header: t('prophecies.receivedAt'),
      value: (row) => cellDay(row.receivedAt),
    },
    {
      key: 'state',
      header: t('export.state'),
      value: (row) => cellTag(t(`prophecies.state.${row.state}`), STATE_ACCENT[row.state]),
    },
    {
      key: 'fulfilledAt',
      header: t('prophecies.fulfilledAt'),
      value: (row) => cellDay(row.fulfilledAt),
    },
    {
      key: 'waitingDays',
      header: t('export.waitingDays'),
      value: (row) => cellNumber(row.waitingDays),
    },
    {
      key: 'fulfillments',
      header: t('export.fulfillments'),
      value: (row) => cellNumber(row.fulfillmentsCount),
    },
    {
      key: 'createdAt',
      header: t('export.createdAt'),
      value: (row) => cellDay(row.createdAt.slice(0, 10)),
    },
  ];
}
