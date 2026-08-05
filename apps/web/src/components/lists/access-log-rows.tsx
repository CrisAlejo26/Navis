import type { ListAccessEntry, ListAccessOutcome } from '@navis/shared';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/lib/format';

const OUTCOME_KEY: Record<ListAccessOutcome, string> = {
  ok: 'lists.outcomeOk',
  bad_credentials: 'lists.outcomeBad',
  no_grant: 'lists.outcomeNoGrant',
  throttled: 'lists.outcomeThrottled',
};

/**
 * Los intentos de entrar (RFC 0010 D27, §8.3).
 *
 * Veinte fallos seguidos desde el mismo sitio son una noticia, y por eso se
 * enseñan: en `warning` **con su icono**, porque el color no informa solo
 * (Regla 3 §7). No se guarda la contraseña tecleada, ni acertada ni fallada.
 */
export function AccessLogRows({ entries }: { entries: readonly ListAccessEntry[] }) {
  const { t } = useTranslation();
  const fallidos = entries.filter((one) => one.outcome !== 'ok');

  if (fallidos.length === 0) return null;

  return (
    <div className="p-5 gap-3 flex flex-col rounded-xl border bg-card">
      <h3 className="gap-1.5 text-sm font-semibold flex items-center text-warning">
        <AlertTriangle size={15} aria-hidden />
        {t('lists.failedTries')}
      </h3>

      <ul className="gap-1 flex flex-col">
        {fallidos.map((entry, index) => (
          <li
            key={`${entry.at}-${String(index)}`}
            className="gap-2 text-xs flex flex-wrap items-baseline justify-between"
          >
            <span className="font-medium">{entry.username}</span>
            <span className="text-muted-foreground">
              {t(OUTCOME_KEY[entry.outcome])} · {entry.ipPrefix || t('lists.unknownOrigin')} ·{' '}
              {formatDateTime(entry.at)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
