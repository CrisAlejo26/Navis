import { churchEmblem, CHURCH_ICONS } from '@navis/shared';
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

/** Adaptador visual: el cálculo vive en shared para web y móvil. */
export function churchIcon(id: string): { Icon: LucideIcon; tinte: number } {
    const { icon, tint } = churchEmblem(id);
    return { Icon: ICONOS[CHURCH_ICONS.indexOf(icon)], tinte: tint };
}
