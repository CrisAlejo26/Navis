import { themeColorsHex } from '@navis/theme';
import { ACCENT_PALETTE, ROLES, roleColor } from '@navis/shared';

import { contrastRatio, hexBlend, hexShade, readableAccent, readableGradient } from '@/lib/color';

const MINIMUM = 4.5;

/** Todos los colores que acaban en una cabecera, una etiqueta o un anillo: roles, estados y la paleta. */
function colorsOf(theme: 'light' | 'dark'): Record<string, string> {
    const palette = themeColorsHex[theme];
    return {
        ...Object.fromEntries(ROLES.map((slug) => [slug, roleColor({ slug, level: 0 })])),
        ...Object.fromEntries(ACCENT_PALETTE.map((hex) => [`paleta ${hex}`, hex])),
        'acceso en vigor': palette.success,
        'acceso caducado': palette.warning,
        'acceso desactivado': palette.mutedForeground,
        primary: palette.primary,
    };
}

describe('contraste de los colores de usuarios, roles y accesos', () => {
    it('mide bien: blanco sobre negro es 21 y un color sobre sí mismo es 1', () => {
        expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
        expect(contrastRatio('#2140cf', '#2140cf')).toBeCloseTo(1, 5);
    });

    // El texto blanco de las cabeceras también lleva el subtítulo con transparencia: por eso
    // el degradado parte del color vivo y solo se oscurece lo justo, en vez de fijar un factor.
    it.each(['light', 'dark'] as const)(
        'el texto blanco de una cabecera llega a 4,5:1 en cualquier color (%s)',
        (theme) => {
            const failures: string[] = [];
            for (const [name, color] of Object.entries(colorsOf(theme))) {
                for (const end of readableGradient(color)) {
                    const ratio = contrastRatio(hexBlend(end, '#ffffff', 0.78), end);
                    if (ratio < MINIMUM) failures.push(`${name} ${end}: ${ratio.toFixed(2)}`);
                }
            }
            expect(failures).toEqual([]);
        },
    );

    it('un color que ya se lee conserva su viveza y uno que no se oscurece', () => {
        expect(readableGradient('#2140cf')[0]).toBe(hexShade('#2140cf', 0.85));
        expect(readableGradient('#f7ac4d')[0]).not.toBe(hexShade('#f7ac4d', 0.85));
    });

    it.each(['light', 'dark'] as const)(
        'la tinta de una etiqueta o de unas iniciales se lee sobre su tinte (%s)',
        (theme) => {
            const palette = themeColorsHex[theme];
            const failures: string[] = [];
            for (const [name, color] of Object.entries(colorsOf(theme))) {
                for (const alpha of [0.14, 0.16]) {
                    const ink = readableAccent(color, palette.card, palette.foreground, alpha);
                    const ratio = contrastRatio(ink, hexBlend(palette.card, color, alpha));
                    if (ratio < MINIMUM)
                        failures.push(`${name} ${String(alpha)}: ${ratio.toFixed(2)}`);
                }
            }
            expect(failures).toEqual([]);
        },
    );
});
