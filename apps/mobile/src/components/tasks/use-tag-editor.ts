import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { createTagSchema, type Tag } from '@navis/shared';
import { createTaskTag, updateTaskTag, deleteTaskTag } from '@/data/repos/tags-repo';
import { useTaskTagMutation } from '@/hooks/use-tags';
export function useTagEditor(previous?: Tag) {
    const { t } = useTranslation(),
        saving = useRef(false);
    const [initial] = useState(() => ({
        name: previous?.name ?? '',
        icon: previous?.icon ?? 'star',
        accent: previous?.accent ?? 'primary',
    }));
    const [draft, setDraft] = useState(initial),
        [error, setError] = useState(false),
        [saved, setSaved] = useState(false);
    const mutation = useTaskTagMutation(async (context, remove: boolean) => {
        if (remove && previous) return deleteTaskTag(context, previous.id);
        const input = createTagSchema.parse(draft);
        if (previous) return updateTaskTag(context, previous.id, input);
        await createTaskTag(context, input);
    });
    useEffect(() => {
        if (saved) router.back();
    }, [saved]);
    async function save(remove = false) {
        if (saving.current) return;
        if (!remove && !createTagSchema.safeParse(draft).success) return setError(true);
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
        Alert.alert(t('tasks.tagDeleteTitle', { name: previous.name }), t('tasks.tagDeleteBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('tasks.delete'), style: 'destructive', onPress: () => void save(true) },
        ]);
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
