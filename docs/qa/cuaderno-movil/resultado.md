# Cuaderno móvil: resultado de implementación

Fecha: 2026-10-08. Rediseño implementado en el árbol de trabajo, sin commit ni
fusión. El plan permanece en pendientes hasta completar su definición de cierre.

## Implementación

Portada con oleaje, métricas y gráfica mensual; listado virtualizado por mes;
tarjetas con swipe y selección; filtros con borrador y contador; editor completo
con Guardar sobre el teclado; detalle con acciones accesibles; calendario por
tipo. Tokens claros/oscuros, Poppins y seis traducciones completas.
Los componentes están divididos en piezas pequeñas.

Contrato de comportamiento compartido entre API y SQLite móvil: búsqueda sin
acentos y literal para comodines, ventanas inclusivas, orden y paginación,
extracto, estadísticas de doce meses, recordatorios ISO, reapertura al cambiar
fecha y borrado lógico de audios. Copia de seguridad con audio comprobada.

## Pruebas ejecutadas

- pnpm check: verde (API 451, móvil 644, web 350 tests; paquetes y scripts también).
- Contrato nuevo: API 18 y móvil 17 casos sobre SQLite real.
- E2E API del cuaderno: 16/16 verdes.
- E2E web completo: 144/144 verdes.
- Suite E2E API completa: 212 pasan, 37 fallan en cuatro ficheros. Aparecen
  columnas ausentes de Tareas (repeat_options y flujos) en la base usada por la
  suite. No se ha modificado ese esquema como parte del rediseño.
- expo-doctor: 19/20 comprobaciones. Recomienda parches de expo, constants,
  linking, notifications, router y sqlite. No se han cambiado dependencias
  nativas durante esta implementación.
- Integración UI/SQLite: crear, editar, buscar, atender y borrar.
- Notificaciones: reconciliación al atender/reabrir/cambiar/borrar y apertura
  en frío/caliente comprobadas con tests; entrega real del sistema pendiente.

## Android visto

Emulador dedicado navis_tables_qa, compilación nativa, 375 dp, texto 130 %.
Capturas en esta carpeta: español/claro y alemán/oscuro; teclado en búsqueda y
editor; portada, listado, detalle y recordatorio. Compartir imagen abre el
selector Android con miniatura. No se envió nada. Se corrigió la herencia local
del tema oscuro en componentes compartidos y el calendario de recordatorio
vacío (se pasa null, no cadena vacía).

El fallo inicial del cliente se recuperó limpiando Metro y redirigiendo el
puerto guardado 8082 a 8081 con adb reverse. No hay capturas fiables del antes.

## Cierre pendiente

No se da por completada toda la matriz del plan: faltan las combinaciones
cruzadas de temas/idiomas, carga/error/solo lectura en dispositivo, audio nativo
y entrega/toque de notificación del sistema. Los componentes tienen tests para
esos estados, pero no sustituyen esas comprobaciones visuales.

Maestro no instalado ni ejecutado; se dejó alternativa reproducible adb en
apps/mobile/e2e. Hace falta autorización de instalación para cumplir el requisito
específico de Maestro. Falta la confirmación visual del usuario que exige la
definición de terminado del plan.

## Corrección solicitada: reutilizar las ventanas existentes

Se retiraron Alert.alert y Modal de los componentes y acciones del cuaderno.
ConfirmationSheet se trasladó desde Tablas a ui; Tablas conserva una reexportación
compatible. Borrar una entrada, selección múltiple, audios y descartar borradores
usan esa misma confirmación. Cancelar conserva el borrador y la selección.

BottomSheet admite pantalla completa y pie fijo: editor y filtros reutilizan
esa ventana, su cabecera, animación reducida, scroll y comportamiento de teclado.
La selección de tarjeta utiliza Checkbox con variante compacta. Se siguen usando
TextField, DatePicker, TimePicker, Chip, AudioRecorder, CalendarGrid, StatCard,
ProgressRing, BarChart, SwipeableRow, Skeleton y EmptyState.

El permiso denegado del cuaderno compone BottomSheet y Button; el hook existente
admite un callback, conservando el comportamiento de sus otros llamadores.
Dos pruebas verifican permiso denegado y concedido. El diálogo de permisos y el
selector para compartir los proporciona Android.

Capturas finales de esta revisión: descartar-reutilizado-de.png y
flujo-de/editor-teclado.png. Guardar queda completo sobre el teclado con
375 dp, alemán y texto 130 %. Las capturas anteriores conservan la cronología
y no representan todas la versión final. Maestro y la matriz completa siguen
pendientes: esta corrección no los da por verificados.

El guion adb completo pasa en alemán/oscuro y español/claro: crear, recordatorio, editar, atender, compartir imagen y borrar. Los datos QA se retiraron desde la interfaz.
