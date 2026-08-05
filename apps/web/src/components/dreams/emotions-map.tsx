import type { DreamEmotionCount } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { EmotionChip } from '@/components/dreams/emotion-chip';
import { ACCENT_RAIL, accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { useEmotionLabel } from '@/lib/dreams/emotion-label';
import { formatNumber } from '@/lib/format';

/**
 * **El mapa de emociones**: una sola barra con el color de cada una (§7.3).
 *
 * Es donde la portada tiene más color, y es color **con significado**: cada
 * tramo es una emoción de verdad y su ancho, cuántos sueños la llevan (§7.1.1).
 * Nada de esto sale de una librería de gráficos: doce rectángulos y sus anchos
 * no justifican traer una, y así el color puede ser el de cada dato.
 *
 * Cada tramo abre el listado filtrado por esa emoción (D16).
 */
export function EmotionsMap({ emotions }: { emotions: DreamEmotionCount[] }) {
  const { t } = useTranslation();
  const label = useEmotionLabel();
  const total = emotions.reduce((sum, emotion) => sum + emotion.count, 0);

  if (total === 0) return null;

  return (
    <section
      style={{ animationDelay: '420ms' }}
      className="gap-3 p-4 sm:p-5 animate-rise-in flex flex-col rounded-xl border bg-card"
    >
      <h2 className="text-sm font-medium">{t('dreams.emotionsMap')}</h2>

      <span className="h-3 flex overflow-hidden rounded-full bg-muted">
        {emotions.map((emotion) => (
          <Link
            key={emotion.id}
            to={`/dreams/list?emotion=${emotion.id}`}
            aria-label={`${label(emotion)}: ${t('dreams.emotionUses', { total: emotion.count })}`}
            title={`${label(emotion)} · ${String(emotion.count)}`}
            style={{
              ...accentVars(emotion.accent),
              width: `${String((emotion.count / total) * 100)}%`,
            }}
            className={cn(
              ACCENT_RAIL,
              'transition-opacity duration-200 hover:opacity-80',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
            )}
          />
        ))}
      </span>

      {/* La leyenda es la lista de siempre, con el número al lado: la barra
          dice la proporción y esto dice cuál es cuál. */}
      <ul className="gap-1.5 flex flex-wrap">
        {emotions.map((emotion) => (
          <li key={emotion.id}>
            <Link
              to={`/dreams/list?emotion=${emotion.id}`}
              className="gap-1 inline-flex items-center rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <EmotionChip
                emotion={emotion}
                size="sm"
                className="transition-colors hover:bg-[var(--acento)]/20"
              />
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {formatNumber(emotion.count)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
