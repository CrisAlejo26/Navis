import { weekdayOf, type DreamNight, type DreamWeek } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { NightColumn } from '@/components/dreams/night-column';
import { formatWeekday } from '@/lib/format';

/** Siete noches por columna: una semana. */
const WEEK = 7;

/**
 * **La franja de noches**: el elemento firma de la portada (RFC 0005 D19).
 *
 * Doce columnas —una por semana— de siete celdas, teñidas según lo que se soñó
 * esa noche. Responde de una pieza a «cuánto sueño por semana» y «qué noches
 * sueño», y en color pleno es lo que rompe el blanco de la pantalla (§7.1).
 *
 * Cada celda lleva al listado de esa noche: la métrica **es** la navegación
 * (D16). Y como la intensidad sola no informa (Regla 3 §7), cada una lleva su
 * etiqueta accesible con la fecha y el número.
 *
 * Las celdas son de 20 px y no de 44: doce columnas de 44 no caben en un
 * teléfono ni de lejos, y esto es un camino secundario —lo mismo se alcanza
 * desde las tarjetas—. A cambio, el hueco entre ellas es generoso.
 */
export function NightsStrip({
  nights,
  weeks,
  today,
}: {
  nights: DreamNight[];
  weeks: DreamWeek[];
  today: string;
}) {
  const { t } = useTranslation();

  const columns: DreamNight[][] = [];
  for (let index = 0; index < nights.length; index += WEEK) {
    columns.push(nights.slice(index, index + WEEK));
  }

  const busiestWeek = Math.max(...weeks.map((week) => week.count), 1);
  const firstColumn = columns[0] ?? [];

  return (
    <section
      style={{ animationDelay: '80ms' }}
      className="gap-3 p-4 sm:p-5 animate-rise-in flex h-full flex-col rounded-xl border bg-card"
    >
      <header className="gap-1 flex flex-col">
        <h2 className="text-sm font-medium">{t('dreams.nights')}</h2>
        <p className="text-xs text-muted-foreground">{t('dreams.nightsHint')}</p>
      </header>

      <div className="gap-2 flex">
        {/* Los días de la semana, tomados de la primera columna: la franja
            empieza en lunes, pero eso lo decide el servidor y no esta lista.
            La rejilla de al lado manda el alto, así que estas etiquetas se
            reparten el mismo hueco con `flex-1`. */}
        <div className="gap-1 sm:gap-1.5 pb-5 flex shrink-0 flex-col">
          {firstColumn.map((night) => (
            <span
              key={night.day}
              aria-hidden
              className="flex flex-1 items-center text-[10px] text-muted-foreground uppercase"
            >
              {formatWeekday(weekdayOf(night.day)).slice(0, 2)}
            </span>
          ))}
        </div>

        {/* Doce columnas repartiéndose el ancho: la franja llena su tarjeta en
            vez de quedarse en una esquina con medio metro de blanco al lado. */}
        <div className="gap-1 sm:gap-1.5 min-w-0 grid flex-1 grid-cols-12">
          {columns.map((column, index) => (
            <NightColumn
              key={column[0]?.day ?? index}
              nights={column}
              weekTotal={weeks[index]?.count ?? 0}
              busiestWeek={busiestWeek}
              today={today}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
