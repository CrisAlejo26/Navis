/**
 * Un hex de seis dígitos con transparencia, para pastillas y filos tenues.
 *
 * En web, un tinte de icono es una clase (`bg-primary/12`) porque Tailwind
 * resuelve la mezcla con la variable CSS del token. React Native no tiene
 * variables CSS ni mezcla colores por clase: los props nativos (y el
 * `backgroundColor` calculado a partir de `themeColorsHex`) necesitan un color
 * de verdad, así que la transparencia se calcula aquí (Regla 3 §5).
 */
export function hexAlpha(hex: string, alpha: number): string {
    const value = hex.replace('#', '');
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    return `rgba(${String(r)}, ${String(g)}, ${String(b)}, ${String(alpha)})`;
}

/** Oscurece un hex de seis dígitos (`factor` < 1): el fondo hondo de un degradado de acento. */
export function hexShade(hex: string, factor: number): string {
    const channel = (start: number): string =>
        Math.round(Number.parseInt(hex.replace('#', '').slice(start, start + 2), 16) * factor)
            .toString(16)
            .padStart(2, '0');
    return `#${channel(0)}${channel(2)}${channel(4)}`;
}

/** Conserve el acento si se lee sobre su tinte; si no, use la tinta del tema. */
export function readableAccent(accent: string, surface: string, ink: string, alpha = 0.12): string {
    const rgb = (hex: string) =>
        [0, 2, 4].map((start) => parseInt(hex.slice(start + 1, start + 3), 16) / 255);
    const luminance = (channels: number[]) =>
        channels
            .map((channel) =>
                channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
            )
            .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const foreground = rgb(accent),
        background = rgb(surface);
    const a = luminance(foreground),
        b = luminance(
            background.map((channel, index) => channel * (1 - alpha) + foreground[index] * alpha),
        );
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5 ? accent : ink;
}
