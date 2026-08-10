import { formatDate } from '@/lib/format';

/**
 * Un separador de día, leído como una entrada de cuaderno de bitácora: «— 10
 * de agosto —» en versalitas pequeñas, sin la píldora gris rellena de
 * cualquier clon de WhatsApp (RFC 0016 §5). Es la pieza que se quita para
 * dejar sitio a la estela (Regla 9 §4: una audacia, no dos).
 */
export function DayDivider({ date }: { date: string }) {
  return (
    <div role="separator" className="py-3 gap-3 flex items-center text-muted-foreground">
      <span aria-hidden className="h-px flex-1 bg-border" />
      <span className="font-medium text-[11px] tracking-[0.14em] uppercase">
        {formatDate(date, 'medium')}
      </span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}
