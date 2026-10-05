import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { todayIn, type Task, type Habit, type TaskStatus } from '@navis/shared';
import { useListContext } from '@/hooks/use-lists';
import { useTaskMutation } from '@/hooks/use-tasks';
import { createTask, updateTask } from '@/data/repos/tasks-repo';
import { createHabit, updateHabit } from '@/data/repos/habits-repo';
import {
    activityDraft,
    draftInput,
    type ActivityDraft,
    type ItemKind,
} from '@/lib/tasks/editor-draft';

export function useActivityEditor(
    kind: ItemKind,
    previous?: Task | Habit,
    day?: string,
    status?: TaskStatus,
) {
    const scope = useListContext(),
        timezone = scope.church?.timezone ?? 'UTC';
    const [initial] = useState(() =>
        activityDraft(kind, day ?? todayIn(timezone), timezone, previous, status),
    );
    const [draft, setDraft] = useState(initial),
        [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState<{ id: string; kind: ItemKind; date: string } | null>(null);
    const saving = useRef(false);
    const mutation = useTaskMutation(async (context, parsed: ReturnType<typeof draftInput>) => {
        const recurring =
            parsed.kind === 'task'
                ? parsed.input.isRecurring
                : parsed.input.repeatFreq !== 'ninguna';
        // Editing a series applies the selected state only to the occurrence being viewed.
        const state = {
            date:
                recurring && previous && draft.date === previous.date
                    ? (day ?? draft.date)
                    : draft.date,
            status: draft.status,
        };
        if (parsed.kind === 'task') {
            if (previous) {
                await updateTask(context, previous.id, parsed.input, state);
                return previous.id;
            }
            return createTask(context, parsed.input, state);
        }
        if (previous) {
            await updateHabit(context, previous.id, parsed.input, state);
            return previous.id;
        }
        return createHabit(context, parsed.input, state);
    });
    useEffect(() => {
        if (saved) router.replace({ pathname: '/tasks/detail', params: saved });
    }, [saved]);
    function change(patch: Partial<ActivityDraft>) {
        setDraft((old) => ({ ...old, ...patch }));
        setError(null);
    }
    async function save() {
        if (saving.current) return;
        let parsed: ReturnType<typeof draftInput>;
        try {
            parsed = draftInput(draft, timezone, previous);
        } catch {
            setError('tasks.editor.invalidFields');
            return;
        }
        saving.current = true;
        try {
            const id = await mutation.mutateAsync(parsed);
            setSaved({
                id,
                kind: parsed.kind,
                date: previous && draft.date === previous.date ? (day ?? draft.date) : draft.date,
            });
        } catch {
            setError('tasks.saveFailed');
        } finally {
            saving.current = false;
        }
    }
    return {
        draft,
        change,
        save,
        error,
        timezone,
        busy: mutation.isPending,
        dirty: !saved && JSON.stringify(initial) !== JSON.stringify(draft),
    };
}
