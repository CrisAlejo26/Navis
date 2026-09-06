/**
 * La pareja tipográfica de Navis y la escala que usan los componentes de
 * texto (Fase 1 del plan `docs/sistema-componentes-movil-plan.md`).
 *
 * **Cambiar la fuente de toda la app es cambiar los valores de
 * `FONT_FAMILIES` — nada más.** Ningún componente escribe un nombre de
 * fuente a mano; todos leen de aquí.
 *
 * La pareja, elegida por su carácter (no genérica, Regla 9):
 * - **Libre Caslon Display** para títulos: un Caslon es la letra de los
 *   documentos náuticos y cuadernos de bitácora de los siglos XVIII-XIX
 *   (Almirantazgo británico, cartas de navegación), que es justo el
 *   vocabulario visual de Navis (`navis` = «nave» en latín).
 * - **Public Sans** para cuerpo: humanista y muy legible, con un origen
 *   cívico (USWDS) que la aleja del aire de plantilla de SaaS de las sans
 *   geométricas más vistas (Inter, Manrope…).
 *
 * Las dos declaran subset `latin` + `latin-ext` en Google Fonts: cubren los
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
  display: { native: 'LibreCaslonDisplay_400Regular' },
  sans: { native: 'PublicSans_400Regular' },
  sansMedium: { native: 'PublicSans_500Medium' },
  sansSemiBold: { native: 'PublicSans_600SemiBold' },
  sansBold: { native: 'PublicSans_700Bold' },
} as const;

export type FontToken = keyof typeof FONT_FAMILIES;

/**
 * Escala tipográfica: nombre de nivel → tamaño, alto de línea y familia.
 * La usan `Title`/`Subtitle`/`Text` (Fase 1); de momento sirve también para
 * verificar a ojo, en la Fase 0, que las cinco familias cargan bien.
 */
export const TYPE_SCALE = {
  display: { fontSize: 32, lineHeight: 38, font: 'display' as FontToken },
  h1: { fontSize: 26, lineHeight: 32, font: 'display' as FontToken },
  h2: { fontSize: 21, lineHeight: 27, font: 'sansSemiBold' as FontToken },
  h3: { fontSize: 17, lineHeight: 23, font: 'sansSemiBold' as FontToken },
  body: { fontSize: 15, lineHeight: 22, font: 'sans' as FontToken },
  bodyMedium: { fontSize: 15, lineHeight: 22, font: 'sansMedium' as FontToken },
  caption: { fontSize: 13, lineHeight: 18, font: 'sans' as FontToken },
} as const;

export type TypeLevel = keyof typeof TYPE_SCALE;
