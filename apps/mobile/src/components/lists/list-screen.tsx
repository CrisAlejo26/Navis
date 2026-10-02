import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { useListContext, useLists } from '@/hooks/use-lists';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { ListPanel } from './list-panel';
import { ListSettings } from './list-settings';
import { MembersSection } from './members-section';
import { StatsSection } from './stats-section';
import { ShareSection } from './share-section';
import { Button } from '@/components/ui/button';
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
    if (query.isPending) return <ActivityIndicator accessibilityLabel={t('common.loading')} />;
    if (query.isError)
        return (
            <EmptyState
                icon="alert-circle-outline"
                title={t('errors.generic')}
                action={{ label: t('common.retry'), onPress: () => void query.refetch() }}
            />
        );
    if (!list) return <EmptyState icon="list-outline" title={t('lists.notFound')} />;
    return (
        <View className="flex-1 bg-background">
            <View className="gap-3 p-4">
                <ListPanel
                    list={list}
                    onPress={() => {
                        if (canManage) setSettings(true);
                    }}
                />
                {canManage ? (
                    <Button
                        title={t('lists.edit')}
                        variant="ghost"
                        onPress={() => setSettings(true)}
                    />
                ) : null}
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
