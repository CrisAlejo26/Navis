import { hexShade } from '@/lib/color';
import { readableInk } from './readable-ink';

/** Conserva los pasteles y ajusta los acentos vivos para admitir texto blanco. */
export function listSurface(accent: string) {
    const channels =
        accent
            .slice(1)
            .match(/.{2}/g)
            ?.map((value) => Number.parseInt(value, 16)) ?? [];
    if (channels.length !== 3 || Math.min(...channels) > 170) {
        return { background: accent, ink: readableInk(accent) };
    }
    let background = accent;
    for (
        let factor = 0.95;
        readableInk(background) !== '#ffffff' && factor >= 0.3;
        factor -= 0.05
    ) {
        background = hexShade(accent, factor);
    }
    return { background, ink: '#ffffff' };
}
