import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { useListContext, useLists } from '@/hooks/use-lists';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { ListHeader } from './list-header';
import { ListSettings } from './list-settings';
import { MembersSection } from './members-section';
import { StatsSection } from './stats-section';
import { ShareSection } from './share-section';
import { AppBar } from '@/components/ui/app-bar';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { EmptyState } from '@/components/ui/empty-state';

export function ListScreen({ id }: { id: string }) {
    const { t } = useTranslation();
    const query = useLists();
    const list = query.data?.find((one) => one.id === id);
    const { canManage } = useListContext();
    const [tab, setTab] = useState<'people' | 'stats' | 'share'>('people');
    const [settings, setSettings] = useState(false);
    const bottom = usePageBottomPadding();
    if (query.isPending)
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('nav.lists')} />
                <ActivityIndicator accessibilityLabel={t('common.loading')} />
            </View>
        );
    if (query.isError)
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('nav.lists')} />
                <EmptyState
                    icon="alert-circle-outline"
                    title={t('errors.generic')}
                    action={{ label: t('common.retry'), onPress: () => void query.refetch() }}
                />
            </View>
        );
    if (!list)
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('nav.lists')} />
                <EmptyState icon="list-outline" title={t('lists.notFound')} />
            </View>
        );
    return (
        <View className="flex-1 bg-background">
            <ListHeader list={list} onEdit={canManage ? () => setSettings(true) : undefined} />
            <View className="p-4">
                <SegmentedControl
                    value={tab}
                    onChange={setTab}
                    options={[
                        { value: 'people', label: t('lists.tabPeople') },
                        { value: 'stats', label: t('lists.tabStats') },
                        { value: 'share', label: t('lists.tabShare') },
                    ]}
                />
            </View>
            {tab === 'people' ? (
                <MembersSection id={id} canManage={canManage} bottom={bottom} />
            ) : tab === 'stats' ? (
                <StatsSection id={id} bottom={bottom} />
            ) : (
                <ShareSection list={list} canShare={canManage} bottom={bottom} />
            )}
            {settings ? <ListSettings list={list} onClose={() => setSettings(false)} /> : null}
        </View>
    );
}
