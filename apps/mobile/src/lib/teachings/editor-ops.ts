import { newBlock, type BlockKind, type EditorBlock } from '@/lib/teachings/editor-model';
import { applyTextChange, joinRuns, plainText, splitRuns, type Style } from '@/lib/teachings/runs';

/**
 * Lo que ocurre con la lista de bloques cuando alguien pulsa Enter, Retroceso
 * o un botón de la barra. Todas devuelven la lista nueva y adónde va el
 * cursor, para que el editor solo tenga que aplicarlo.
 */
export interface EditResult {
    blocks: EditorBlock[];
    /** El bloque que recibe el foco, y el sitio del cursor dentro de él. */
    focus: { id: string; caret: number };
}

function indexOf(blocks: readonly EditorBlock[], id: string): number {
    return blocks.findIndex((block) => block.id === id);
}

/** Pulsar la misma lista otra vez la deshace; cualquier otra cambia el tipo. */
export function setKind(
    blocks: readonly EditorBlock[],
    id: string,
    kind: Exclude<BlockKind, 'paragraph'>,
): EditorBlock[] {
    return blocks.map((block) =>
        block.id === id
            ? { ...block, kind: block.kind === kind ? 'paragraph' : kind, checked: false }
            : block,
    );
}

/**
 * Enter en `caret`. En un bloque de lista **vacío** sale de la lista (queda
 * un párrafo), como en cualquier editor; en los demás parte el texto y el
 * segundo trozo hereda el tipo — con la casilla sin marcar.
 */
export function splitBlock(
    blocks: readonly EditorBlock[],
    id: string,
    caret: number,
): EditResult | null {
    const at = indexOf(blocks, id);
    const block = blocks[at];
    if (!block) return null;

    if (block.kind !== 'paragraph' && plainText(block.runs) === '') {
        const next = blocks.map((one) =>
            one.id === id ? { ...one, kind: 'paragraph' as const } : one,
        );
        return { blocks: next, focus: { id, caret: 0 } };
    }

    const [before, after] = splitRuns(block.runs, caret);
    const created = newBlock(block.kind, after);
    const next = [
        ...blocks.slice(0, at),
        { ...block, runs: before },
        created,
        ...blocks.slice(at + 1),
    ];
    return { blocks: next, focus: { id: created.id, caret: 0 } };
}

/**
 * Retroceso con el cursor al principio. Un bloque de lista baja a párrafo; un
 * párrafo se funde con el de arriba (y deja el cursor en la costura).
 */
export function backspaceAtStart(blocks: readonly EditorBlock[], id: string): EditResult | null {
    const at = indexOf(blocks, id);
    const block = blocks[at];
    if (!block) return null;

    if (block.kind !== 'paragraph') {
        const next = blocks.map((one) =>
            one.id === id ? { ...one, kind: 'paragraph' as const } : one,
        );
        return { blocks: next, focus: { id, caret: 0 } };
    }

    const previous = blocks[at - 1];
    if (!previous) return null;
    const joined = { ...previous, runs: joinRuns(previous.runs, block.runs) };
    return {
        blocks: [...blocks.slice(0, at - 1), joined, ...blocks.slice(at + 1)],
        focus: { id: previous.id, caret: plainText(previous.runs).length },
    };
}

export function toggleChecked(blocks: readonly EditorBlock[], id: string): EditorBlock[] {
    return blocks.map((block) => (block.id === id ? { ...block, checked: !block.checked } : block));
}

/**
 * Lo que el `TextInput` de un bloque dice que hay ahora. Un salto de línea en
 * el texto es un Enter (o un pegado con varias líneas): se quita del texto y
 * se parte el bloque en ese punto, una vez por cada salto. Así el editor no
 * depende de cómo cada teclado reporta la tecla Enter.
 */
export function changeText(
    blocks: readonly EditorBlock[],
    id: string,
    text: string,
    inserted: Style,
): EditResult | null {
    const at = indexOf(blocks, id);
    const block = blocks[at];
    if (!block) return null;

    const lines = text.split('\n');
    const runs = applyTextChange(block.runs, lines.join(''), inserted);
    let result: EditResult = {
        blocks: blocks.map((one) => (one.id === id ? { ...one, runs } : one)),
        focus: { id, caret: lines.join('').length },
    };

    // Cada salto parte el bloque en curso: lo que queda a la derecha es el
    // bloque siguiente, así que la posición es la longitud de la línea.
    let currentId = id;
    for (const line of lines.slice(0, -1)) {
        const split = splitBlock(result.blocks, currentId, line.length);
        if (!split) break;
        result = split;
        currentId = split.focus.id;
    }
    return result;
}
