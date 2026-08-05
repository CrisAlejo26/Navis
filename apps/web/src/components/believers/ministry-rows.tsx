import { useUpdateMinistry } from '@navis/api-client';
import type { MinistryCatalog } from '@navis/shared';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { ACCENT_RAIL, accentVars } from '@/lib/accents';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

/**
 * El catálogo de dones: renombrar, recolorear, apagar y —los que no son de
 * serie— borrar (D5).
 *
 * Los de serie llevan su etiqueta y no ofrecen borrado: son el suelo común del
 * vocabulario. Apagar uno no pierde el historial de quien ya lo tenía; solo
 * deja de proponerse.
 */
export function MinistryRows({
  ministries,
  onEdit,
  onDelete,
}: {
  ministries: readonly MinistryCatalog[];
  onEdit: (ministry: MinistryCatalog) => void;
  /** Lo confirma `DeleteMinistryDialog`: aquí solo se pide. */
  onDelete: (ministry: MinistryCatalog) => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateMinistry(api);

  return (
    <ul className="divide-y">
      {ministries.map((ministry) => (
        <li key={ministry.id} className="gap-3 py-3 flex items-center">
          <span
            aria-hidden
            style={accentVars(ministry.accent)}
            className={cn(
              'h-8 w-1.5 shrink-0 rounded-full',
              ACCENT_RAIL,
              !ministry.isActive && 'opacity-30',
            )}
          />

          <span className="min-w-0 flex-1">
            <span
              className={cn(
                'font-medium block truncate',
                !ministry.isActive && 'text-muted-foreground',
              )}
            >
              {ministry.name}
            </span>
            <span className="gap-2 text-xs flex text-muted-foreground">
              {ministry.isSystem && <span>{t('ministries.system')}</span>}
              {!ministry.isActive && <span>{t('ministries.inactive')}</span>}
            </span>
          </span>

          <Button
            variant="ghost"
            size="icon"
            aria-label={`${ministry.isActive ? t('ministries.deactivate') : t('ministries.activate')}: ${ministry.name}`}
            onClick={() => {
              update.mutate({ id: ministry.id, isActive: !ministry.isActive });
            }}
          >
            {ministry.isActive ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t('common.edit')}: ${ministry.name}`}
            onClick={() => {
              onEdit(ministry);
            }}
          >
            <Pencil size={15} aria-hidden />
          </Button>

          {!ministry.isSystem && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${t('common.delete')}: ${ministry.name}`}
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                onDelete(ministry);
              }}
            >
              <Trash2 size={15} aria-hidden />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
