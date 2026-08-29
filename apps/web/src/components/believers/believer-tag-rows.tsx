import { useUpdateBelieverTag } from '@navis/api-client';
import type { BelieverTag } from '@navis/shared';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { ACCENT_RAIL, accentVars } from '@/lib/accents';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

/**
 * El catálogo de etiquetas de creyente: renombrar, recolorear, apagar y borrar.
 *
 * Misma forma que el de dones: apagar una no pierde el historial de quien ya
 * la tenía; solo deja de proponerse. No hay etiquetas de serie —el catálogo
 * nace vacío—, así que todas se pueden borrar.
 */
export function BelieverTagRows({
  tags,
  onEdit,
  onDelete,
}: {
  tags: readonly BelieverTag[];
  onEdit: (tag: BelieverTag) => void;
  /** Lo confirma `DeleteBelieverTagDialog`: aquí solo se pide. */
  onDelete: (tag: BelieverTag) => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateBelieverTag(api);

  return (
    <ul className="divide-y">
      {tags.map((tag) => (
        <li key={tag.id} className="gap-3 py-3 flex items-center">
          <span
            aria-hidden
            style={accentVars(tag.accent)}
            className={cn(
              'h-8 w-1.5 shrink-0 rounded-full',
              ACCENT_RAIL,
              !tag.isActive && 'opacity-30',
            )}
          />

          <span className="min-w-0 flex-1">
            <span
              className={cn('font-medium block truncate', !tag.isActive && 'text-muted-foreground')}
            >
              {tag.name}
            </span>
            <span className="gap-2 text-xs flex text-muted-foreground">
              {tag.isSystem && <span>{t('believerTags.system')}</span>}
              {!tag.isActive && <span>{t('believerTags.inactive')}</span>}
            </span>
          </span>

          <Button
            variant="ghost"
            size="icon"
            aria-label={`${tag.isActive ? t('believerTags.deactivate') : t('believerTags.activate')}: ${tag.name}`}
            onClick={() => {
              update.mutate({ id: tag.id, isActive: !tag.isActive });
            }}
          >
            {tag.isActive ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t('common.edit')}: ${tag.name}`}
            onClick={() => {
              onEdit(tag);
            }}
          >
            <Pencil size={15} aria-hidden />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t('common.delete')}: ${tag.name}`}
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              onDelete(tag);
            }}
          >
            <Trash2 size={15} aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  );
}
