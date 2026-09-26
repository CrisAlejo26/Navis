import type { JournalEntryListItem } from '@navis/shared';

import { EntryCard, type EntryCells } from '@/components/journal/entry-card';

/**
 * El listado como rejilla de fichas: la vista de serie del cuaderno (D9), donde
 * más se nota el color de cada tipo (D15).
 */
export function JournalCardGrid({
    items,
    cells,
}: {
    items: readonly JournalEntryListItem[];
    cells: (entry: JournalEntryListItem, index: number) => EntryCells;
}) {
    return (
        <ul className="gap-4 sm:grid-cols-2 xl:grid-cols-3 grid">
            {items.map((entry, index) => (
                <li
                    key={entry.id}
                    style={{ animationDelay: `${String(Math.min(index, 12) * 40)}ms` }}
                    className="p-4 animate-rise-in rounded-xl border bg-card transition-colors duration-200 hover:border-foreground/25"
                >
                    <EntryCard {...cells(entry, index)} />
                </li>
            ))}
        </ul>
    );
}
