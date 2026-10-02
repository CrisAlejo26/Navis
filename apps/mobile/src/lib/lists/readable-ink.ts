/** WCAG relative luminance chooses the stronger of black and white. */
export function readableInk(hex: string): string {
    const channels = hex
        .replace('#', '')
        .match(/.{2}/g)
        ?.slice(0, 3)
        .map((value) => {
            const channel = parseInt(value, 16) / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        }) ?? [0, 0, 0];
    const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    return luminance > 0.179 ? '#000000' : '#ffffff';
}
