import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select } from '@/components/ui/select';
import type { BulkActionChoice } from '@/lib/data-table/bulk-actions';

interface BulkChoiceDialogProps {
    /** Sin ella el diálogo está cerrado. */
    choice: BulkActionChoice | undefined;
    isPending: boolean;
    error: string | null;
    onClose: () => void;
    onConfirm: (picked: string) => void;
}

/** La pregunta de una acción masiva que necesita que se elija algo antes de correr. */
export function BulkChoiceDialog({
    choice,
    isPending,
    error,
    onClose,
    onConfirm,
}: BulkChoiceDialogProps) {
    // Se remonta al abrir (la clave es el título): cada vez empieza sin nada elegido.
    return (
        <ChoiceBody
            key={choice?.title ?? 'closed'}
            choice={choice}
            isPending={isPending}
            error={error}
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );
}

function ChoiceBody({ choice, isPending, error, onClose, onConfirm }: BulkChoiceDialogProps) {
    const [picked, setPicked] = useState('');

    return (
        <ConfirmDialog
            open={choice !== undefined}
            onClose={onClose}
            onConfirm={() => {
                onConfirm(picked);
            }}
            title={choice?.title ?? ''}
            description={choice?.description ?? ''}
            confirmLabel={choice?.confirmLabel ?? ''}
            isPending={isPending}
            error={error}
            confirmDisabled={choice?.emptyLabel === undefined && picked === ''}
        >
            <Select
                aria-label={choice?.label}
                value={picked}
                onChange={(event) => {
                    setPicked(event.target.value);
                }}
            >
                <option value="">{choice?.emptyLabel ?? choice?.label}</option>
                {(choice?.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </Select>
        </ConfirmDialog>
    );
}
