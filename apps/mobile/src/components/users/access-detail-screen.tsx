import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppBar } from '@/components/ui/app-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalListViewers } from '@/hooks/use-list-viewers';
import { useLists } from '@/hooks/use-lists';
import { AccessDetailBody } from './access-detail-body';
import { useUserPalette } from './user-theme';

/** Detalle primero: quién es el acceso, a qué llega y, si se puede, qué hacer con él. */
export function AccessDetailScreen({ id }: { id: string }) {
    const viewers = useLocalListViewers(),
        lists = useLists(),
        p = useUserPalette(),
        insets = useSafeAreaInsets(),
        { t } = useTranslation(),
        viewer = viewers.data?.find((one) => one.id === id);
    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <AppBar title={viewer?.label ?? t('roles.accessTab')} />
            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 22,
                    paddingTop: 8,
                    paddingBottom: insets.bottom + 24,
                    gap: 16,
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
            >
                {viewers.isPending ? (
                    <Skeleton className="h-[240px]" style={{ borderRadius: 26 }} />
                ) : !viewer ? (
                    <EmptyState
                        icon="alert-circle-outline"
                        title={t('roles.loadFailed')}
                        action={{ label: t('common.retry'), onPress: () => void viewers.refetch() }}
                    />
                ) : (
                    <AccessDetailBody viewer={viewer} lists={lists.data ?? []} />
                )}
            </ScrollView>
        </View>
    );
}
