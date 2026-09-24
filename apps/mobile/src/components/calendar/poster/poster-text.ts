/**
 * SVG no ajusta el texto solo —a diferencia del HTML de la web, que envuelve
 * una `span` dentro de su contenedor—, así que una lámina con columnas
 * estrechas (la tabla, la rejilla del mes) necesita partir o recortar el
 * texto a mano o el nombre largo de una persona invade la columna de al
 * lado. No hay medida real de fuente disponible aquí: se estima el ancho por
 * carácter, de sobra para no desbordar una columna.
 */
const AVG_CHAR_WIDTH = 0.52;
const AVG_CHAR_WIDTH_BOLD = 0.6;

interface PosterTextOptions {
    fontSize: number;
    bold?: boolean;
    /** Espaciado entre letras ya en píxeles (no en `em`), como en el resto de la lámina. */
    letterSpacing?: number;
}

function estimateWidth(text: string, options: PosterTextOptions): number {
    const perChar = (options.bold ? AVG_CHAR_WIDTH_BOLD : AVG_CHAR_WIDTH) * options.fontSize;
    return text.length * (perChar + (options.letterSpacing ?? 0));
}

/** Recorta con puntos suspensivos hasta que quepa en `maxWidth`. */
export function truncatePosterText(
    text: string,
    maxWidth: number,
    options: PosterTextOptions,
): string {
    if (estimateWidth(text, options) <= maxWidth) return text;

    let end = text.length;
    while (end > 0 && estimateWidth(`${text.slice(0, end)}…`, options) > maxWidth) {
        end -= 1;
    }
    return end > 0 ? `${text.slice(0, end).trimEnd()}…` : '…';
}

/**
 * Reparte `text` en líneas de como mucho `maxWidth`, palabra a palabra. Con
 * `maxLines`, lo que sobra de la última línea se recorta con puntos
 * suspensivos en vez de seguir creciendo hacia abajo.
 */
export function wrapPosterText(
    text: string,
    maxWidth: number,
    options: PosterTextOptions & { maxLines?: number },
): string[] {
    const words = text.split(' ').filter(Boolean);
    if (words.length === 0) return [];

    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (!current || estimateWidth(candidate, options) <= maxWidth) {
            current = candidate;
        } else {
            lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);

    const maxLines = options.maxLines ?? lines.length;
    if (lines.length <= maxLines) {
        return lines.map((line) => truncatePosterText(line, maxWidth, options));
    }

    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = truncatePosterText(
        `${kept[maxLines - 1] ?? ''} ${lines.slice(maxLines).join(' ')}`,
        maxWidth,
        options,
    );
    return kept;
}
