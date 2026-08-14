import type { CustomTable } from '@navis/shared';
import { Link } from 'react-router';

import { TASK_ICON_MAP } from '@/lib/tasks/icon-map';
import { accentVars } from '@/lib/accents';

/**
 * Un panel del tablón de tablas (RFC 0021 D32): relleno de su acento, con el
 * icono grande y el nombre — mismo criterio que el tablón de Listas.
 */
export function TablePanel({ table, delay }: { table: CustomTable; delay: number }) {
  const Icon = TASK_ICON_MAP[table.icon];

  return (
    <Link
      to={`/tables/${table.slug}`}
      style={{ ...accentVars(table.accent), animationDelay: `${String(delay)}ms` }}
      className="p-5 gap-4 animate-rise-in group min-h-36 rounded-2xl hover:-translate-y-0.5 relative flex flex-col justify-between overflow-hidden bg-[var(--acento)] text-[var(--acento-fg)] transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-[var(--acento-fg)]/15">
        {Icon && <Icon size={22} aria-hidden />}
      </div>

      <h2 className="text-xl font-semibold truncate tracking-[-0.02em]">{table.name}</h2>
    </Link>
  );
}
