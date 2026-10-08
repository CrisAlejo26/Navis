import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkflows } from '@/hooks/use-workflows';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ActivityQueryState } from './activity-query-state';
import { TaskWorkflowRow } from './task-workflow-row';

/** Gestionar los flujos de trabajo (Fase 7b): lista, alta y edición, como las etiquetas. */
export function TaskWorkflowsScreen() {
    const workflows = useWorkflows(),
        { t } = useTranslation(),
        insets = useSafeAreaInsets();
    if (workflows.isPending || workflows.isError)
        return (
            <ActivityQueryState
                title={t('tasks.manageWorkflows')}
                layout="tag"
                pending={workflows.isPending}
                error={workflows.isError}
                onRetry={() => void workflows.refetch()}
            />
        );
    return (
        <View className="flex-1 bg-background">
            <AppBar title={t('tasks.manageWorkflows')} />
            <FlatList
                data={workflows.data}
                keyExtractor={(workflow) => workflow.id}
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
                            {t('tasks.workflowsTitle')}
                        </Text>
                        <Text className="font-sans text-sm text-muted-foreground">
                            {t('tasks.workflowsIntro')}
                        </Text>
                        <Button
                            title={t('tasks.addWorkflow')}
                            className="rounded-2xl"
                            leadingIcon="compass-outline"
                            onPress={() => router.push('/tasks/workflow-edit')}
                        />
                    </View>
                }
                ListEmptyComponent={
                    <EmptyState icon="compass-outline" title={t('tasks.noWorkflowsYet')} />
                }
                renderItem={({ item }) => <TaskWorkflowRow workflow={item} />}
            />
        </View>
    );
}
