import type { List } from '@navis/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VisibilityBadge } from '@/components/lists/visibility-badge';
import { Button } from '@/components/ui/button';
import { accentVars } from '@/lib/accents';

/**
 * La cabecera de la ficha, **a sangre en el color de la lista** (RFC 0010 §8.3).
 *
 * Es lo que dice de qué lista estás hablando antes de leer una palabra, y es la
 * misma decisión que el panel del tablón: el color **es** el dato (D37). Los
 * márgenes negativos la sacan del `padding` del layout para que llegue a los
 * bordes; en un teléfono es donde más se nota.
 */
export function ListHeader({
  list,
  onEdit,
  onDelete,
}: {
  list: List;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <header
      style={accentVars(list.accent)}
      className="px-4 py-8 md:px-8 md:py-10 gap-5 -mx-4 -mt-4 md:-mx-8 md:-mt-8 flex flex-wrap items-end justify-between bg-[var(--acento)] text-[var(--acento-fg)]"
    >
      <div className="min-w-0">
        <VisibilityBadge visibility={list.visibility} onPanel />
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-[-0.03em]">{list.name}</h1>
        {list.description && (
          <p className="mt-2 max-w-prose text-sm opacity-85">{list.description}</p>
        )}
      </div>

      {(onEdit ?? onDelete) && (
        <div className="gap-2 flex">
          {onEdit && (
            <Button
              variant="ghost"
              onClick={onEdit}
              className="text-[var(--acento-fg)] hover:bg-[var(--acento-fg)]/15"
            >
              <Pencil size={15} aria-hidden />
              {t('common.edit')}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              onClick={onDelete}
              aria-label={t('lists.delete')}
              className="text-[var(--acento-fg)] hover:bg-[var(--acento-fg)]/15"
            >
              <Trash2 size={15} aria-hidden />
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
