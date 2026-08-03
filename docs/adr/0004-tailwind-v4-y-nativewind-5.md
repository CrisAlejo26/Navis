# ADR 0004: Tailwind v4 en web y NativeWind 5 (preview) en móvil

- **Estado**: Aceptada (con riesgo asumido)
- **Fecha**: 2026-08-02

## Contexto

Web y móvil deben verse igual y compartir paleta, radios y modo oscuro. La
alternativa era Tailwind 4 en web y NativeWind 4 + Tailwind 3 en móvil, lo que
significaría dos motores de estilos y dos definiciones del tema.

## Decisión

**Tailwind 4.3 en las dos plataformas**, con **NativeWind 5.0.0-preview** en
móvil, y un único paquete de tokens (`packages/theme`).

- `tokens.css` define la paleta una sola vez, en `--light-*` y `--dark-*`; las
  variables que consumen los componentes son alias a una u otra.
- Web activa el modo oscuro con la clase `dark` en `<html>`, para que el usuario
  pueda forzar un tema contra el de su sistema.
- Móvil usa `tokens.native.css`, que reapunta esos alias dentro de
  `@media (prefers-color-scheme: dark)`: en React Native no hay clase raíz, y
  NativeWind cambia de tema con `Appearance.setColorScheme()`.
- `themeColorsHex` expone la misma paleta en hexadecimal para lo que no admite
  `oklch`: iconos de `@expo/vector-icons`, splash, barra de estado y el
  `theme_color` del manifest.

## Consecuencias

- Una clase escrita en web significa lo mismo en móvil.
- **Riesgo asumido**: NativeWind 5 está en preview y se publicó antes que Expo
  SDK 57. Verificado que empaqueta correctamente (`expo export` con las clases
  presentes en el bundle) y que `expo-doctor` pasa 20/20.
- `lightningcss` queda fijado en **1.30.1**: con 1.33 el compilador de
  react-native-css falla al deserializar y el empaquetado se rompe.
- En Jest, el preset de NativeWind se desactiva (`babel.config.js` mira
  `NODE_ENV`): sus componentes hacen `Object.entries()` sobre los originales de
  React Native, que el preset de tests sustituye por mocks. Los tests comprueban
  comportamiento y accesibilidad, no estilos.
- Si NativeWind 5 se atasca, el plan B es NativeWind 4 + Tailwind 3 **solo** en
  móvil, duplicando los tokens. La web se queda en Tailwind 4 en cualquier caso.
