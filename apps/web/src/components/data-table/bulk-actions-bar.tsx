import { X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/cn';
import { ICON_TONE_TEXT } from '@/lib/icon-tones';
import { Tooltip } from '@/components/ui/tooltip';
import type { BulkAction, BulkActionConfirm } from '@/lib/data-table/bulk-actions';
import { toast } from '@/lib/toast';

interface BulkActionsBarProps<TItem> {
    items: readonly TItem[];
    actions: readonly BulkAction<TItem>[];
    onClear: () => void;
}

/**
 * La barra de acciones masivas: aparece al marcar filas y se queda pegada abajo,
 * donde llega el pulgar, sin tapar la tabla que se está mirando.
 *
 * No sabe qué hace ninguna acción. Pinta los botones que le llegan (`BulkAction`),
 * pide confirmación si la acción la declara, los bloquea mientras una corre, avisa
 * si falla y vacía la selección cuando sale bien. Por eso añadir una acción a una
 * tabla es escribir un objeto, no tocar esta pieza.
 */
export function BulkActionsBar<TItem>({ items, actions, onClear }: BulkActionsBarProps<TItem>) {
    const { t } = useTranslation();
    const [pending, setPending] = useState<BulkAction<TItem> | null>(null);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    if (items.length === 0) return null;

    const confirmOf = (action: BulkAction<TItem> | null): BulkActionConfirm | undefined =>
        typeof action?.confirm === 'function' ? action.confirm(items) : action?.confirm;
    const confirm = confirmOf(pending);

    const execute = async (action: BulkAction<TItem>) => {
        setRunning(true);
        setError(null);
        try {
            await action.run(items);
            setPending(null);
            if (!action.keepSelection) onClear();
        } catch {
            // La selección se conserva: quien ha marcado cuarenta filas no las
            // vuelve a marcar porque falle una petición.
            if (confirmOf(action)) setError(t('dataTable.selection.failed'));
            else toast.error(t('dataTable.selection.failed'));
        } finally {
            setRunning(false);
        }
    };

    const choose = (action: BulkAction<TItem>) => {
        if (action.confirm) {
            setError(null);
            setPending(action);
        } else {
            void execute(action);
        }
    };

    return (
        <>
            <div
                role="region"
                aria-label={t('dataTable.selection.bar')}
                className="gap-2 p-2 pl-4 shadow-lg animate-page-in bottom-4 sticky z-30 flex items-center rounded-xl border bg-popover text-popover-foreground"
            >
                <p aria-live="polite" className="text-sm font-medium mr-auto tabular-nums">
                    {t('dataTable.selection.count', { count: items.length })}
                </p>

                {actions.map((action) => {
                    const blocked = action.blockedReason?.(items);
                    return (
                        <Tooltip
                            key={action.id}
                            label={action.label}
                            description={blocked ?? action.description}
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="max-sm:h-11 max-sm:px-3"
                                disabled={blocked !== undefined || running}
                                onClick={() => {
                                    choose(action);
                                }}
                            >
                                <action.icon
                                    size={16}
                                    aria-hidden
                                    className={cn(ICON_TONE_TEXT[action.tone ?? 'primary'])}
                                />
                                <span className="max-sm:sr-only">{action.label}</span>
                            </Button>
                        </Tooltip>
                    );
                })}

                <Button
                    variant="ghost"
                    size="sm"
                    className="max-sm:h-11 max-sm:px-3"
                    aria-label={t('dataTable.selection.clear')}
                    title={t('dataTable.selection.clear')}
                    onClick={onClear}
                >
                    <X size={16} aria-hidden />
                </Button>
            </div>

            <ConfirmDialog
                open={pending !== null}
                onClose={() => {
                    if (!running) setPending(null);
                }}
                onConfirm={() => {
                    if (pending) void execute(pending);
                }}
                title={confirm?.title ?? ''}
                description={confirm?.description ?? ''}
                confirmLabel={confirm?.confirmLabel ?? ''}
                destructive={confirm?.destructive}
                isPending={running}
                error={error}
            />
        </>
    );
}
