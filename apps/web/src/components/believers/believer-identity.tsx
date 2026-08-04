import {
  believerName,
  type BelieverListItem,
  type Congregation,
  type IsoDate,
} from '@navis/shared';
import { NotebookPen, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { GiftTags } from '@/components/believers/gift-tags';
import { Sonda } from '@/components/believers/sonda';
import { StatusBadge } from '@/components/believers/status-badge';
import { Button } from '@/components/ui/button';
import { accentVars } from '@/lib/accents';
import { formatDate } from '@/lib/format';

interface IdentityProps {
  believer: BelieverListItem;
  congregation: Congregation | undefined;
  today: IsoDate;
  canManage: boolean;
  onNote: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * **Quién es**: la columna izquierda de la ficha (§7.5).
 *
 * «Añadir nota» es la acción principal y va a 48 px: es lo que más se pulsa y
 * se pulsa de pie (Regla 5 §4). La sonda va a todo lo ancho con la frase
 * entera —«Última nota el 14 de julio · hace 21 días · avisa a los 20»—, que es
 * donde de verdad se lee.
 */
export function BelieverIdentity({
  believer,
  congregation,
  today,
  canManage,
  onNote,
  onEdit,
  onDelete,
}: IdentityProps) {
  const { t } = useTranslation();
  const name = believerName(believer);

  return (
    <div className="gap-5 p-5 lg:sticky lg:top-4 flex flex-col rounded-xl border bg-card">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{name}</h1>

        <div className="gap-x-3 gap-y-2 mt-3 flex flex-wrap items-center">
          <StatusBadge status={believer.status} />

          {congregation && (
            <span className="gap-1.5 text-xs inline-flex items-center text-muted-foreground">
              <span
                aria-hidden
                style={accentVars(congregation.accent)}
                className="h-1.5 w-1.5 rounded-full bg-[var(--acento)]"
              />
              {congregation.name}
            </span>
          )}

          {believer.phone && (
            <a
              href={`tel:${believer.phone}`}
              aria-label={t('believers.callPhone', { name })}
              className="gap-1 text-xs inline-flex items-center rounded-sm text-muted-foreground tabular-nums hover:text-foreground"
            >
              <Phone size={12} aria-hidden />
              {believer.phone}
            </a>
          )}
        </div>
      </div>

      <section className="gap-2 flex flex-col">
        <h2 className="font-medium text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
          {t('believers.gifts')}
        </h2>

        {believer.gifts.length > 0 ? (
          <GiftTags gifts={believer.gifts} />
        ) : (
          <p className="text-xs text-muted-foreground">{t('believers.noGifts')}</p>
        )}

        {canManage && (
          <Button variant="ghost" size="sm" className="-ml-3 self-start" onClick={onEdit}>
            <Plus size={14} aria-hidden />
            {t('gifts.add')}
          </Button>
        )}
      </section>

      <section className="gap-2 pt-4 flex flex-col border-t">
        <Sonda believer={believer} today={today} variant="block" />

        <p className="text-xs text-muted-foreground">
          {believer.lastNoteAt
            ? t('believers.alert.lastNote', { date: formatDate(believer.lastNoteAt) })
            : t('believers.alert.never')}
          {believer.alertAfterDays !== null && (
            <> · {t('believers.alert.margin', { days: believer.alertAfterDays })}</>
          )}
        </p>

        {canManage && (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs self-start rounded-sm text-primary underline-offset-2 hover:underline"
          >
            {t('believers.changeAlert')}
          </button>
        )}
      </section>

      {canManage && (
        <div className="gap-2 flex flex-col">
          <Button size="lg" onClick={onNote}>
            <NotebookPen size={18} aria-hidden />
            {t('notes.add')}
          </Button>

          <div className="gap-2 flex">
            <Button variant="secondary" size="md" className="flex-1" onClick={onEdit}>
              <Pencil size={15} aria-hidden />
              {t('common.edit')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('believers.deleteTitle', { name })}
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 size={16} aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
