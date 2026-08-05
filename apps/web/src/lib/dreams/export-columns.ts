import { weekdayOf, type DreamExportRow } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { useEmotionLabel } from '@/lib/dreams/emotion-label';
import { STATE_ACCENT } from '@/lib/dreams/state-icons';
import { cellDay, cellTag, cellTags, cellText, type ExportColumn } from '@/lib/export/columns';
import { formatWeekday } from '@/lib/format';

/**
 * Las columnas del fichero de sueños (RFC 0009 §6.3).
 *
 * Lleva el cuerpo entero, la interpretación y lo que significó al cumplirse:
 * las tres cosas que la fila del listado no trae y que son justo las que
 * alguien quiere releer fuera de la aplicación.
 */
export function useDreamExportColumns(): ExportColumn<DreamExportRow>[] {
  const { t } = useTranslation();
  const emotionLabel = useEmotionLabel();

  return [
    { key: 'dreamedAt', header: t('dreams.dreamedAt'), value: (row) => cellDay(row.dreamedAt) },
    {
      key: 'weekday',
      header: t('export.weekday'),
      // El día de la semana se calcula aquí y no en el servidor: `EXTRACT(DOW)`
      // y `strftime('%w')` no se escriben igual en los dos motores (RFC 0005 D14).
      value: (row) => cellText(formatWeekday(weekdayOf(row.dreamedAt), 'long')),
    },
    { key: 'title', header: t('dreams.titleField'), value: (row) => cellText(row.title) },
    {
      key: 'body',
      header: t('dreams.bodyField'),
      value: (row) => cellText(row.body),
      width: 48,
    },
    {
      key: 'emotions',
      header: t('dreams.columns.emotions'),
      value: (row) =>
        cellTags(
          row.emotions.map((emotion) => ({
            text: emotionLabel(emotion),
            accent: emotion.accent,
          })),
        ),
    },
    {
      key: 'interpretation',
      header: t('dreams.interpretation'),
      value: (row) => cellText(row.interpretation),
      width: 40,
    },
    {
      key: 'state',
      header: t('export.state'),
      value: (row) => cellTag(t(`dreams.state.${row.state}`), STATE_ACCENT[row.state]),
    },
    {
      key: 'fulfilledAt',
      header: t('dreams.fulfilledAt'),
      value: (row) => cellDay(row.fulfilledAt),
    },
    {
      key: 'meaning',
      header: t('dreams.meaning'),
      value: (row) => cellText(row.fulfillmentMeaning),
      width: 40,
    },
    {
      key: 'createdAt',
      header: t('export.createdAt'),
      value: (row) => cellDay(row.createdAt.slice(0, 10)),
    },
  ];
}
