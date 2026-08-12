import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

/**
 * **El Faro**: el elemento firma de la sección (RFC 0018 D19, §9.1).
 *
 * No es la llama de Duolingo —eso sería la pantalla de otro producto con el
 * logo cambiado (Regla 9)—: es un guiño náutico, un haz que gira despacio y
 * sin parar detrás del número de la racha. `conic-gradient` girando con
 * `transform: rotate()`, la técnica que ya usa el resto del proyecto para
 * animar sin tocar el layout.
 *
 * `dimmed` es un día futuro: la tira sigue, pero el faro se atenúa porque no
 * hay nada que celebrar todavía (§9.3). `celebrate` es el pulso único al
 * cerrar el día —no en bucle, es un momento, no el ambiente de la pantalla—.
 */
export function Faro({
  days,
  dimmed = false,
  celebrate = false,
}: {
  days: number;
  dimmed?: boolean;
  celebrate?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="img"
      aria-label={t('tasks.lighthouseLabel', { count: days })}
      className={cn(
        'h-32 w-32 relative inline-flex shrink-0 items-center justify-center',
        celebrate && 'animate-pulso',
      )}
    >
      {/* El resplandor de fondo: quieto, no gira. */}
      <span
        aria-hidden
        className={cn(
          'inset-2 blur-xl absolute rounded-full bg-warning/25 transition-opacity duration-700',
          dimmed && 'opacity-30',
        )}
      />

      {/* El haz, girando en bucle. `prefers-reduced-motion` lo congela desde la
          regla global de `global.css`: no hace falta una condición aquí. */}
      <span
        aria-hidden
        className={cn(
          'inset-0 animate-faro absolute rounded-full transition-opacity duration-700',
          dimmed && 'opacity-40',
        )}
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, var(--color-warning) 26deg, transparent 68deg, transparent 300deg, var(--color-warning) 342deg, transparent 360deg)',
        }}
      />

      {/* El anillo exterior: la torre. */}
      <span className="inset-1 absolute rounded-full border-2 border-warning/40" />

      {/* El disco interior, con el número. */}
      <span className="shadow-sm relative z-10 flex h-[5.5rem] w-[5.5rem] flex-col items-center justify-center rounded-full border bg-card">
        <span className="text-3xl font-bold leading-none text-foreground tabular-nums">{days}</span>
        <span className="mt-1.5 font-semibold text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          {t('tasks.streak')}
        </span>
      </span>
    </div>
  );
}
