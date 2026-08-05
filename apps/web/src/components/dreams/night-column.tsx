import type { DreamNight } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { cn } from '@/lib/cn';
import { nightTone } from '@/lib/dreams/state-icons';
import { formatDay } from '@/lib/format';

/**
 * Una semana de la franja: siete noches y, debajo, lo que suma (D19).
 *
 * La barra de abajo es la métrica semanal que se pidió, sin gastar un gráfico
 * aparte: la columna ya es la semana, así que su total va donde está.
 *
 * Las celdas son cuadradas y **crecen con el ancho** (`aspect-square w-full`)
 * en vez de medir un tamaño fijo: con doce columnas fijas de 24 px, la franja
 * ocupaba una cuarta parte de su tarjeta y el resto era blanco.
 */
export function NightColumn({
  nights,
  weekTotal,
  busiestWeek,
  today,
  index,
}: {
  nights: DreamNight[];
  weekTotal: number;
  /** La semana más llena de la franja: es la referencia de la barra. */
  busiestWeek: number;
  today: string;
  index: number;
}) {
  const { t } = useTranslation();

  return (
    <div
      style={{ animationDelay: `${String(index * 40)}ms` }}
      className="gap-1 sm:gap-1.5 animate-rise-in min-w-0 flex flex-col"
    >
      {nights.map((night) => {
        const label = t('dreams.nightLabel', {
          date: formatDay(night.day),
          total: night.count,
        });
        const shared = cn(
          'aspect-square w-full rounded-[5px] transition-transform duration-150',
          nightTone(night.count),
          night.day === today && 'ring-2 ring-ring ring-offset-1 ring-offset-card',
        );

        // Una noche que aún no ha pasado no lleva a ningún sitio: se pinta para
        // que la rejilla salga rectangular y ahí se queda.
        if (night.day > today) {
          return <span key={night.day} aria-hidden className={cn(shared, 'opacity-40')} />;
        }

        return (
          <Link
            key={night.day}
            to={`/dreams/list?from=${night.day}&to=${night.day}`}
            aria-label={label}
            title={label}
            className={cn(
              shared,
              'hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            )}
          />
        );
      })}

      {/* El total de la semana. `scaleY` y no `height`: el compositor sabe
          resolver el primero (Regla 9 §5). */}
      <span aria-hidden className="mt-1 h-4 flex w-full items-end rounded-sm bg-muted">
        <span
          className="h-4 w-full origin-bottom rounded-sm bg-primary"
          style={{
            transform: `scaleY(${String(busiestWeek === 0 ? 0 : weekTotal / busiestWeek)})`,
          }}
        />
      </span>
    </div>
  );
}
