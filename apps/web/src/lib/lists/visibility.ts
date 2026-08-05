import type { ListVisibility } from '@navis/shared';
import { EyeOff, Globe, KeyRound, type LucideIcon } from 'lucide-react';

/**
 * Los tres modos de visibilidad, con **icono y texto** (RFC 0010 D9, §8.2).
 *
 * Nunca solo color: el color es refuerzo y no el mensaje (Regla 3 §7). Y en su
 * propio fichero, no junto al componente que los pinta: un módulo con un
 * componente solo exporta componentes, o se rompe el recambio en caliente
 * (`react-refresh/only-export-components`, CLAUDE.md).
 */
export const VISIBILITY_ICON: Record<ListVisibility, LucideIcon> = {
  private: EyeOff,
  link: Globe,
  restricted: KeyRound,
};

export const VISIBILITY_LABEL_KEY: Record<ListVisibility, string> = {
  private: 'lists.visibilityPrivate',
  link: 'lists.visibilityLink',
  restricted: 'lists.visibilityLocked',
};

export const VISIBILITY_HINT_KEY: Record<ListVisibility, string> = {
  private: 'lists.visibilityPrivateHint',
  link: 'lists.visibilityLinkHint',
  restricted: 'lists.visibilityLockedHint',
};

/** El orden en que se leen al decidir: de menos a más abierto, y la puerta al final. */
export const VISIBILITY_ORDER: readonly ListVisibility[] = ['private', 'link', 'restricted'];
