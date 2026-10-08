import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

/** Cinco fichas con la altura real de una `UserCard`, para que la lista no salte al cargar. */
export function UsersSkeleton() {
    return (
        <View testID="users-skeleton" style={{ gap: 12 }}>
            {[0, 1, 2, 3, 4].map((one) => (
                <Skeleton key={one} className="h-[96px]" style={{ borderRadius: 26 }} />
            ))}
        </View>
    );
}

/** Tres vacíos distintos: sin cuentas, filtros que no dejan pasar nada, y error al cargar. */
export function UsersEmpty({
    failed,
    filtered,
    onRetry,
    onClear,
}: {
    failed: boolean;
    filtered: boolean;
    onRetry: () => void;
    onClear: () => void;
}) {
    const { t } = useTranslation();
    if (failed)
        return (
            <EmptyState
                icon="alert-circle-outline"
                title={t('roles.loadFailed')}
                description={t('errors.generic')}
                action={{ label: t('common.retry'), onPress: onRetry }}
            />
        );
    if (filtered)
        return (
            <EmptyState
                icon="search-outline"
                title={t('roles.noUsers')}
                action={{ label: t('roles.clearFilters'), onPress: onClear }}
            />
        );
    return (
        <EmptyState
            icon="people-outline"
            title={t('roles.emptyTitle')}
            description={t('roles.emptyBody')}
        />
    );
}
