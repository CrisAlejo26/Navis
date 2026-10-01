import { describe, expect, it } from 'vitest';
import { themeColorsHex } from './tokens';

function luminance(hex: string): number {
    const channels = [1, 3, 5]
        .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
        .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
// Los glifos náuticos deben seguir distinguiéndose con todos los tintes y temas.
describe('contraste de los emblemas', () => {
    it.each(['light', 'dark'] as const)('%s supera 4.5:1', (theme) => {
        const palette = themeColorsHex[theme];
        for (const tint of [1, 2, 3, 4, 5, 6] as const) {
            const background = luminance(palette[`church${tint}`]);
            const foreground = luminance(palette[`church${tint}Foreground`]);
            expect(
                (Math.max(background, foreground) + 0.05) /
                    (Math.min(background, foreground) + 0.05),
            ).toBeGreaterThanOrEqual(4.5);
        }
    });
});
