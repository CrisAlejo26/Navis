import type { BelieverListItem } from '@navis/shared';

import { BelieverCard, type BelieverCells } from '@/components/believers/believer-card';

/** Se paran a las doce: más allá, la cascada solo hace esperar (§7.8). */
const ESCALON = 12;

/**
 * El listado como rejilla de fichas: una columna en el teléfono, dos en tablet
 * y tres a partir de `xl` (§7.4).
 *
 * Solo pinta las fichas: la barra, los filtros, el estado de carga y la
 * paginación son de `DataTable`, y por eso las dos vistas comparten todo lo demás.
 */
export function BelieversCards({
    items,
    cells,
}: {
    items: readonly BelieverListItem[];
    cells: (believer: BelieverListItem, index: number) => BelieverCells;
}) {
    return (
        <ul className="gap-4 sm:grid-cols-2 xl:grid-cols-3 grid">
            {items.map((believer, index) => (
                <li
                    key={believer.id}
                    // `both` en la animación ya sostiene el estado inicial durante el
                    // retardo, así que no hace falta esconderla a mano.
                    className="animate-page-in"
                    style={{ animationDelay: `${String(Math.min(index, ESCALON) * 40)}ms` }}
                >
                    <BelieverCard {...cells(believer, index)} />
                </li>
            ))}
        </ul>
    );
}
