import { Link } from 'react-router';

import { TeachingActions } from '@/components/teachings/teaching-actions';
import { TeachingChecklistBadge } from '@/components/teachings/teaching-checklist-badge';
import type { TeachingCells } from '@/components/teachings/teaching-row';
import { cn } from '@/lib/cn';
import { formatDay } from '@/lib/format';
import { checklistBorder } from '@/lib/teachings/checklist-border';

/**
 * La misma enseñanza como ficha, por debajo de `md` (Regla 5).
 *
 * El filete de color a la izquierda (§3) no lo pinta profecías ni el
 * cuaderno: aquí dice si queda algo sin marcar en la checklist, de un
 * vistazo y sin abrir la fila.
 */
export function TeachingListCard({ teaching, onEdit, onDelete }: TeachingCells) {
  return (
    <article
      className={cn('gap-2 pl-3 flex flex-col border-l-2', checklistBorder(teaching.checklist))}
    >
      <div className="gap-2 flex items-start justify-between">
        <Link
          to={`/teachings/${teaching.id}`}
          className="min-w-0 font-medium text-[15px] hover:underline"
        >
          {teaching.title}
        </Link>
        <TeachingChecklistBadge checklist={teaching.checklist} />
      </div>

      <p className="line-clamp-3 text-[13px] text-muted-foreground">{teaching.excerpt}</p>

      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDay(teaching.receivedAt)}
      </span>

      <TeachingActions title={teaching.title} onEdit={onEdit} onDelete={onDelete} />
    </article>
  );
}
