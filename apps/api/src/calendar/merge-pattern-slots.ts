export interface SlotLike {
    id: string;
    name: string;
    position: number;
    believerId: string | null;
    note: string | null;
}

export interface SlotsPlan {
    /** Los que se quedan, ya con su posición nueva. */
    keep: { id: string; position: number }[];
    /** Fases del patrón que la reunión no tenía: se crean vacías. */
    create: { name: string; position: number }[];
    /** Fases que el patrón quitó y que nadie había rellenado. */
    dropIds: string[];
}

/**
 * Cómo queda una reunión ya materializada cuando su patrón cambia de fases.
 *
 * Lo asignado nunca se pierde: una fase quitada del patrón que alguien ya
 * rellenó se queda al final, y una que el usuario añadió a mano a esa reunión
 * (no estaba en el patrón anterior) tampoco se toca.
 */
export function mergeSlots(
    existing: readonly SlotLike[],
    before: readonly string[],
    after: readonly string[],
): SlotsPlan {
    const pool = [...existing].sort((a, b) => a.position - b.position);
    const ordered: ({ id: string } | { name: string })[] = [];

    for (const name of after) {
        const index = pool.findIndex((slot) => slot.name === name);
        const [found] = index >= 0 ? pool.splice(index, 1) : [];
        ordered.push(found ? { id: found.id } : { name });
    }

    const dropIds: string[] = [];
    for (const slot of pool) {
        const removedFromPattern = before.includes(slot.name) && !after.includes(slot.name);
        const isEmpty = slot.believerId === null && !slot.note;
        if (removedFromPattern && isEmpty) dropIds.push(slot.id);
        else ordered.push({ id: slot.id });
    }

    const plan: SlotsPlan = { keep: [], create: [], dropIds };
    ordered.forEach((entry, position) => {
        if ('id' in entry) plan.keep.push({ id: entry.id, position });
        else plan.create.push({ name: entry.name, position });
    });

    return plan;
}
