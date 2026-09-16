/**
 * La animación de las pantallas a las que se llega con `push` desde las
 * pestañas (fichas, catálogos, las del menú «Más»): en Android,
 * `animation: 'default'` dejaba un fotograma en blanco al volver atrás —el
 * Fragment de destino tarda uno en recomponerse tras estar tapado— y con
 * `'slide_from_right'` explícito no pasa (CLAUDE.md, «flash blanco»). Mismo
 * ajuste que usa Dreamkeeper para sus pantallas de detalle.
 */
export const PUSHED_SCREEN_ANIMATION = 'slide_from_right' as const;
