import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import type { CustomTableView, CustomTableColumn } from '@navis/shared';
import { initialViewState, sanitizeState, type ViewState } from '@/lib/tables/view-state';

const preferences = z.object({
    version: z.literal(1),
    hidden: z.array(z.string()),
    widths: z.record(z.string(), z.number().finite()),
    cards: z.boolean(),
});
export function useTableViewState(
    scope: string,
    columns: CustomTableColumn[],
    views: CustomTableView[],
) {
    const [states, setStates] = useState<Record<string, ViewState>>({});
    const [active, setActive] = useState('grid');
    const state = sanitizeState(
        states[active] ?? initialViewState(views.find((view) => view.id === active)),
        columns,
    );
    useEffect(() => {
        let cancelled = false;
        void AsyncStorage.getItem(`${scope}:${active}`)
            .then((raw) => {
                if (!raw || cancelled) return;
                const value = preferences.safeParse(JSON.parse(raw) as unknown);
                if (value.success)
                    setStates((current) => ({
                        ...current,
                        [active]: {
                            ...(current[active] ??
                                initialViewState(views.find((view) => view.id === active))),
                            ...value.data,
                        },
                    }));
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [scope, active, views]);
    function update(patch: Partial<ViewState>) {
        const next = { ...state, ...(patch.query ? { scroll: 0, laneScroll: {} } : {}), ...patch };
        setStates((current) => ({ ...current, [active]: next }));
        if (patch.hidden || patch.widths || patch.cards !== undefined)
            void AsyncStorage.setItem(
                `${scope}:${active}`,
                JSON.stringify({
                    version: 1,
                    hidden: next.hidden,
                    widths: next.widths,
                    cards: next.cards,
                }),
            );
    }
    async function remove(id: string) {
        setStates((current) =>
            Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)),
        );
        if (active === id) setActive('grid');
        await AsyncStorage.removeItem(`${scope}:${id}`);
    }
    return { active, setActive, state, update, remove };
}
