import { useRef, useState } from 'react';
import { Alert, type View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { moveInTaskOrder, type Task } from '@navis/shared';
import { useTaskOrder, useTaskTemplates } from '@/hooks/use-task-series';

/** Lista local reordenable: el servidor solo se entera al guardar. */
export function useTaskOrderScreen() {
    const { t } = useTranslation(),
        query = useTaskTemplates(false),
        mutation = useTaskOrder();
    const [edited, setEdited] = useState<Task[] | null>(null),
        [selected, setSelected] = useState<string[]>([]),
        [dragging, setDragging] = useState(false);
    const refs = useRef(new Map<string, View>()),
        bounds = useRef(new Map<string, number>());
    // Lo reordenado a mano manda; lo que llega de páginas nuevas se añade al final.
    const loaded = query.data?.pages.flatMap((page) => page.items) ?? [],
        items = edited
            ? [...edited, ...loaded.filter((task) => !edited.some((row) => row.id === task.id))]
            : loaded;
    const setItems = (update: (previous: Task[]) => Task[]) => setEdited(update(items));
    function start() {
        setDragging(true);
        bounds.current.clear();
        for (const [id, node] of refs.current)
            node.measureInWindow((_x, y, _width, height) => bounds.current.set(id, y + height / 2));
    }
    function drop(from: number, pageY: number) {
        const target = [...bounds.current].sort(
            (a, b) => Math.abs(a[1] - pageY) - Math.abs(b[1] - pageY),
        )[0]?.[0];
        if (target)
            setItems((previous) =>
                moveInTaskOrder(
                    previous,
                    from,
                    previous.findIndex((row) => row.id === target),
                ),
            );
        setDragging(false);
    }
    async function save() {
        try {
            await mutation.mutateAsync({ ids: items.map((task) => task.id) });
            router.replace({ pathname: '/tasks/list', params: { sort: 'manual' } });
        } catch {
            Alert.alert(t('tasks.saveFailed'), t('errors.generic'));
        }
    }
    const toggle = (id: string) =>
        setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    const registerRow = (id: string) => (node: View | null) => {
        if (node) refs.current.set(id, node);
        else refs.current.delete(id);
    };
    return {
        query,
        mutation,
        items,
        setItems,
        selected,
        toggle,
        dragging,
        setDragging,
        start,
        drop,
        save,
        registerRow,
    };
}
