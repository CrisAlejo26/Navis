/** Roles de serie, ordenados de menor a mayor privilegio. No se borran. */
export const ROLES = ['member', 'leader', 'pastor', 'admin'] as const;

export type Role = (typeof ROLES)[number];

/**
 * Identificador de un rol tal y como viaja: puede ser uno de serie o uno
 * propio de la instalación, creado desde la administración de accesos. El
 * nivel de cada uno lo decide la tabla `roles`, no este fichero.
 */
export type RoleSlug = string;

/** Jerarquía de los roles de serie: es la semilla de la tabla `roles`. */
export const ROLE_HIERARCHY: Record<Role, number> = {
  member: 0,
  leader: 1,
  pastor: 2,
  admin: 3,
};

/**
 * Tope de los roles propios. Un rol creado a mano nunca llega a administrador:
 * si pudiera, cualquiera con permiso para crear roles podría fabricarse uno
 * que reparte accesos, y eso ya no sería una jerarquía sino un atajo.
 */
export const MAX_CUSTOM_ROLE_LEVEL = ROLE_HIERARCHY.admin - 1;

export function isSystemRole(slug: RoleSlug): slug is Role {
  return (ROLES as readonly string[]).includes(slug);
}

/** `Equipo de Alabanza` → `equipo-de-alabanza`. */
export function toRoleSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // los diacríticos que NFD ha separado
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Tamaños de página que ofrece la interfaz. El último no pasa de MAX_PAGE_SIZE. */
export const PAGE_SIZES = [10, 20, 25, 50, 100] as const;

export type PageSize = (typeof PAGE_SIZES)[number];

export function isPageSize(value: number): value is PageSize {
  return (PAGE_SIZES as readonly number[]).includes(value);
}

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
