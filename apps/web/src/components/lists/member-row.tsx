import { believerName, type ListMember } from '@navis/shared';
import { GripVertical, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { BelieverPhoto } from '@/components/believers/believer-photo';
import { MemberRowActionButtons } from '@/components/lists/member-row-actions';
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
        // Por debajo de `md`, cada persona es su propia ficha —con aire y las
        // acciones en su fila, a la anchura entera para el pulgar (Regla 5
        // §4)—; de `md` para arriba vuelve a ser la fila compacta de antes,
        // con el asa de arrastrar que en un teléfono no se puede usar.
        'p-3 gap-2 flex flex-col rounded-xl border bg-card',
        'md:px-3 md:py-2.5 md:flex-row md:items-center md:gap-3 md:rounded-none md:border-0 md:border-b md:last:border-b-0',
        dragging && 'opacity-40',
      )}
    >
      <div className="gap-3 min-w-0 flex flex-1 items-center">
        {editable && (
          <GripVertical
            size={16}
            aria-hidden
            className="md:block hidden shrink-0 cursor-grab text-muted-foreground"
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
      </div>

      {editable && (
        <MemberRowActionButtons member={member} index={index} total={total} actions={actions} />
      )}
    </li>
  );
}
