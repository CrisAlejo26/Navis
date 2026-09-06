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
