import { useUpdateGift } from '@navis/api-client';
import type { Gift } from '@navis/shared';
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
export function GiftRows({
  gifts,
  onEdit,
  onDelete,
}: {
  gifts: readonly Gift[];
  onEdit: (gift: Gift) => void;
  /** Lo confirma `DeleteGiftDialog`: aquí solo se pide. */
  onDelete: (gift: Gift) => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateGift(api);

  return (
    <ul className="divide-y">
      {gifts.map((gift) => (
        <li key={gift.id} className="gap-3 py-3 flex items-center">
          <span
            aria-hidden
            style={accentVars(gift.accent)}
            className={cn(
              'h-8 w-1.5 shrink-0 rounded-full',
              ACCENT_RAIL,
              !gift.isActive && 'opacity-30',
            )}
          />

          <span className="min-w-0 flex-1">
            <span
              className={cn(
                'font-medium block truncate',
                !gift.isActive && 'text-muted-foreground',
              )}
            >
              {gift.name}
            </span>
            <span className="gap-2 text-xs flex text-muted-foreground">
              {gift.isSystem && <span>{t('gifts.system')}</span>}
              {!gift.isActive && <span>{t('gifts.inactive')}</span>}
            </span>
          </span>

          <Button
            variant="ghost"
            size="icon"
            aria-label={`${gift.isActive ? t('gifts.deactivate') : t('gifts.activate')}: ${gift.name}`}
            onClick={() => {
              update.mutate({ id: gift.id, isActive: !gift.isActive });
            }}
          >
            {gift.isActive ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t('common.edit')}: ${gift.name}`}
            onClick={() => {
              onEdit(gift);
            }}
          >
            <Pencil size={15} aria-hidden />
          </Button>

          {!gift.isSystem && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${t('common.delete')}: ${gift.name}`}
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                onDelete(gift);
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
