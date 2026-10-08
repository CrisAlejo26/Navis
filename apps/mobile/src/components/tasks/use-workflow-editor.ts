import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { createWorkflowSchema, type WorkflowWithCount } from '@navis/shared';
import { createWorkflow, deleteWorkflow, updateWorkflow } from '@/data/repos/workflows-repo';
import { useWorkflowMutation } from '@/hooks/use-workflows';

/** Estado del editor de un flujo: mismo recorrido que `useTagEditor`. */
export function useWorkflowEditor(previous?: WorkflowWithCount) {
    const { t } = useTranslation(),
        saving = useRef(false);
    const [initial] = useState(() => ({
        name: previous?.name ?? '',
        description: previous?.description ?? '',
        accent: previous?.accent ?? 'primary',
    }));
    const [draft, setDraft] = useState(initial),
        [error, setError] = useState(false),
        [saved, setSaved] = useState(false);
    const input = () =>
        createWorkflowSchema.safeParse({ ...draft, description: draft.description || null });
    const mutation = useWorkflowMutation(async (context, remove: boolean) => {
        if (remove && previous) return deleteWorkflow(context, previous.id);
        const data = createWorkflowSchema.parse({
            ...draft,
            description: draft.description || null,
        });
        if (previous) return updateWorkflow(context, previous.id, data);
        await createWorkflow(context, data);
    });
    useEffect(() => {
        if (saved) router.back();
    }, [saved]);
    async function save(remove = false) {
        if (saving.current) return;
        if (!remove && !input().success) return setError(true);
        saving.current = true;
        setError(false);
        try {
            await mutation.mutateAsync(remove);
            setSaved(true);
        } catch {
            setError(true);
        } finally {
            saving.current = false;
        }
    }
    function remove() {
        if (!previous) return;
        Alert.alert(
            t('tasks.workflowDeleteTitle', { name: previous.name }),
            t('tasks.workflowDeleteBody'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('tasks.delete'), style: 'destructive', onPress: () => void save(true) },
            ],
        );
    }
    return {
        draft,
        change: (patch: Partial<typeof draft>) => {
            setDraft((old) => ({ ...old, ...patch }));
            setError(false);
        },
        error,
        save,
        remove,
        busy: mutation.isPending,
        dirty: !saved && JSON.stringify(initial) !== JSON.stringify(draft),
    };
}
