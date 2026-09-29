import { DreamFormSheet } from '@/components/dreams/dream-form-sheet';
import { DreamFulfillSheet } from '@/components/dreams/dream-fulfill-sheet';
import { useSaveDream } from '@/hooks/use-dream-save';
import { useDream, useUpdateDream } from '@/hooks/use-dreams';

/** Los dos gestos de la tarjeta del listado, cada uno con su hoja. */

/** El gesto de cumplir, desde el listado: la fila solo trae el identificador. */
export function QuickFulfillSheet({ dreamId, onClose }: { dreamId: string; onClose: () => void }) {
    const update = useUpdateDream();
    return (
        <DreamFulfillSheet
            visible
            onClose={onClose}
            current={{ fulfilledAt: null, meaning: null }}
            onSave={async ({ fulfilledAt, meaning }) => {
                await update.mutateAsync({
                    id: dreamId,
                    input: { fulfilledAt, fulfillmentMeaning: meaning },
                });
            }}
        />
    );
}

/**
 * El gesto de editar: la fila trae un `excerpt`, no el cuerpo entero, así que se
 * pide el sueño de verdad antes de abrir el formulario (CLAUDE.md).
 */
export function QuickEditSheet({ dreamId, onClose }: { dreamId: string; onClose: () => void }) {
    const { data: dream } = useDream(dreamId);
    const save = useSaveDream();
    if (!dream) return null;
    return (
        <DreamFormSheet
            visible
            onClose={onClose}
            dream={dream}
            onSave={(values) => save(values, dreamId)}
        />
    );
}
