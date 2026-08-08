import { useRemoveListMember, useReorderList } from '@navis/api-client';
import { believerName, type ListMember } from '@navis/shared';
import { Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MemberRow } from '@/components/lists/member-row';
import { MemberNoteDialog } from '@/components/lists/member-note-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * La lista ordenada de personas (RFC 0010 §8.3).
 *
 * El orden se manda **entero** en cada movimiento (D6): mover una fila recoloca
 * a las demás, y mandar «sube uno» desde dos pantallas a la vez deja un orden
 * que no es el de nadie.
 */
export function MemberRows({
  listId,
  members,
  editable,
}: {
  listId: string;
  members: readonly ListMember[];
  editable: boolean;
}) {
  const { t } = useTranslation();
  const reorder = useReorderList(api);
  const remove = useRemoveListMember(api);
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const [destino, setDestino] = useState<number | null>(null);
  const [editando, setEditando] = useState<ListMember | null>(null);

  if (members.length === 0) {
    return <EmptyState icon={Users} title={t('lists.emptyList')} />;
  }

  const mover = (from: number, to: number) => {
    if (from === to || to < 0 || to >= members.length) return;

    const orden = members.map((one) => one.believerId);
    const [movido] = orden.splice(from, 1);
    if (movido) orden.splice(to, 0, movido);

    reorder.mutate({ listId, believerIds: orden });
  };

  return (
    <>
      <ol className="gap-2 md:gap-0 md:rounded-xl md:border md:bg-card flex flex-col">
        {members.map((member, index) => (
          <MemberRow
            key={member.believerId}
            member={member}
            index={index}
            total={members.length}
            editable={editable}
            dragging={arrastrando === index}
            actions={{
              onMove: mover,
              onNote: setEditando,
              onRemove: (one) => {
                remove.mutate(
                  { listId, believerId: one.believerId },
                  {
                    onSuccess: () => {
                      toast.success(t('lists.memberRemoved', { name: believerName(one) }));
                    },
                  },
                );
              },
            }}
            onDragStart={() => {
              setArrastrando(index);
            }}
            onDragOver={() => {
              setDestino(index);
            }}
            onDrop={() => {
              if (arrastrando !== null && destino !== null) mover(arrastrando, destino);
              setArrastrando(null);
              setDestino(null);
            }}
          />
        ))}
      </ol>

      <MemberNoteDialog
        listId={listId}
        member={editando}
        onClose={() => {
          setEditando(null);
        }}
      />
    </>
  );
}
