import { isSystemRole, type Role, type RoleSlug } from './constants';
import { ACCENT_PALETTE } from './schemas/congregations';

/**
 * Nombre y descripción de los roles **de serie**, como claves de traducción.
 *
 * Es un mapa explícito y no una plantilla del tipo `t(\`roles.${slug}\`)`
 * porque las claves construidas al vuelo se saltan el tipado de i18next y
 * dejan de avisar cuando falta una traducción (Regla 2). Los roles propios de
 * cada instalación no están aquí: guardan su nombre en la base de datos.
 *
 * Vive en `shared` porque web y móvil enseñan los mismos nombres; el texto
 * sigue en `packages/i18n`.
 */
export const ROLE_LABEL_KEY = {
    creyente: 'roles.creyente',
    recepcion: 'roles.recepcion',
    biblias: 'roles.biblias',
    sonido: 'roles.sonido',
    pulpito: 'roles.pulpito',
    'predicador-apoyo': 'roles.predicadorApoyo',
    pastor: 'roles.pastor',
    superadmin: 'roles.superadmin',
} as const satisfies Record<Role, string>;

export const ROLE_HINT_KEY = {
    creyente: 'roles.creyenteHint',
    recepcion: 'roles.recepcionHint',
    biblias: 'roles.bibliasHint',
    sonido: 'roles.sonidoHint',
    pulpito: 'roles.pulpitoHint',
    'predicador-apoyo': 'roles.predicadorApoyoHint',
    pastor: 'roles.pastorHint',
    superadmin: 'roles.superadminHint',
} as const satisfies Record<Role, string>;

/**
 * El color de un rol, por su nivel en la jerarquía.
 *
 * No es un campo nuevo en la base de datos: se deriva del `level` que ya
 * tiene cada rol, con la misma paleta ampliada que ya distingue sedes, dones
 * y tipos de anotación (`ACCENT_PALETTE`). Dos roles del mismo nivel
 * comparten color a propósito —los cuatro ministerios, por ejemplo—: el color
 * dice **el escalón**, no el rol exacto, que ya lo dice el nombre al lado
 * (Regla 9 §3: el color nunca informa solo).
 */
export function roleAccent(level: number): string {
    const index = ((level % ACCENT_PALETTE.length) + ACCENT_PALETTE.length) % ACCENT_PALETTE.length;
    return ACCENT_PALETTE[index];
}

/**
 * Un color propio por rol de serie, para que en un listado cada cuenta se
 * distinga de un vistazo (el nivel solo da cuatro escalones, casi todos azules).
 * Son entradas de `ACCENT_PALETTE`, así que valen donde vale cualquier acento.
 */
const SYSTEM_ROLE_COLOR = {
    creyente: ACCENT_PALETTE[4],
    recepcion: ACCENT_PALETTE[2],
    biblias: ACCENT_PALETTE[6],
    sonido: ACCENT_PALETTE[12],
    pulpito: ACCENT_PALETTE[7],
    'predicador-apoyo': ACCENT_PALETTE[10],
    pastor: ACCENT_PALETTE[0],
    superadmin: ACCENT_PALETTE[9],
} as const satisfies Record<Role, string>;

/** El color de un rol: el suyo si es de serie, y el de su nivel si lo creó la instalación. */
export function roleColor(role: { slug: RoleSlug; level: number }): string {
    return isSystemRole(role.slug) ? SYSTEM_ROLE_COLOR[role.slug] : roleAccent(role.level);
}
