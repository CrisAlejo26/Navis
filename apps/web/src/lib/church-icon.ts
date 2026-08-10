import {
  Anchor,
  Compass,
  Map,
  Navigation,
  Route,
  Sailboat,
  Ship,
  ShipWheel,
  Sunrise,
  Telescope,
  Waves,
  Wind,
  type LucideIcon,
} from 'lucide-react';

/**
 * Doce iconos náuticos para el selector de iglesia (Regla 9 §3): Navis es una
 * nave, y ese vocabulario sale gratis porque ya es verdad del proyecto.
 * Ninguno lleva cruz ni se lee como una de lejos (Regla 7 §6) — se ha mirado
 * `ShipWheel` en pantalla antes de darlo por bueno: son ocho radios, no dos
 * barras perpendiculares.
 */
const ICONOS: readonly LucideIcon[] = [
  Anchor,
  Compass,
  Sailboat,
  Ship,
  ShipWheel,
  Waves,
  Wind,
  Navigation,
  Map,
  Sunrise,
  Telescope,
  Route,
];

/** Cuántos tintes hay en `tokens.css` (`--church-1` … `--church-6`). */
const TINTES = 6;

/**
 * Icono y tinte de una iglesia, derivados de su id.
 *
 * Sin columna nueva ni migración: el id ya es estable para siempre, así que
 * el hash lo es igual, y las iglesias que ya existen lo estrenan sin tocar la
 * base de datos. Determinista a propósito —el mismo id siempre da el mismo
 * resultado— para que la insignia no cambie de un render a otro.
 */
export function churchIcon(id: string): { Icon: LucideIcon; tinte: number } {
  const hash = hashOf(id);
  return {
    Icon: ICONOS[hash % ICONOS.length],
    tinte: (hash % TINTES) + 1,
  };
}

/** Hash simple y estable: no hace falta criptográfico, solo repartir bien. */
function hashOf(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
