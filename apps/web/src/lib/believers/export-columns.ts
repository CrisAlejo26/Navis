import type { BelieverExportRow, Congregation, MinistryCatalog } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { STATUS_ACCENT } from '@/lib/believers/status-accent';
import {
  cellDay,
  cellNumber,
  cellTag,
  cellTags,
  cellText,
  type ExportColumn,
} from '@/lib/export/columns';

/**
 * Las columnas del fichero de creyentes (RFC 0009 §6.3).
 *
 * Es un **hook** y no una función suelta para que los encabezados y las
 * etiquetas se traduzcan con el `t` de siempre, sin pasearlo por ninguna firma
 * (D7).
 *
 * La sede y las labores se resuelven aquí contra sus catálogos: lo que guarda
 * una persona es un identificador y un slug, y el nombre y el color viven en
 * el catálogo, que se puede renombrar sin tocar a nadie.
 */
export function useBelieverExportColumns(catalogs: {
  congregations: readonly Congregation[];
  ministries: readonly MinistryCatalog[];
}): ExportColumn<BelieverExportRow>[] {
  const { t } = useTranslation();
  const congregation = (id: string | null) => catalogs.congregations.find((one) => one.id === id);

  return [
    { key: 'firstName', header: t('believers.firstName'), value: (row) => cellText(row.firstName) },
    { key: 'lastName', header: t('believers.lastName'), value: (row) => cellText(row.lastName) },
    {
      key: 'status',
      header: t('believers.statusLabel'),
      value: (row) => cellTag(t(`believers.status.${row.status}`), STATUS_ACCENT[row.status]),
    },
    {
      key: 'congregation',
      header: t('believers.congregation'),
      value: (row) => {
        const sede = congregation(row.congregationId);
        return sede ? cellTag(sede.name, sede.accent) : cellTags([]);
      },
    },
    {
      key: 'ministries',
      header: t('believers.ministries'),
      value: (row) =>
        cellTags(
          row.ministries.map((slug) => {
            // Una labor borrada del catálogo se enseña por su slug en vez de
            // desaparecer: que alguien la tuviera sigue siendo verdad.
            const labor = catalogs.ministries.find((one) => one.slug === slug);
            return { text: labor?.name ?? slug, accent: labor?.accent ?? 'primary' };
          }),
        ),
    },
    {
      key: 'gifts',
      header: t('believers.gifts'),
      value: (row) => cellTags(row.gifts.map((gift) => ({ text: gift.name, accent: gift.accent }))),
    },
    { key: 'phone', header: t('believers.phone'), value: (row) => cellText(row.phone) },
    { key: 'email', header: t('believers.email'), value: (row) => cellText(row.email) },
    {
      key: 'lastNote',
      header: t('believers.columnAlert'),
      value: (row) => cellDay(row.lastNoteAt),
    },
    {
      key: 'daysWithoutNote',
      header: t('export.daysWithoutNote'),
      value: (row) => cellNumber(row.daysWithoutNote),
    },
    {
      key: 'notesCount',
      header: t('export.notesCount'),
      value: (row) => cellNumber(row.notesCount),
    },
    {
      key: 'createdAt',
      header: t('export.createdAt'),
      // `createdAt` es un instante y la columna es un día: se corta por la T.
      value: (row) => cellDay(row.createdAt.slice(0, 10)),
    },
  ];
}
