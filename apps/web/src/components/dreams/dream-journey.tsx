import { daysBetween, type Dream } from '@navis/shared';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { STATE_ICON } from '@/lib/dreams/state-icons';
import { formatDay, formatNumber } from '@/lib/format';

interface Hito {
  key: string;
  Icon: LucideIcon;
  title: string;
  meta: string | null;
  body: string | null;
  /** Lo que ya ha pasado se pinta encendido; lo que no, apagado. */
  reached: boolean;
  tone: string;
}

/**
 * **El recorrido**: qué ha pasado con este sueño y cuándo (§7.6).
 *
 * Tres hitos y no una lista: soñarlo, buscarle sentido y verlo pasar. Los tres
 * son los mismos que dan el estado (D8), así que llevan sus mismos iconos —la
 * luna, la brújula y el amanecer— y el que todavía no ha llegado se ve apagado
 * en vez de desaparecer: **lo que falta es información**.
 *
 * Es un carril vertical y no el trayecto horizontal de una profecía: aquí no se
 * comparan varios sueños entre sí, se lee uno de arriba abajo.
 */
export function DreamJourney({ dream }: { dream: Dream }) {
  const { t } = useTranslation();

  const espera =
    dream.fulfilledAt === null
      ? null
      : formatNumber(Math.max(0, daysBetween(dream.dreamedAt, dream.fulfilledAt)));

  const hitos: Hito[] = [
    {
      key: 'dreamed',
      Icon: STATE_ICON.apuntado,
      title: t('dreams.journey.dreamed'),
      meta: formatDay(dream.dreamedAt),
      body: dream.body,
      reached: true,
      tone: 'text-foreground',
    },
    {
      key: 'interpreted',
      Icon: STATE_ICON.estudio,
      title: t('dreams.journey.interpreted'),
      meta: null,
      body: dream.interpretation,
      reached: dream.interpretation !== null,
      tone: 'text-primary',
    },
    {
      key: 'fulfilled',
      Icon: STATE_ICON.cumplido,
      title: t('dreams.journey.fulfilled'),
      meta:
        dream.fulfilledAt === null
          ? null
          : `${formatDay(dream.fulfilledAt)}${espera === null ? '' : ` · ${t('dreams.journey.after', { days: espera })}`}`,
      body: dream.fulfillmentMeaning,
      reached: dream.fulfilledAt !== null,
      tone: 'text-success',
    },
  ];

  return (
    <ol className="p-4 sm:p-6 flex flex-col rounded-xl border bg-card">
      {hitos.map((hito, index) => (
        <li
          key={hito.key}
          style={{ animationDelay: `${String(index * 90)}ms` }}
          className="gap-4 animate-rise-in flex"
        >
          {/* El carril: el punto del hito y la línea que baja al siguiente. */}
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'size-9 flex shrink-0 items-center justify-center rounded-full border',
                hito.reached ? cn('bg-card', hito.tone) : 'bg-muted text-muted-foreground/60',
              )}
            >
              <hito.Icon size={16} aria-hidden />
            </span>
            {index < hitos.length - 1 && (
              <span
                aria-hidden
                className={cn('w-px flex-1', hito.reached ? 'bg-border' : 'bg-border/50')}
              />
            )}
          </div>

          <div className={cn('min-w-0 flex-1', index < hitos.length - 1 && 'pb-6')}>
            <p className="gap-2 flex flex-wrap items-baseline">
              <span className={cn('text-sm font-medium', !hito.reached && 'text-muted-foreground')}>
                {hito.title}
              </span>
              {hito.meta && (
                <span className="text-xs text-muted-foreground tabular-nums">{hito.meta}</span>
              )}
            </p>

            <p
              className={cn(
                'mt-1 max-w-prose leading-relaxed text-[15px] whitespace-pre-wrap',
                !hito.reached && 'text-sm text-muted-foreground',
              )}
            >
              {hito.body ?? t('dreams.journey.pending')}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
