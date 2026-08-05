import { dreamState, type Dream } from '@navis/shared';
import { Pencil, RotateCcw, Sunrise, Trash2 } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { EmotionChip } from '@/components/dreams/emotion-chip';
import { DreamStateBadge } from '@/components/dreams/state-badge';
import { Button } from '@/components/ui/button';
import { accentColor } from '@/lib/accents';
import { formatDay, formatWeekday } from '@/lib/format';

type TintVars = CSSProperties & Record<'--acento' | '--acento-2', string>;

/**
 * La cabecera de la ficha, **teñida con las emociones del sueño** (§7.6).
 *
 * Es lo que hace que dos sueños no se parezcan al abrirlos: el color no lo pone
 * la pantalla, lo pone el dato (§7.1.1). Con una emoción es un degradado de su
 * color a sí mismo; con varias, entre las dos primeras; sin ninguna, el gris de
 * siempre —el color entra por el dato o no entra—.
 *
 * El tinte va al 22 % y no al 8: por debajo del 12 % no se ve, que es
 * exactamente lo que le pasaba a la portada de profecías (§7.1.3).
 */
export function DreamIdentity({
  dream,
  onEdit,
  onDelete,
  onFulfill,
  onReopen,
  isReopening,
}: {
  dream: Dream;
  onEdit: () => void;
  onDelete: () => void;
  /** Abre el diálogo de cumplimiento: la fecha y qué significó (D10). */
  onFulfill: () => void;
  onReopen: () => void;
  isReopening: boolean;
}) {
  const { t } = useTranslation();
  const [first, second] = dream.emotions;
  const day = new Date(`${dream.dreamedAt}T00:00:00Z`);

  const tint: TintVars | undefined = first
    ? {
        '--acento': accentColor(first.accent),
        '--acento-2': accentColor((second ?? first).accent),
      }
    : undefined;

  return (
    <header
      style={tint}
      className={
        tint
          ? 'gap-3 p-5 sm:p-6 animate-rise-in flex flex-col rounded-xl border bg-gradient-to-br from-[var(--acento)]/22 to-[var(--acento-2)]/8'
          : 'gap-3 p-5 sm:p-6 animate-rise-in flex flex-col rounded-xl border bg-muted'
      }
    >
      <div className="gap-3 flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {formatWeekday(day.getUTCDay(), 'long')}
          </p>
          <p className="text-2xl font-semibold tracking-[-0.02em] tabular-nums">
            {formatDay(dream.dreamedAt)}
          </p>
        </div>

        <span className="gap-0.5 flex shrink-0">
          <Button variant="ghost" size="icon" aria-label={t('dreams.edit')} onClick={onEdit}>
            <Pencil size={16} aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('common.delete')}
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 size={16} aria-hidden />
          </Button>
        </span>
      </div>

      <h1 className="text-lg font-medium leading-snug">{dream.title ?? t('dreams.untitled')}</h1>

      <div className="gap-2 flex flex-wrap items-center">
        <DreamStateBadge state={dreamState(dream)} />
        {dream.emotions.map((emotion) => (
          <EmotionChip key={emotion.id} emotion={emotion} />
        ))}
      </div>

      {/* La acción principal vive aquí y no en un bloque de abajo: así sigue a
          mano en las cuatro vistas, y cambia con el estado —mientras no ha
          pasado, lo que se pulsa es «Ya se cumplió» (RFC 0004 D20)—. */}
      {dream.fulfilledAt ? (
        <Button
          size="lg"
          variant="secondary"
          className="self-start"
          isLoading={isReopening}
          onClick={onReopen}
        >
          <RotateCcw size={18} aria-hidden />
          {t('dreams.reopen')}
        </Button>
      ) : (
        <Button size="lg" className="self-start" onClick={onFulfill}>
          <Sunrise size={18} aria-hidden />
          {t('dreams.markFulfilled')}
        </Button>
      )}
    </header>
  );
}
