/**
 * El texto con formato del editor: una lista de tramos, cada uno con su
 * negrita y su cursiva (los dos únicos `marks` del whitelist, RFC 0022 §4.2).
 *
 * Todo aquí es lógica pura sobre índices UTF-16, los mismos que da la
 * selección de un `TextInput`. Se trabaja carácter a carácter y se vuelven a
 * unir los tramos vecinos iguales: es lo más corto que se puede razonar, y los
 * textos de una enseñanza son de unos cientos de caracteres.
 */
export interface Style {
    bold: boolean;
    italic: boolean;
}

export interface Run extends Style {
    text: string;
}

export type MarkName = keyof Style;

export const PLAIN: Style = { bold: false, italic: false };

interface Cell extends Style {
    char: string;
}

function toCells(runs: readonly Run[]): Cell[] {
    return runs.flatMap((run) =>
        run.text.split('').map((char) => ({ char, bold: run.bold, italic: run.italic })),
    );
}

function fromCells(cells: readonly Cell[]): Run[] {
    const runs: Run[] = [];
    for (const cell of cells) {
        const last = runs[runs.length - 1];
        if (last && last.bold === cell.bold && last.italic === cell.italic) {
            last.text += cell.char;
        } else {
            runs.push({ text: cell.char, bold: cell.bold, italic: cell.italic });
        }
    }
    return runs;
}

export function plainText(runs: readonly Run[]): string {
    return runs.map((run) => run.text).join('');
}

/** Sin tramos vacíos y con los vecinos iguales unidos. */
export function normalizeRuns(runs: readonly Run[]): Run[] {
    return fromCells(toCells(runs));
}

export function runsFromText(text: string): Run[] {
    return text ? [{ text, ...PLAIN }] : [];
}

/**
 * El estilo que sigue escribiendo quien tiene el cursor en `position`: el del
 * carácter anterior (lo que hace cualquier editor), o el del primero si está
 * al principio.
 */
export function styleAt(runs: readonly Run[], position: number): Style {
    const cells = toCells(runs);
    const cell = cells[position - 1] ?? cells[0];
    return cell ? { bold: cell.bold, italic: cell.italic } : PLAIN;
}

/**
 * Reconcilia lo que el `TextInput` dice que hay ahora con los tramos que se
 * tenían. Se busca el prefijo y el sufijo que no cambiaron: lo de en medio se
 * borró o se escribió, y lo escrito toma el estilo activo.
 */
export function applyTextChange(runs: readonly Run[], next: string, inserted: Style): Run[] {
    const before = toCells(runs);
    const old = before.map((cell) => cell.char).join('');
    const limit = Math.min(old.length, next.length);

    let prefix = 0;
    while (prefix < limit && old[prefix] === next[prefix]) prefix += 1;
    let suffix = 0;
    while (
        suffix < limit - prefix &&
        old[old.length - 1 - suffix] === next[next.length - 1 - suffix]
    ) {
        suffix += 1;
    }

    const typed = next
        .slice(prefix, next.length - suffix)
        .split('')
        .map((char) => ({ char, ...inserted }));
    return fromCells([...before.slice(0, prefix), ...typed, ...before.slice(old.length - suffix)]);
}

/** ¿Tiene `mark` todo lo seleccionado? Una selección vacía nunca lo tiene. */
export function rangeHasMark(
    runs: readonly Run[],
    start: number,
    end: number,
    mark: MarkName,
): boolean {
    const cells = toCells(runs).slice(start, end);
    return cells.length > 0 && cells.every((cell) => cell[mark]);
}

/** Pone `mark` en la selección, o se lo quita si ya lo tenía toda entera. */
export function toggleMark(
    runs: readonly Run[],
    start: number,
    end: number,
    mark: MarkName,
): Run[] {
    const value = !rangeHasMark(runs, start, end, mark);
    return fromCells(
        toCells(runs).map((cell, index) =>
            index >= start && index < end ? { ...cell, [mark]: value } : cell,
        ),
    );
}

/** Parte los tramos en `position`: lo de antes y lo de después. */
export function splitRuns(runs: readonly Run[], position: number): [Run[], Run[]] {
    const cells = toCells(runs);
    return [fromCells(cells.slice(0, position)), fromCells(cells.slice(position))];
}

export function joinRuns(first: readonly Run[], second: readonly Run[]): Run[] {
    return fromCells([...toCells(first), ...toCells(second)]);
}
