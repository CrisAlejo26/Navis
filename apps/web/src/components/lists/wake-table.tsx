import type { ListDay } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { formatDay } from '@/lib/format';

/**
 * Los treinta datos de la estela, en una tabla.
 *
 * No es un extra: **el gráfico no puede ser la única forma de leer el dato**
 * (RFC 0010 §8.4). Va dentro de su propio contenedor con scroll, que es lo que
 * evita que una tabla arrastre la página a lo ancho en un teléfono (Regla 5 §3).
 */
export function WakeTable({ id, days }: { id: string; days: readonly ListDay[] }) {
  const { t } = useTranslation();

  return (
    <div id={id} className="mt-3 max-h-64 overflow-auto rounded-lg border">
      <table className="text-sm w-full">
        <caption className="sr-only">{t('lists.wake')}</caption>
        <thead className="top-0 sticky bg-muted/60">
          <tr className="text-xs text-left text-muted-foreground">
            <th scope="col" className="px-3 py-2 font-medium">
              {t('lists.day')}
            </th>
            <th scope="col" className="px-3 py-2 font-medium text-right">
              {t('lists.views')}
            </th>
            <th scope="col" className="px-3 py-2 font-medium text-right">
              {t('lists.visitors')}
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.day} className="border-t">
              <td className="px-3 py-1.5">{formatDay(day.day, 'short')}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{day.views}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{day.visitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
