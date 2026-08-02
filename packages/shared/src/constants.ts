/** Roles del sistema, ordenados de menor a mayor privilegio. */
export const ROLES = ['member', 'leader', 'pastor', 'admin'] as const;

export type Role = (typeof ROLES)[number];

/** Jerarquía usada por el guard de roles de la API. */
export const ROLE_HIERARCHY: Record<Role, number> = {
  member: 0,
  leader: 1,
  pastor: 2,
  admin: 3,
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Modos de tema soportados por web y móvil. */
export const THEME_MODES = ['light', 'dark', 'system'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

/** Idiomas soportados por la interfaz. El español es el idioma de referencia. */
export const LOCALES = ['es', 'en', 'fr', 'pt', 'de', 'it'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

/** Nombre de cada idioma en su propio idioma, para el selector. */
export const LOCALE_LABELS: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  pt: 'Português',
  de: 'Deutsch',
  it: 'Italiano',
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Convierte `es-ES`, `pt-BR`… al idioma soportado más cercano. */
export function normalizeLocale(value: string | undefined | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  const base = value.toLowerCase().split(/[-_]/)[0] ?? '';
  return isLocale(base) ? base : DEFAULT_LOCALE;
}
