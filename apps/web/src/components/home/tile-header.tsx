import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';
import { ACCENT_TONE, FILLED_TONE, type StatAccent } from '@/lib/stat-tones';

/** El color de una cara del panel: rellena (el ancla) o con su propio acento. */
export type TileTone = 'filled' | StatAccent;

/**
 * La cabecera compartida de una cara de la primera fila del panel de inicio:
 * icono en pastilla teñida y etiqueta.
 *
 * Antes cada tarjeta (`MetricCard`, `EventsCard`, `NotesCard`) llevaba su
 * propio icono suelto en gris, y era justo lo que hacía que «Próximos
 * eventos» y «Notas recientes» se leyeran como una lista aparte y no como
 * caras del mismo instrumento que la tarjeta de estado. Los colores salen de
 * `stat-tones.ts`, que ya usan Sueños y Profecías: mismo acento, no uno
 * nuevo (Regla 1).
 */
export function TileHeader({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  tone: TileTone;
}) {
  const filled = tone === 'filled';
  const chip = filled ? FILLED_TONE.chip : ACCENT_TONE[tone].chip;

  return (
    <div className="gap-2 flex items-center">
      <span
        aria-hidden
        className={cn('size-7 inline-flex items-center justify-center rounded-lg', chip)}
      >
        <Icon size={15} />
      </span>
      <p
        className={cn('text-sm font-medium', filled ? FILLED_TONE.label : 'text-muted-foreground')}
      >
        {label}
      </p>
    </div>
  );
}
