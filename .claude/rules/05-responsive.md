# Regla 5 — Que funcione en el móvil de quien lo usa

La aplicación se usa de pie, con una mano y en una pantalla pequeña tan a
menudo como sentado delante de un ordenador. Toda interfaz debe funcionar en
**móvil, tablet y escritorio**.

- **Primero el móvil.** Diseña para la pantalla estrecha y ensancha con los
  breakpoints de Tailwind (`sm:`, `md:`, `lg:`, `xl:`). En web ya hay dos
  patrones montados: barra lateral en escritorio y navegación inferior en
  móvil.
- **Layouts fluidos:** flex y grid, unidades relativas, `min/max-width`. Nada
  de anchos fijos en píxeles que provoquen desbordes horizontales.
- **Objetivos táctiles cómodos:** al menos 44 px de lado en lo que se toca, con
  espacio entre ellos. En móvil, la acción principal al alcance del pulgar.
- **Contenido que se adapta:** el texto largo, las listas y las tablas se
  reajustan sin romper la pantalla ni salirse.
- **Cuidado con el teclado en móvil:** los formularios van dentro de
  `KeyboardAvoidingView` y de un `ScrollView`, o el teclado tapa el botón de
  enviar.

## Verificación

Antes de darlo por hecho, míralo al menos en un ancho de móvil, uno de tablet y
uno de escritorio. En la app nativa, además, en un dispositivo o emulador real:
lo que se ve bien en la web no siempre se ve bien en React Native.

> Una pantalla que solo funciona bien en escritorio no está terminada.
