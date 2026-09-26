import { TriangleAlert, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Lo que sustituye a las filas cuando no las hay: el error con su «Reintentar»
 * o el vacío de la pantalla. Nunca un hueco en blanco.
 */
export function TableNotice({
    isError,
    isEmpty,
    onRetry,
    emptyIcon,
    emptyTitle,
}: {
    isError: boolean;
    isEmpty: boolean;
    onRetry?: () => void;
    emptyIcon: LucideIcon;
    emptyTitle: string;
}) {
    const { t } = useTranslation();

    if (isError) {
        return (
            <div className="rounded-xl border bg-card">
                <EmptyState icon={TriangleAlert} title={t('errors.generic')}>
                    {onRetry && (
                        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
                            {t('common.retry')}
                        </Button>
                    )}
                </EmptyState>
            </div>
        );
    }
    return isEmpty ? (
        <div className="rounded-xl border bg-card">
            <EmptyState icon={emptyIcon} title={emptyTitle} />
        </div>
    ) : null;
}
