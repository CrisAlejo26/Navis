import { readableAccent } from '@/lib/color';
it('conserva los acentos legibles y protege las etiquetas en oscuro y sobre colores claros', () => {
    expect(readableAccent('#2140cf', '#151820', '#f4f5f7')).toBe('#f4f5f7');
    expect(readableAccent('#2140cf', '#ffffff', '#151820')).toBe('#2140cf');
    expect(readableAccent('#ffee00', '#ffffff', '#151820')).toBe('#151820');
});
