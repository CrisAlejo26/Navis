/**
 * Roles de serie, ordenados de menor a mayor privilegio. No se borran.
 *
 * Los cuatro del medio son ministerios, no escalones: recepción, biblias,
 * sonido y púlpito están al mismo nivel y se distinguen por sus permisos
 * (ver `role-permissions.ts`), no por su posición.
 *
 * **`predicador-apoyo`** se añadió después (RFC 0014), en ese mismo nivel:
 * gestiona calendario, creyentes, listas y comunicaciones como el pastor,
 * pero no administra usuarios ni `churches.manage` — así que nunca crea otra
 * iglesia ni entra en más de una: nace en la del pastor que lo da de alta y
 * se queda ahí. Al no tener nivel de pastor, es este quien puede darlo de
 * alta (RFC 0014 D2: nadie asigna un rol de su mismo nivel o superior).
 */
export const ROLES = [
  'creyente',
  'recepcion',
  'biblias',
  'sonido',
  'pulpito',
  'predicador-apoyo',
  'pastor',
  'superadmin',
] as const;

export type Role = (typeof ROLES)[number];

/** El rol de quien acaba de registrarse, y el que se supone si falta. */
export const DEFAULT_ROLE: Role = 'creyente';

/** Quien lo ve todo, en todas las iglesias. */
export const SUPERADMIN_ROLE: Role = 'superadmin';

/**
 * Identificador de un rol tal y como viaja: puede ser uno de serie o uno
 * propio de la instalación, creado desde la administración de accesos. El
 * nivel de cada uno lo decide la tabla `roles`, no este fichero.
 */
export type RoleSlug = string;

/**
 * Jerarquía de los roles de serie: es la semilla de la tabla `roles`.
 *
 * Ya no decide quién entra a dónde —eso son los permisos—, sino quién puede
 * administrar a quién y hasta dónde llega un rol propio de la instalación.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  creyente: 0,
  recepcion: 1,
  biblias: 1,
  sonido: 1,
  pulpito: 1,
  'predicador-apoyo': 1,
  pastor: 2,
  superadmin: 3,
};

/** Escalones distintos de la jerarquía (0…3), que es lo que dibuja la interfaz. */
export const ROLE_LEVELS = [...new Set(Object.values(ROLE_HIERARCHY))].sort((a, b) => a - b);

/**
 * Tope de los roles propios. Un rol creado a mano nunca llega a
 * superadministrador: si pudiera, cualquiera con permiso para crear roles
 * podría fabricarse uno que reparte accesos, y eso ya no sería una jerarquía
 * sino un atajo.
 */
export const MAX_CUSTOM_ROLE_LEVEL = ROLE_HIERARCHY.superadmin - 1;

export function isSystemRole(slug: RoleSlug): slug is Role {
  return (ROLES as readonly string[]).includes(slug);
}

/**
 * Si quien tiene el nivel `askerLevel` puede asignarle a alguien un rol de
 * nivel `targetLevel`: nunca el suyo propio ni uno por encima (RFC 0014 D2).
 * El superadministrador no pasa por aquí — es quien reparte los roles altos.
 */
export function canAssignRoleLevel(askerLevel: number, targetLevel: number): boolean {
  return targetLevel < askerLevel;
}

/** `Iglesia Central` → `iglesia-central`. Sin acentos, sin símbolos y sin espacios. */
export function toSlug(name: string, maxLength = 60): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // los diacríticos que NFD ha separado
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
}

/** El de un rol, más corto: cabe en la columna y se lee de un vistazo. */
export function toRoleSlug(name: string): string {
  return toSlug(name, 40);
}

/** Cinco por defecto: es la que menos scroll pide al abrir cualquier tabla. */
export const DEFAULT_PAGE_SIZE = 5;
export const MAX_PAGE_SIZE = 100;

/** Tamaños de página que ofrece la interfaz. El último no pasa de MAX_PAGE_SIZE. */
export const PAGE_SIZES = [5, 10, 20, 25, 50, 100] as const;

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
