/**
 * La pareja tipográfica de Navis y la escala que usan los componentes de
 * texto (Fase 1 del plan `docs/planes/implementados/sistema-componentes-movil-plan.md`).
 *
 * **Cambiar la fuente de toda la app es cambiar los valores de
 * `FONT_FAMILIES` — nada más.** Ningún componente escribe un nombre de
 * fuente a mano; todos leen de aquí.
 *
 * La pareja, elegida por su carácter (no genérica, Regla 9):
 * - **Poppins** en todo, la misma que usa Tomtask (`taskia/mobile`):
 * geométrica y redonda, con cada peso como archivo propio. Sustituyó a Roboto a
 * petición de Cristian, para que la app móvil se lea como Tomtask. La web
 * conserva Roboto: el cambio es solo de `apps/mobile`.
 *
 * Declarada con subset `latin` + `latin-ext` en Google Fonts: cubre los
 * acentos de los seis idiomas del proyecto (Regla 2), incluida la `ß`
 * alemana y las cedillas del francés y el portugués.
 *
 * `native` son los nombres exactos que registra `useFonts` en
 * `apps/mobile/app/_layout.tsx` — deben coincidir letra a letra con lo que
 * exporta cada paquete `@expo-google-fonts/*`. Si cambias esta pareja,
 * cambia también los `--font-*` de `tokens.native.css`: son el mismo dato
 * repetido en CSS porque una variable de Tailwind no puede importar un
 * valor de un módulo de TypeScript (el mismo motivo por el que
 * `themeColorsHex` y `tokens.css` se mantienen a mano en Regla 3).
 */
export const FONT_FAMILIES = {
    display: { native: 'Poppins_800ExtraBold' },
    sans: { native: 'Poppins_400Regular' },
    sansMedium: { native: 'Poppins_500Medium' },
    sansSemiBold: { native: 'Poppins_600SemiBold' },
    sansBold: { native: 'Poppins_700Bold' },
    sansExtraBold: { native: 'Poppins_800ExtraBold' },
    // Solo para el texto con formato del editor de enseñanzas: iOS no inclina
    // una familia personalizada que no trae cursiva, así que se cargan de verdad.
    sansItalic: { native: 'Poppins_400Regular_Italic' },
    sansBoldItalic: { native: 'Poppins_700Bold_Italic' },
} as const;

export type FontToken = keyof typeof FONT_FAMILIES;

/**
 * Escala tipográfica: nombre de nivel → tamaño, alto de línea y familia.
 * La usan `Title`/`Subtitle`/`Text` (Fase 1); de momento sirve también para
 * verificar a ojo, en la Fase 0, que las cinco familias cargan bien.
 */
export const TYPE_SCALE = {
    display: { fontSize: 32, lineHeight: 38, font: 'display' as FontToken },
    h1: { fontSize: 26, lineHeight: 32, font: 'sansBold' as FontToken },
    h2: { fontSize: 21, lineHeight: 27, font: 'sansBold' as FontToken },
    h3: { fontSize: 17, lineHeight: 23, font: 'sansSemiBold' as FontToken },
    body: { fontSize: 15, lineHeight: 22, font: 'sans' as FontToken },
    bodyMedium: { fontSize: 15, lineHeight: 22, font: 'sansMedium' as FontToken },
    caption: { fontSize: 13, lineHeight: 18, font: 'sans' as FontToken },
} as const;

export type TypeLevel = keyof typeof TYPE_SCALE;
