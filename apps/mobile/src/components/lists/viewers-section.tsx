import type { List } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldError } from '@/components/ui/field-error';
import { useLocalListViewers } from '@/hooks/use-list-viewers';
import { useListMutation } from '@/hooks/use-lists';
import { setViewerLists } from '@/data/repos/list-viewers-writes';
import { ViewerForm } from './viewer-form';
import { ViewerDetail } from './viewer-detail';

export function ViewersSection({ list }: { list: List }) {
    const { t } = useTranslation();
    const query = useLocalListViewers();
    const [creating, setCreating] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const viewer = query.data?.find((one) => one.id === selected);
    const change = useListMutation((context, value: { id: string; ids: string[] }) =>
        setViewerLists(context, value.id, value.ids),
    );
    return (
        <View className="gap-3 rounded-2xl p-4 border border-border bg-card">
            <Text className="text-lg font-sans-semibold text-foreground">
                {t('lists.whoCanSee')}
            </Text>
            <Text className="text-sm text-muted-foreground">{t('lists.localAccessHint')}</Text>
            {query.isPending ? (
                <Text className="text-muted-foreground">{t('common.loading')}</Text>
            ) : null}
            {query.data?.length === 0 ? (
                <Text className="text-muted-foreground">{t('lists.noViewers')}</Text>
            ) : null}
            {query.data?.map((viewer) => (
                <View key={viewer.id} className="gap-2 p-3 rounded-xl border border-border">
                    <Checkbox
                        label={viewer.label}
                        description={`${viewer.username} · ${t('lists.reachesLists', { count: viewer.listIds.length })}`}
                        checked={viewer.listIds.includes(list.id)}
                        disabled={change.isPending || !viewer.isActive}
                        onChange={(checked) =>
                            change.mutate({
                                id: viewer.id,
                                ids: checked
                                    ? [...viewer.listIds, list.id]
                                    : viewer.listIds.filter((id) => id !== list.id),
                            })
                        }
                    />
                    <Button
                        title={t('lists.manageViewer', { name: viewer.label })}
                        variant="ghost"
                        onPress={() => setSelected(viewer.id)}
                    />
                </View>
            ))}
            {query.isError || change.isError ? <FieldError message={t('errors.generic')} /> : null}
            {query.isError ? (
                <Button
                    title={t('common.retry')}
                    variant="ghost"
                    onPress={() => void query.refetch()}
                />
            ) : null}
            <Button
                title={t('lists.newViewer')}
                leadingIcon="person-add-outline"
                variant="secondary"
                onPress={() => setCreating(true)}
            />
            {creating ? <ViewerForm listId={list.id} onClose={() => setCreating(false)} /> : null}
            {viewer ? <ViewerDetail viewer={viewer} onClose={() => setSelected(null)} /> : null}
        </View>
    );
}
