import { DREAM_STATES, type EmotionWithCount } from '@navis/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/chip';
import { ACCENT_RAIL, accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { useEmotionLabel } from '@/lib/dreams/emotion-label';
import type { DreamFilters } from '@/lib/dreams/filters';
import { STATE_ICON } from '@/lib/dreams/state-icons';
import { formatNumber } from '@/lib/format';

/**
 * Un grupo de filtros con su rótulo.
 *
 * El rótulo no es decoración: sin él, dos filas de pastillas seguidas se leen
 * como una sola lista y nadie sabe que la de abajo filtra por **otra cosa**.
 */
function Grupo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="gap-2 min-w-0 flex flex-col">
      <span className="font-medium tracking-wide text-[11px] text-muted-foreground uppercase">
        {label}
      </span>
      <div className="gap-1.5 flex flex-wrap" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

/**
 * Estado y emociones, **agrupados y rotulados** (RFC 0005 §7.5).
 *
 * Las de emoción llevan su punto de color y su cuenta: es el mismo vocabulario
 * que se ve en la ficha y en el mapa de la portada, así que se reconoce sin
 * leer. Solo salen las que se han usado alguna vez; filtrar por una que no
 * lleva ningún sueño es un camino que no lleva a nada.
 */
export function DreamsFilters({
  filters,
  emotions,
}: {
  filters: DreamFilters;
  emotions: EmotionWithCount[];
}) {
  const { t } = useTranslation();
  const label = useEmotionLabel();
  const usadas = emotions.filter((emotion) => emotion.count > 0);

  return (
    <div className="gap-4 lg:gap-6 lg:flex-row lg:items-start flex flex-col">
      <Grupo label={t('dreams.columns.state')}>
        {DREAM_STATES.map((state) => {
          const Icon = STATE_ICON[state];

          return (
            <Chip
              key={state}
              active={filters.state.includes(state)}
              onClick={() => {
                filters.toggleState(state);
              }}
            >
              <Icon size={13} aria-hidden />
              {t(`dreams.state.${state}`)}
            </Chip>
          );
        })}
      </Grupo>

      <span aria-hidden className="lg:block hidden w-px self-stretch bg-border" />

      <Grupo label={t('dreams.emotionsLabel')}>
        {usadas.map((emotion) => (
          <Chip
            key={emotion.id}
            active={filters.emotion.includes(emotion.id)}
            onClick={() => {
              filters.toggleEmotion(emotion.id);
            }}
          >
            <span
              aria-hidden
              style={accentVars(emotion.accent)}
              className={cn('size-2 shrink-0 rounded-full', ACCENT_RAIL)}
            />
            {label(emotion)}
            <span className="text-muted-foreground tabular-nums">
              {formatNumber(emotion.count)}
            </span>
          </Chip>
        ))}
      </Grupo>
    </div>
  );
}
