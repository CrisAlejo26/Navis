# Rediseño de ajustes móvil

## Referencias y dirección

Referencia principal: `D:/Proyectos_personales/taskia/mobile/src/components/settings/settings-screen.tsx`, `ui/list-row.tsx` y `ui/segmented-toggle.tsx`. Se conservan su densidad, agrupación, iconos sobre recuadros tintados y selector segmentado. La identidad y paleta siguen siendo las de Navis. Guías complementarias: `refero-design/references/icons.md` y `motion.md`. Refero MCP no está disponible en esta sesión.

El efecto pedido de Recopila se interpreta como sombra cromática bajo el botón, sin afirmar haber inspeccionado esa aplicación.

## Plan

1. Fondo gris azulado del token muted en claro; fondo nativo en oscuro. Márgenes de 22 px, espacio entre grupos de 24 px, ancho máximo de 520 px y encabezado respetando el área segura. Un View interior aplica el espaciado: contentContainerClassName no lo aplicaba en el emulador.
2. Cuenta reúne identidad y acceso al perfil. Después: apariencia, preferencias, iglesia, datos; versión al pie y cierre de sesión al final, tras herramientas de desarrollo.
3. Tarjetas con radio de 26 px y sin borde exterior. Iconos de filas en contenedores de 38 px, radio 12 px y glifos de 20 px. Cuenta como tarjeta navegable única; nombre de iglesia solo en su selector.
4. Tema con iconos sol/luna/sistema y sombra azul en la opción seleccionada. Salida con tinte y sombra rojos; presión con desplazamiento de 1 px y sombra reducida. Sin animación continua.
5. Conservar navegación, persistencia de tema, hoja de idiomas y confirmación de salida. Verificar tipos, lint y pruebas de ajustes; comprobar visualmente claro/oscuro en dispositivo cuando haya una superficie disponible.

## Decisiones

| Decisión                                       | Fuente                              | Motivo                                |
| ---------------------------------------------- | ----------------------------------- | ------------------------------------- |
| Filas compactas y recuadros de icono           | Taskia ListRow                      | Dar coherencia y ritmo                |
| Fondo diferenciado y menos grupos aislados     | Petición del usuario + tokens Navis | Reducir la sensación de blanco vacío  |
| Sombras según el color de la acción            | Petición Recopila + Taskia SHADOWS  | Profundidad sin añadir colores ajenos |
| Roles accesibles y controles de al menos 44 px | Guías de craft                      | Mantener facilidad de uso             |

## Aceptación

- Todas las opciones previas siguen accesibles y las filas informativas no simulan botones.
- Los colores y sombras responden al tema; la sombra desaparece al deshabilitar el control.
- Textos largos pueden ocupar varias líneas; el pie no compite con las opciones.
- La validación automática no sustituye la revisión visual nativa.

## Validación realizada

- `pnpm --filter @navis/mobile typecheck`: correcto.
- Pruebas `settings-row`, `settings-groups`, `theme-toggle` y las nuevas `theme-pills`: 9 pruebas correctas en 4 suites. El nuevo selector se verifica al cambiar entre claro, oscuro y sistema, incluida la selección accesible única. Jest avisa de que el import dinámico de expo-notifications no puede cargarse en su entorno.
- Revisión posterior: ESLint sin errores (10 avisos previos fuera de los archivos modificados), Prettier y tipos correctos.
- Emulador Android: capturas en claro y oscuro, español e inglés; hoja de idioma y revisión del final de la pantalla. Márgenes, separación, radios y textos verificados.
- Corregido el cambio de tema en dos pasos: react-native-css recibe el tema en el mismo turno de JS que Zustand, antes del evento nativo de Appearance. Prueba de regresión: actualización CSS sin emisión de evento nativo. Grabación de claro → oscuro → sistema: las superficies muestreadas cambian en el mismo fotograma.
- expo-doctor: 19/20 comprobaciones; versiones patch previas desactualizadas de expo, expo-constants y expo-router.
- Pendiente comprobación con tamaños de letra ampliados.
