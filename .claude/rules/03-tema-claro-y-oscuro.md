# Regla 3 — Todo tiene que verse bien en claro y en oscuro

Las cuatro apps ofrecen tema **claro, oscuro y el del sistema**. Ningún estilo
está terminado si solo funciona en uno de los dos.

## Usa los tokens semánticos

Están en `packages/theme/src/tokens.css` y ya cambian solos entre temas:

`bg-background` · `text-foreground` · `bg-card` · `text-card-foreground` ·
`text-muted-foreground` · `border-border` · `bg-primary` ·
`text-primary-foreground` · `bg-destructive` · `bg-success` · `bg-warning` ·
`ring-ring`

**Prohibido** un color fijo sin su contrapartida: `bg-white`, `text-black` o un
hexadecimal suelto rompen en el otro tema. Si de verdad hace falta una
excepción, `dark:` de Tailwind.

## Cada plataforma lo activa a su manera

- **Web**: clase `dark` en `<html>`, para que se pueda forzar un tema contra el
  del sistema. Hay un script en línea en `index.html` que la aplica antes del
  primer pintado; sin él, parpadea en blanco al recargar en oscuro.
- **Móvil**: no hay clase raíz. NativeWind cambia con
  `Appearance.setColorScheme()`, que react-native-css traduce a
  `prefers-color-scheme`; por eso móvil importa `tokens.native.css` y no
  `tokens.css`.

## Lo que no acepta `className`

En React Native, los iconos de `@expo/vector-icons`, la barra de estado o el
fondo del sistema piden un color de verdad, y **no entienden `oklch`**. Para
eso está `themeColorsHex` en `packages/theme`, con la misma paleta en
hexadecimal. Nunca pongas un hexadecimal a ojo: sácalo de ahí.

## Verificación

Mira el cambio en los **dos** temas antes de darlo por hecho: contraste,
bordes, fondos y texto legibles en ambos. En web basta con el selector de tema
de la propia aplicación.

> Un estilo que solo se ve bien en claro no está terminado.
