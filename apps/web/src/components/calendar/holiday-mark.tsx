import type { Holiday } from '@navis/shared';

import { useHolidayScopeLabel } from '@/lib/calendar/holiday';
import { cn } from '@/lib/cn';

/**
 * El festivo de un día en la rejilla del mes.
 *
 * **Es contexto, no contenido**: sirve para decidir si se adelanta la reunión,
 * así que se pone donde se ve de reojo y no compite con las reuniones, que son
 * lo que se viene a mirar. Por eso una línea fina bajo el número y no una
 * cinta más entre las de las sedes.
 *
 * El punto rojo es la convención del calendario de pared de toda la vida, pero
 * **el color no informa solo** (Regla 9 §5): al lado va el nombre del festivo,
 * y la etiqueta accesible dice si es nacional o de la comunidad. En compacto se
 * queda solo el punto, y entonces el nombre viaja en el `title` y en el
 * `aria-label`.
 */
export function HolidayMark({ holiday, compact = false }: { holiday: Holiday; compact?: boolean }) {
  const alcance = useHolidayScopeLabel(holiday);

  return (
    <p
      title={`${holiday.name} · ${alcance}`}
      aria-label={`${holiday.name}. ${alcance}`}
      className={cn(
        'gap-1 min-w-0 flex items-center text-[11px] text-muted-foreground',
        compact && 'gap-0',
      )}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-destructive" />
      {!compact && <span className="truncate">{holiday.name}</span>}
    </p>
  );
}
