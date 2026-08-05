import type { DreamWeekdayCount } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { WeeklyClock } from '@/components/dreams/weekly-clock';
import { formatWeekday } from '@/lib/format';

/**
 * En qué noches se sueña: el reloj de la semana y nada más.
 *
 * El reloj va `aria-hidden` y debajo queda la misma información en una lista
 * para lectores de pantalla: un gráfico es una forma de enseñar un dato, no de
 * esconderlo (Regla 5 §4).
 */
export function WeekdayPanel({ days }: { days: DreamWeekdayCount[] }) {
  const { t } = useTranslation();

  return (
    <section
      style={{ animationDelay: '360ms' }}
      className="gap-3 p-4 sm:p-5 animate-rise-in flex h-full flex-col rounded-xl border bg-card"
    >
      <h2 className="text-sm font-medium">{t('dreams.weekdays')}</h2>

      {/* El reloj se come el alto que sobra y se centra: en una tarjeta ancha,
          un dibujo pequeño arriba a la izquierda se lee como un fallo. */}
      <div className="min-h-0 flex flex-1 items-center justify-center">
        <WeeklyClock days={days} />
      </div>

      <ul className="sr-only">
        {days.map((day) => (
          <li key={day.weekday}>
            {t('dreams.weekdayLabel', {
              day: formatWeekday(day.weekday, 'long'),
              total: day.count,
            })}
          </li>
        ))}
      </ul>
    </section>
  );
}
