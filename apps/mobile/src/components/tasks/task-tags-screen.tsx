import { TaskTagRow } from './task-tag-row';
import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskTags } from '@/hooks/use-tags';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ActivityQueryState } from './activity-query-state';
export function TaskTagsScreen() {
    const tags = useTaskTags(),
        { t } = useTranslation(),
        insets = useSafeAreaInsets();
    if (tags.isPending || tags.isError)
        return (
            <ActivityQueryState
                title={t('tasks.manageTags')}
                layout="tag"
                pending={tags.isPending}
                error={tags.isError}
                onRetry={() => void tags.refetch()}
            />
        );
    return (
        <View className="flex-1 bg-background">
            <AppBar title={t('tasks.manageTags')} />
            <FlatList
                data={tags.data}
                keyExtractor={(tag) => tag.id}
                contentContainerStyle={{
                    padding: 22,
                    paddingBottom: insets.bottom + 24,
                    gap: 13,
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
                ListHeaderComponent={
                    <View className="gap-3 mb-4">
                        <Text className="font-sans-bold text-[26px] text-foreground">
                            {t('tasks.tags')}
                        </Text>
                        <Text className="font-sans text-sm text-muted-foreground">
                            {t('tasks.editor.tagsHint')}
                        </Text>
                        <Button
                            title={t('tasks.addTag')}
                            className="rounded-2xl"
                            leadingIcon="pricetag-outline"
                            onPress={() => router.push('/tasks/tag-edit')}
                        />
                    </View>
                }
                ListEmptyComponent={
                    <EmptyState icon="pricetags-outline" title={t('tasks.mobile.noTags')} />
                }
                renderItem={({ item }) => <TaskTagRow tag={item} />}
            />
        </View>
    );
}
