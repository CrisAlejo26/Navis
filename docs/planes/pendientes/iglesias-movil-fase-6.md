# Iglesias móvil — Fase 6

Implementación y paridad actualizadas el 2026-10-01. Las limitaciones de la
verificación se distinguen al final; no equivalen a pruebas realizadas.

## Resultado

- RFC 0008 §8.3 describe la implementación local: esquema 11, membresías,
  selección persistida, creación, cambio de contexto, aislamiento y avisos.
- RFC 0024 Fases 3 y 4 requieren migrar **N iglesias**, sus membresías y sus
  datos, conservar la activa y migrar una sola vez los módulos personales.
  Esa conexión con servidor sigue fuera de este plan.
- `church-matrix.test.ts` recorre dos y tres iglesias sobre SQLite real:
  selección, cifras 1/2/3, creyentes, calendarios, sedes, dones, etiquetas,
  notas, exportación, vaciado, restauración y reparación de una activa ausente.

## Controles del repositorio

- `pnpm check`: correcto. Móvil **101 suites / 393 pruebas**, API **401**,
  web **337** y scripts **29**. Formato y tipos correctos; lint sin errores,
  con diez advertencias de variables/importaciones sin usar.
- `pnpm build`: correcto; API, web y paquetes compartidos compilados.
- Android nativo: `expo run:android --device navis_phase4_20261001 --no-bundler`,
  compilación e instalación correctas (`BUILD SUCCESSFUL`, 380 tareas).
- `expo-doctor`: 19/20 controles. Queda la recomendación de versiones de parche:
  Expo 57.0.25 → 57.0.26, Constants 57.0.19 → 57.0.20 y Router 57.0.23 → 57.0.24.
  No se actualizaron dependencias dentro de este plan.
- `.codegraph` no existe; se usaron búsquedas, lecturas y la auditoría SQL estática.

## Android: datos y recuperación

Emulador separado `navis_phase4_20261001`, Android API 36, 375 × 812 dp.
El emulador principal y sus datos no se modificaron.

- Dos iglesias en Expo Go: restauración por la interfaz, Inicio de Sur con
  **2**, lista `S-Luis`/`S-Persona 0`, ficha, nota y reproducción de audio;
  calendario, configuración y catálogo de Sur.
- Tres iglesias en la app nativa: Norte **1**, Sur **2**, Este **3**.
  Datos identificados con `N-`, `S-` y `E-`; datos personales `Personal QA`.
- Recorrido de diez pantallas por iglesia con dos y con tres iglesias:
  **50 árboles de accesibilidad**. Inicio, Creyentes, Calendario,
  configuración, balance, catálogo, datos de iglesia, profecías, sueños y
  enseñanzas. Los árboles de accesibilidad no mostraron marcas ajenas en
  pantallas acotadas; los listados personales conservaron el mismo registro.
- Ficha, nota y reproducción de audio de Este comprobadas en la app nativa;
  las notas de Norte y Sur también se abrieron desde sus avisos.
- Borrar un patrón desde la hoja de Sur redujo sus patrones de 56 a 55;
  Norte y Este conservaron 56. Crear `N-Don` en el catálogo de Sur funcionó:
  Sur pasó de ocho a nueve dones y las otras iglesias conservaron ocho.
- Buscar `N-Luis` desde Sur no devolvió filas; buscar `S-Luis` devolvió solo
  esa persona. Filtrar inactivos dejó la lista vacía; cambiar a Este retiró
  ese filtro y volvió a mostrar sus tres creyentes.
- Editar la ciudad de Sur desde el formulario guardó `S-Ciudad QA`; Norte y
  Este conservaron `Elda`. El formulario se ejercitó con teclado.
- Crear una cuarta iglesia desde la interfaz la dejó activa con cero
  creyentes, una membresía, una sede, siete dones, diez labores, cuatro
  calendarios y 28 patrones. El país inicial fue `US`, región del emulador.
  Después se restauró la copia de tres iglesias para retirar ese dato de QA.
- Cerrar sesión y entrar con la contraseña de la cuenta demo recuperó Sur.
  Cerrar el proceso y arrancar de nuevo también conservó Sur.
- Exportación mediante la interfaz y almacenamiento local de la hoja de
  compartir: **3 iglesias, 3 membresías, 6 creyentes, 3 notas y 3 audios**,
  además de una profecía, un sueño y una enseñanza.
- Vaciado de la base de QA confirmado con cero iglesias y cero creyentes;
  restauración del archivo exportado desde el selector de documentos.
  Recuperó Sur, los recuentos anteriores y los tres audios. Una segunda
  exportación mediante `buildBackup` verificó igualdad de sus bytes en base64.
- Una copia con Sur ausente y su id todavía guardado como activo resolvió
  automáticamente Norte; el selector ofreció solo Norte y Este. Restaurar
  la copia completa recuperó las tres iglesias y Sur como activa.

## Android: avisos nativos

- Se programaron notas de las tres iglesias mediante la sincronización real.
  Android mantuvo las tres solicitudes con su `churchId`, nota y creyente.
- Se entregaron los tres avisos en la bandeja, con nombres de iglesia.
  Canal `note-reminders-v1`: sonido predeterminado y vibración habilitados.
- Estando en Sur, tocar el aviso de Norte abrió `N-Luis` / `N-Nota` y
  persistió Norte como activa.
- Con el proceso cerrado (ausencia comprobada mediante `pidof`), tocar un
  único aviso de Sur arrancó Navis, activó Sur y abrió `S-Luis` / `S-Nota`.
  La prueba se repitió y se guardaron capturas de ambas aperturas.
- El primer arranque se quedó en la pantalla inicial. Reiniciar el emulador
  resolvió el arranque sin borrar datos. La carga diferida desde Metro
  retrasó otra apertura; se repitió con `EXPO_NO_METRO_LAZY=1`.
  No se introdujeron cambios de producción para esas incidencias del entorno.

## Interfaz y evidencias

- Selector nativo con tres iglesias en **es/en/fr/pt/de/it**, claro y oscuro:
  doce capturas y árboles de accesibilidad, sin desbordamiento observado.
  Los nombres largos en alemán también se comprobaron en Fase 4.
- Movimiento reducido activado mediante los ajustes de Android y arranque
  nuevo; Reanimated confirmó `_REANIMATED_IS_REDUCED_MOTION: true`.
  El recorrido de las pantallas se repitió con ese ajuste activado.
- Evidencias temporales: `navis-phase6-*.png`, `navis-phase6-*.xml` y
  `navis-phase6-*.txt` en `%TEMP%`. Las copias de QA quedan fuera de Git.

## Límites

- No se probó iOS ni un teléfono físico. Se comprobó entrega y configuración
  de sonido en Android; no se escuchó ni midió la salida sonora del emulador.
- Las regresiones SQLite y de hooks cubren escrituras cruzadas, borrados,
  búsquedas, filtros, carreras y navegación. El recorrido visual no reemplaza
  esas pruebas ni demuestra todas las combinaciones posibles de interacción.
