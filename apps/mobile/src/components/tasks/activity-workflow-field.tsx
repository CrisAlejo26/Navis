import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useWorkflows } from '@/hooks/use-workflows';
import type { ActivityDraft } from '@/lib/tasks/editor-draft';

/** El flujo de una tarea (Fase 7b): uno o ninguno, con acceso a gestionarlos. */
export function ActivityWorkflowField({
    draft: d,
    change,
    busy,
}: {
    draft: ActivityDraft;
    change: (patch: Partial<ActivityDraft>) => void;
    busy: boolean;
}) {
    const { t } = useTranslation(),
        workflows = useWorkflows();
    return (
        <View className="gap-3">
            <Select
                label={t('tasks.workflow')}
                value={d.workflowId}
                placeholder={t('tasks.noWorkflow')}
                disabled={busy}
                options={[
                    { value: '', label: t('tasks.noWorkflow') },
                    ...(workflows.data ?? []).map((workflow) => ({
                        value: workflow.id,
                        label: workflow.name,
                    })),
                ]}
                onChange={(workflowId) => change({ workflowId })}
            />
            <Button
                title={t('tasks.manageWorkflows')}
                variant="link"
                leadingIcon="compass-outline"
                disabled={busy}
                onPress={() => router.push('/tasks/workflows')}
            />
        </View>
    );
}
