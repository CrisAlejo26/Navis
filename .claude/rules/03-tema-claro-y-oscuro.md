# Regla 3 — Todo tiene que verse bien en claro y en oscuro

Las cuatro apps ofrecen tema **claro, oscuro y el del sistema**. Ningún estilo
está terminado si solo funciona en uno de los dos.

## 1. Dónde vive cada cosa

| Qué                                                  | Dónde                                    |
| ---------------------------------------------------- | ---------------------------------------- |
| La paleta y los tokens de Tailwind                   | `packages/theme/src/tokens.css`          |
| La variante para React Native                        | `packages/theme/src/tokens.native.css`   |
| La misma paleta en JS y en hexadecimal, y los radios | `packages/theme/src/tokens.ts`           |
| El store de tema, compartido por las cuatro apps     | `packages/theme/src/theme-store.ts`      |
| El adaptador de cada plataforma                      | `apps/<app>/src/lib/theme.ts`            |
| El selector de las tres opciones                     | `apps/<app>/src/components/theme-toggle` |

## 2. Usa los tokens semánticos

Cambian solos entre temas. Los que hay:

`background` · `foreground` · `card` · `popover` · `primary` · `secondary` ·
`muted` · `accent` · `destructive` · `success` · `warning` · `border` ·
`input` · `ring`

Casi todos tienen su pareja `-foreground`, y se usan **juntos**: `bg-card` con
`text-card-foreground`, `bg-primary` con `text-primary-foreground`. Poner un
fondo sin su texto es la forma más rápida de quedarse sin contraste en uno de
los dos temas. Para los redondeos, `rounded-sm|md|lg|xl`, que salen de
`--radius`.

**Prohibido** un color fijo: `bg-white`, `text-black` o un hexadecimal suelto
rompen en el otro tema. Si de verdad hace falta una excepción, `dark:` de
Tailwind, y que se note que es una excepción.

## 3. Cómo está montada la paleta

La paleta se define **una sola vez** en `tokens.css`, como `--light-*` y
`--dark-*`. Las variables que consumen los componentes (`--background`,
`--primary`…) son alias que apuntan a una u otra, y `@theme inline` las expone
como utilidades de Tailwind.

Añadir un color es tocar **cuatro sitios de `tokens.css`** —paleta clara,
paleta oscura, alias y `@theme inline`— y, si además hace falta fuera de las
clases, su equivalente en `tokens.ts` (`themeColors` en oklch y
`themeColorsHex` en hexadecimal). Los dos ficheros van a la par: si cambias uno
sin el otro, la interfaz y la barra de estado dejan de coincidir.

## 4. Cada plataforma lo activa a su manera

- **Web**: clase `dark` en `<html>`, para poder forzar un tema contra el del
  sistema. Un script en línea de `index.html` la aplica antes del primer
  pintado; sin él, parpadea en blanco al recargar en oscuro.
- **Móvil**: no hay clase raíz. NativeWind cambia con
  `Appearance.setColorScheme()`, que react-native-css traduce a
  `prefers-color-scheme`; por eso móvil importa `tokens.native.css`. El modo
  `system` se devuelve al sistema operativo con `'unspecified'`.
- **Escritorio**: es la web dentro de Tauri. El color de fondo de la ventana
  está en `tauri.conf.json` y hay que mantenerlo a la par de la paleta clara.

## 5. Lo que no acepta `className`

En React Native y en la configuración nativa hace falta un color de verdad, y
**no entienden `oklch`**. Para eso está `themeColorsHex`; nunca pongas un
hexadecimal a ojo:

- Iconos de `@expo/vector-icons` (prop `color`).
- `StatusBar`, `SystemUI.setBackgroundColorAsync`, y los `screenOptions` de
  `Stack` y `Tabs` (fondo del contenido, barra de pestañas, bordes).
- Colores de gráficos y de cualquier lienzo.

El atajo `themeColorHex[theme]` es solo el fondo, que es lo que más se usa.

## 6. Los hexadecimales que sí están copiados a mano

Hay ficheros que no pueden importar TypeScript y llevan el color escrito. Si
cambias la paleta, **se actualizan también**:

| Fichero                                  | Qué lleva                                           |
| ---------------------------------------- | --------------------------------------------------- |
| `apps/web/index.html`                    | `meta theme-color` y el script antiparpadeo         |
| `apps/web/vite.config.ts`                | `background_color` y `theme_color` del manifest PWA |
| `apps/desktop/src-tauri/tauri.conf.json` | fondo de la ventana                                 |
| `apps/mobile/app.config.ts`              | splash en claro y en oscuro                         |
| `docker/nginx/mantenimiento.html`        | la página de mantenimiento                          |

Y una distinción que se confunde: el **azul de marca `#2140cf`** es el del logo
(Regla 7); el azul de la interfaz es el token `primary`, que no es el mismo
valor y además cambia entre temas. No los intercambies.

## 7. Estado, y lo que se ve en los dos temas

- Tres modos: claro, oscuro y sistema. El store guarda **solo el modo** (clave
  `navis.theme`) y recalcula el resto al rehidratar, porque el tema del sistema
  puede haber cambiado con la app cerrada.
- El foco se ve: `focus-visible:ring-2 ring-ring`, como en `ui/input`. Un foco
  invisible en oscuro es un fallo de accesibilidad, no un detalle.
- **El color no informa solo**: error, éxito y aviso llevan además icono o
  texto. `destructive`, `success` y `warning` son refuerzo, no el mensaje.
- Los estados (hover, activo, deshabilitado, seleccionado) también se comprueban
  en los dos temas: `bg-muted` sobre `bg-card` se distingue en claro y puede no
  distinguirse en oscuro.

## 8. Trampas que ya han mordido

- **El script de `index.html` duplica la lógica del store** a propósito, para
  correr antes que el JavaScript de la app. Si cambias la clave de
  almacenamiento o los colores de fondo, cámbialo ahí también.
- **En móvil, `Appearance.setColorScheme()` dispara el mismo evento que un
  cambio real del sistema.** El adaptador lleva una marca del último modo
  aplicado; sin ella, forzar oscuro se registraba como «el sistema está en
  oscuro».
- **El tema se aplica desde `merge`, no desde `onRehydrateStorage`**: con
  almacenamiento síncrono esa callback corre dentro de `create()` y zustand se
  comía el error, perdiendo la preferencia en cada recarga. Hay un test de
  regresión.
- **En Jest el preset de NativeWind está desactivado**: los tests de móvil
  comprueban comportamiento, no estilos. Que un test pase no dice nada del
  contraste.

## 9. Verificación

- `rtk pnpm check` — incluye los tests del store de tema.
- Míralo en la aplicación **en los dos temas** con el selector: contraste,
  bordes, fondos, texto y estados.
- Prueba el modo `system` cambiando el tema del sistema **con la app abierta**:
  debe seguirlo al momento.
- Si has tocado móvil, míralo en el emulador: lo que se ve bien en la web no
  siempre se ve bien en React Native.

> Un estilo que solo se ve bien en claro no está terminado.
