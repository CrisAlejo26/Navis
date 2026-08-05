import { accentVars } from '@/lib/accents';
import { formatNumber } from '@/lib/format';

export interface Bucket {
  label: string;
  accent: string;
  count: number;
}

/**
 * Un reparto en barra apilada, **con el color de cada cosa** (RFC 0010 §8.3).
 *
 * La sede, la labor y el don ya tienen color propio en toda la aplicación, así
 * que aquí se usa el suyo: el color dice de qué se está hablando y no hace falta
 * mirar la leyenda dos veces (D37).
 *
 * La leyenda va debajo con **texto y cifra**, no solo color: el color es
 * refuerzo (Regla 3 §7).
 */
export function BucketBars({ title, buckets }: { title: string; buckets: readonly Bucket[] }) {
  const total = buckets.reduce((suma, one) => suma + one.count, 0);
  if (total === 0) return null;

  return (
    <div className="p-5 gap-3 flex flex-col rounded-xl border bg-card">
      <h3 className="text-sm font-semibold">{title}</h3>

      <div className="h-3 flex overflow-hidden rounded-full bg-muted" role="presentation">
        {buckets.map((one) => (
          <span
            key={one.label}
            style={{ ...accentVars(one.accent), width: `${String((one.count / total) * 100)}%` }}
            className="bg-[var(--acento)]"
          />
        ))}
      </div>

      <ul className="gap-x-4 gap-y-1 flex flex-wrap">
        {buckets.map((one) => (
          <li key={one.label} className="gap-1.5 text-xs flex items-center">
            <span
              aria-hidden
              style={accentVars(one.accent)}
              className="size-2.5 rounded-full bg-[var(--acento)]"
            />
            {one.label}
            <span className="font-medium text-muted-foreground tabular-nums">
              {formatNumber(one.count)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
