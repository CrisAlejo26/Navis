/** Reorder a draft without mutating the persisted/query-cache array. */
export function moveInTaskOrder<T>(items: readonly T[], from: number, to: number): T[] {
    if (from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items];
    const next = [...items],
        [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
}
/** Move the selected block one position, preserving its internal order. */
export function moveSelectedTasks<T extends { id: string }>(
    items: readonly T[],
    selected: readonly string[],
    direction: -1 | 1,
): T[] {
    const next = [...items],
        chosen = new Set(selected);
    const indexes =
        direction === -1 ? next.map((_, index) => index) : next.map((_, index) => index).reverse();
    for (const index of indexes) {
        const target = index + direction;
        if (
            target < 0 ||
            target >= next.length ||
            !chosen.has(next[index].id) ||
            chosen.has(next[target].id)
        )
            continue;
        [next[index], next[target]] = [next[target], next[index]];
    }
    return next;
}
