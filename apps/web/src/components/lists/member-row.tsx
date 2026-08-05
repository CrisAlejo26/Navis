import { believerName, type ListMember } from '@navis/shared';
import { ChevronDown, ChevronUp, GripVertical, KeyRound, Pencil, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { BelieverPhoto } from '@/components/believers/believer-photo';
import { RowButton } from '@/components/lists/row-button';
import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

export interface MemberRowActions {
  onMove: (from: number, to: number) => void;
  onRemove: (member: ListMember) => void;
  onNote: (member: ListMember) => void;
}

/**
 * Una fila de la pestaña **Personas** (RFC 0010 §8.3).
 *
 * El ordinal a la izquierda porque **el orden es el dato** (D6), y los botones
 * de subir y bajar al lado del asa de arrastrar: arrastrar no es accesible por
 * sí solo, y quien va con teclado necesita las dos flechas.
 *
 * La **llave pequeña** junto al nombre es la forma de leer de un vistazo la
 * distinción de D21 —estar en una lista no es poder verla— sin cambiar de
 * pestaña.
 */
export function MemberRow({
  member,
  index,
  total,
  editable,
  actions,
  dragging,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  member: ListMember;
  index: number;
  total: number;
  editable: boolean;
  actions: MemberRowActions;
  dragging: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
}) {
  const { t } = useTranslation();
  const name = believerName(member);

  return (
    <li
      draggable={editable}
      onDragStart={onDragStart}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
      onDrop={onDrop}
      className={cn(
        'px-3 py-2.5 gap-3 flex items-center border-b last:border-b-0',
        dragging && 'opacity-40',
      )}
    >
      {editable && (
        <GripVertical
          size={16}
          aria-hidden
          className="shrink-0 cursor-grab text-muted-foreground"
        />
      )}

      <span className="w-6 text-sm font-semibold shrink-0 text-right text-muted-foreground tabular-nums">
        {index + 1}
      </span>

      <BelieverPhoto believer={{ id: member.believerId, hasPhoto: member.hasPhoto }} />

      <div className="min-w-0 flex-1">
        <p className="gap-1.5 text-sm font-medium flex items-center">
          <span className="truncate">{name}</span>
          {member.hasAccess && (
            <KeyRound
              size={13}
              aria-label={t('lists.hasAccess')}
              className="shrink-0 text-muted-foreground"
            />
          )}
        </p>

        <p className="gap-1.5 text-xs flex flex-wrap items-center text-muted-foreground">
          {member.congregationName && (
            <span
              style={accentVars(member.congregationAccent ?? 'primary')}
              className="gap-1 inline-flex items-center"
            >
              <span aria-hidden className="size-2 rounded-full bg-[var(--acento)]" />
              {member.congregationName}
            </span>
          )}
          {member.note && <span className="italic">«{member.note}»</span>}
        </p>
      </div>

      {editable && (
        <div className="gap-0.5 flex shrink-0 items-center">
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
      )}
    </li>
  );
}
