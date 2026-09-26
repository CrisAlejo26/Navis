import type { ProphecyListItem } from '@navis/shared';

import { ProphecyCard, type ProphecyCells } from '@/components/prophecies/prophecy-card';

/**
 * El listado como rejilla de fichas: una columna en móvil, dos en tablet y tres
 * en escritorio (Regla 5 §3). Para leer varias palabras en paralelo, que es lo
 * que no deja hacer una tabla.
 */
export function PropheciesCardGrid({
    items,
    cells,
}: {
    items: readonly ProphecyListItem[];
    cells: (prophecy: ProphecyListItem, index: number) => ProphecyCells;
}) {
    return (
        <ul className="gap-4 sm:grid-cols-2 xl:grid-cols-3 grid">
            {items.map((prophecy, index) => (
                <li
                    key={prophecy.id}
                    // Entrada escalonada, y solo las doce primeras: más allá, la
                    // cascada solo hace esperar (§7.8).
                    style={{ animationDelay: `${String(Math.min(index, 12) * 40)}ms` }}
                    className="p-4 animate-rise-in rounded-xl border bg-card transition-colors duration-200 hover:border-foreground/25"
                >
                    <ProphecyCard {...cells(prophecy, index)} />
                </li>
            ))}
        </ul>
    );
}
