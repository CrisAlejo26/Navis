import { believerName, type ListMember } from '@navis/shared';
import { ChevronDown, ChevronUp, Pencil, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { RowButton } from '@/components/lists/row-button';
import type { MemberRowActions } from '@/components/lists/member-row';

/** Subir, bajar, anotar y quitar: el cluster de acciones de una fila. */
export function MemberRowActionButtons({
  member,
  index,
  total,
  actions,
}: {
  member: ListMember;
  index: number;
  total: number;
  actions: MemberRowActions;
}) {
  const { t } = useTranslation();
  const name = believerName(member);

  return (
    <div className="gap-0.5 pt-1 -mx-3 px-3 md:pt-0 md:mx-0 md:border-t-0 md:px-0 flex shrink-0 items-center justify-end border-t">
      <RowButton
        label={t('lists.moveUp', { name })}
        disabled={index === 0}
        onClick={() => {
          actions.onMove(index, index - 1);
        }}
      >
        <ChevronUp size={15} aria-hidden />
      </RowButton>
      <RowButton
        label={t('lists.moveDown', { name })}
        disabled={index === total - 1}
        onClick={() => {
          actions.onMove(index, index + 1);
        }}
      >
        <ChevronDown size={15} aria-hidden />
      </RowButton>
      <RowButton
        label={t('lists.editNote', { name })}
        onClick={() => {
          actions.onNote(member);
        }}
      >
        <Pencil size={14} aria-hidden />
      </RowButton>
      <RowButton
        label={t('lists.removeMember', { name })}
        onClick={() => {
          actions.onRemove(member);
        }}
      >
        <X size={15} aria-hidden />
      </RowButton>
    </div>
  );
}
