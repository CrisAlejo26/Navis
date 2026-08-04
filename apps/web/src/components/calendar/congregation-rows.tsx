import type { Congregation } from '@navis/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { ACCENT_RAIL, accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

/**
 * Las sedes de la iglesia: renombrar, cambiar de color y borrar.
 *
 * La última no se puede borrar: sin sede no se puede programar nada, así que
 * el servidor lo impide y aquí ni se ofrece.
 */
export function CongregationRows({
  congregations,
  onEdit,
  onDelete,
}: {
  congregations: readonly Congregation[];
  onEdit: (congregation: Congregation) => void;
  /** Lo confirma `DeleteCongregationDialog`: aquí solo se pide. */
  onDelete: (congregation: Congregation) => void;
}) {
  const { t } = useTranslation();

  return (
    <ul className="divide-y">
      {congregations.map((congregation) => (
        <li key={congregation.id} className="gap-3 py-3 flex items-center">
          <span
            aria-hidden
            style={accentVars(congregation.accent)}
            className={cn('h-8 w-1.5 shrink-0 rounded-full', ACCENT_RAIL)}
          />

          <span className="min-w-0 flex-1">
            <span className="font-medium block truncate">{congregation.name}</span>
            {congregation.city && (
              <span className="text-xs block truncate text-muted-foreground">
                {congregation.city}
              </span>
            )}
          </span>

          <Button
            aria-label={`${t('common.edit')}: ${congregation.name}`}
            onClick={() => {
              onEdit(congregation);
            }}
            variant="ghost"
            size="icon"
          >
            <Pencil size={15} aria-hidden />
          </Button>

          {congregations.length > 1 && (
            <Button
              aria-label={`${t('common.delete')}: ${congregation.name}`}
              onClick={() => {
                onDelete(congregation);
              }}
              variant="ghost"
              size="icon"
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={15} aria-hidden />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
