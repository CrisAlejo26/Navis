import type { LucideIcon } from 'lucide-react';

import type { IconActionTone } from '@/lib/icon-tones';

/**
 * Una acción sobre varias filas marcadas. **Es la forma de ampliar la tabla**:
 * una pantalla que necesita «Eliminar», «Archivar» o «Cambiar de estado» en
 * bloque escribe uno de estos y lo pasa en `bulkActions`; la tabla no se toca.
 *
 * Todo lo que la tabla hace con ella —pintar el botón, pedir confirmación,
 * bloquearlo mientras corre, avisar si falla, vaciar la selección al acabar—
 * sale de los campos de aquí. Lo único que escribe quien la define es `run`.
 *
 * ```ts
 * const archive = defineBulkAction<Note>({
 *     id: 'archive',
 *     label: t('notes.archive'),
 *     icon: Archive,
 *     tone: 'warning',
 *     run: async (notes) => { await Promise.all(notes.map(archiveNote)); },
 * });
 * ```
 */
export interface BulkActionConfirm {
    title: string;
    description: string;
    /** Nombra el resultado: «Eliminar 3 roles», no «Aceptar». */
    confirmLabel: string;
    destructive?: boolean;
}

/**
 * Una acción que necesita que se elija **algo** antes de correr —una sede, una
 * lista—: la tabla pregunta con un desplegable y `run` recibe lo elegido.
 */
export interface BulkActionChoice {
    title: string;
    description: string;
    /** Nombra el resultado, como en `BulkActionConfirm`. */
    confirmLabel: string;
    /** Rótulo del desplegable, para el lector de pantalla. */
    label: string;
    options: readonly { value: string; label: string }[];
    /** Si está, «ninguna» es una respuesta válida (quitar la sede) y este es su texto. */
    emptyLabel?: string;
}

export interface BulkAction<TItem> {
    /** Estable: es la clave del botón. */
    id: string;
    /** Ya traducida. En un teléfono el botón queda solo con icono y esto es su nombre accesible. */
    label: string;
    /** Una frase que explica qué hará: sale en el tooltip. */
    description?: string;
    icon: LucideIcon;
    /** El color del icono, con los mismos tokens que el resto de acciones. */
    tone?: IconActionTone;
    /**
     * Si está, se pide confirmación antes de ejecutar (lo destructivo, siempre).
     * Puede ser una función de las filas marcadas, para decir cuántas van.
     */
    confirm?: BulkActionConfirm | ((items: readonly TItem[]) => BulkActionConfirm);
    /** Pide elegir un valor antes de correr; llega a `run` como segundo argumento (`''` si se eligió «ninguna»). */
    choice?: BulkActionChoice;
    /**
     * Sobre qué filas puede correr. Si devuelve un texto, el botón se
     * deshabilita y ese texto es el porqué; sin él, es que sirve para todas.
     */
    blockedReason?: (items: readonly TItem[]) => string | undefined;
    /** Por defecto la selección se vacía al acabar bien; una acción que solo abre algo (exportar) la conserva. */
    keepSelection?: boolean;
    /** Lo que hace. Si lanza, la tabla avisa del error y conserva la selección. */
    run: (items: readonly TItem[], choice?: string) => Promise<void> | void;
}

/** No hace nada: existe para que TypeScript infiera `TItem` al declarar una acción suelta. */
export function defineBulkAction<TItem>(action: BulkAction<TItem>): BulkAction<TItem> {
    return action;
}
