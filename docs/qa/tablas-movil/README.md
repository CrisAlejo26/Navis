# Tablas móvil — implementación y verificación

Fecha: 2026-10-02. Plan: [tablas-movil-plan.md](../../planes/pendientes/tablas-movil-plan.md).

La sección sustituye el placeholder por tablas locales con cuadrícula, tablero y calendario. Incluye estructura dinámica, edición de filas, 12 tipos de campo, creyentes vinculados, consultas completas antes de paginar y cinco formatos de exportación. Los registros se guardan en SQLite del dispositivo; todavía no se sincronizan con la web.

## Revisión de paridad del 4 de octubre de 2026

Referencia fijada: los formularios, columnas y filtros actuales de `apps/web/src/components/tables`; se conservan los componentes nativos y los tokens existentes de móvil. Se compararon gestión de columnas/opciones, configuración de vistas, filtros y controles de tabla mediante lectura de código.

- El cambio de tipo conserva el campo vinculado de creyentes cuando sigue siendo compatible, como en la web. Se muestran las ayudas de edición manual y sobrescritura.
- Crear una vista conserva los filtros de la vista actual y avisa de cuántos se guardarán. El selector ofrece los tipos compatibles y selecciona inicialmente una columna válida.
- Los filtros de fecha incorporan Hoy, Esta semana y Este mes utilizando los mismos helpers compartidos que la web.

Validación de este cambio: typecheck correcto, ESLint de los seis componentes modificados sin errores, y 3 suites / 12 tests correctos (repositorios de tablas, tipos y estado independiente de vistas). No se realizó una nueva sesión visual en dispositivo; las capturas de abajo corresponden al QA previo. Esta revisión no certifica igualdad visual exacta ni sincronización de registros.

## Referencia visual y decisiones

### Actualización móvil del 4 de octubre

Esta sesión sustituye la cuadrícula horizontal por tarjetas, también para preferencias guardadas antiguas. La referencia solicitada es Tomtask: se revisaron sus componentes reales `task-card.tsx` e `item-detail-screen.tsx` en el proyecto local Taskia. Se conservan los tokens y componentes de Navis: `Card`, `BottomSheet`, `Button`, `Icon`, `Select`, `TextField`, `PasswordField`, `Checkbox` y `FieldError`.

- Tarjetas con título, descripción, estado y resumen; todas las columnas quedan accesibles en la previsualización.
- Abrir un registro presenta sus datos antes de editar o eliminar. Las acciones quedan fijas bajo el contenido desplazable.
- Sin botones X de vaciado al lado de los campos. Las confirmaciones de eliminación y descarte componen el panel y los botones existentes; no usan `Alert.alert`.
- La advertencia de exportar contraseñas se resuelve dentro del panel de exportación, incluyendo cancelar y cerrar mientras espera confirmación.
- Filtros, orden y columnas comparten una fila con scroll horizontal, sin salto de línea en 320 dp. Los filtros activos también tienen scroll horizontal.

Seed reproducible: `rtk proxy python scripts/seed-mobile-tables-qa.py --serial emulator-5556`. Solo permite el AVD independiente `navis_tables_qa`; requiere una instalación debug inicializada. Guarda una copia de SQLite, preserva registros existentes y añade dos tablas: 86 registros con 12 tipos y 2.000 registros con 30 columnas/50 opciones. Las contraseñas se crean mediante el editor cifrado de la app.

QA real de esta sesión en Android: creación de una fila con contraseña ficticia y revelado desde el detalle; edición decimal a 42,5; cambio de estado en Kanban y actualización de conteos; calendario y filtro Hoy; creación de una vista heredando ese filtro; apertura de la tabla grande; previsualización y tarjetas a 320 dp; cancelar y confirmar eliminación de un registro del seed; aviso de contraseña al exportar y cancelación; desplazamiento horizontal de los controles a 320 dp. No se enviaron archivos a destinatarios. Las pruebas de cinco formatos y temas de las secciones posteriores corresponden al QA anterior.

Verificación final de esta actualización: typecheck y ESLint de los componentes afectados correctos; 4 suites/16 tests de tablas y exportación; build de i18n y 5 tests de paridad correctos. No se validó iOS en esta sesión.

Capturas actuales: [tarjetas](qa-2026-10-04-cards.png), [detalle](qa-2026-10-04-preview.png), [detalle a 320 dp](qa-2026-10-04-preview-320.png), [confirmación compartida](qa-2026-10-04-confirmation.png), [tabla grande](qa-2026-10-04-stress-cards.png), [calendario](qa-2026-10-04-calendar.png). Las decisiones de cuadrícula descritas a continuación son históricas y quedan sustituidas por esta actualización.

Se usaron las pantallas reales de Listas y sus componentes como referencia dominante: `HeroScene`, cabecera, superficies por acento, Roboto, radios y sombras semánticas. Las capturas son de Android ejecutando la app con datos de QA; no son mockups.

| Decisión                        | Implementación y motivo                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Directorio coherente con Listas | Misma escena y cabecera, tarjetas por acento y acción principal inferior. Añade búsqueda y origen de filas.                                                  |
| Identidad de tabla              | Cabecera por acento, icono y nombre; indica explícitamente que los datos son locales.                                                                        |
| Cuadrícula                      | Un contenedor horizontal y filas virtualizadas con anchuras comunes. Sin columna fijada en este corte; evita duplicar listas y desalinear alturas variables. |
| Lectura alternativa             | Tarjetas dentro de la cuadrícula, con columnas visibles por vista.                                                                                           |
| Tablero                         | Carriles paginados, vecinos montados y acción accesible «Mover a…» en el detalle.                                                                            |
| Calendario                      | Mes con conteos completos y agenda desplazable del día; creación con fecha contextual.                                                                       |
| Fuente al 200 %                 | Cabecera y acciones inferiores compactas; filas que crecen con el texto.                                                                                     |
| Formulario                      | Componentes de Navis, selector de fecha y botón de limpiar por campo; contraseña fuera de resúmenes.                                                         |
| Selección y filtros             | Opciones buscables cuando hay muchas; filtros de fecha mediante el calendario existente.                                                                     |

## Capturas revisadas

| Referencia / estado                            | Evidencia                                                                    |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Listas, claro                                  | [Referencia](lists-reference-light.png)                                      |
| Tablas, claro                                  | [Directorio](tables-directory-light.png), [cuadrícula](grid-final-light.png) |
| Tablas, oscuro                                 | [Directorio](tables-directory-dark.png), [tablero](kanban-final-dark.png)    |
| Calendario y agenda, oscuro                    | [Mes](calendar-final-dark.png), [agenda](calendar-agenda-dark.png)           |
| 320 dp y fuente al 200 %                       | [Cuadrícula compacta](tables-font200.png)                                    |
| Teléfonos de 375 y 390 dp                      | [375 dp](grid-phone-375.png), [390 dp](grid-phone-390.png)                   |
| Tablet de 768 dp y 30 columnas                 | [Inicio](grid-tablet-768.png), [últimas columnas](grid-30-columns.png)       |
| Alemán y formulario dinámico                   | [Cuadrícula](grid-german.png), [formulario](row-form-german.png)             |
| Adaptación de cabecera y acciones compactas    | [Viewport reducido](grid-compact-viewport.png)                               |
| Recuperación nativa tras borrar la instalación | [Resultado](restore-native-qa.png)                                           |

La revisión corrigió cabeceras duplicadas, controles redundantes, espacio sobrante en tablas pequeñas, densidad del gestor de vistas y pérdida de espacio con fuente ampliada. El texto de las capturas combina la interfaz en inglés con nombres de fixtures en español.

## Datos, seguridad y comportamiento

- Migración SQLite 12 → 13 idempotente para las cuatro entidades, con índices por ámbito, ids únicos y relación activa única con creyentes.
- Membresía para lectura; propietario para escrituras, estructura, revelar y exportar. Se comprueba en los repositorios, además de los controles de UI.
- Cada `viewId`, incluida la cuadrícula sintética, conserva su búsqueda, filtros, orden, scroll, carril o mes. Las preferencias locales se separan por usuario, iglesia, tabla y vista; se sanitizan al cambiar el esquema.
- Edición parcial que preserva JSON histórico, columnas ocultas y valores incompatibles. Conversión a contraseña cifra valores anteriores, incluidos registros borrados.
- AES-GCM de Expo y claves versionadas en SecureStore. El puente Android requiere bytes al reconstruir `AESSealedData`; la corrección se probó en el runtime nativo y el mock reproduce esa restricción.
- Backup con secreto de recuperación de al menos 12 caracteres: envuelve claves de celdas y el secreto de autenticación local mediante PBKDF2-SHA256 y AES-GCM. No guarda esos secretos en texto plano. El secreto de autenticación acompaña a la transacción y se revierte si falla el commit.
- Backups antiguos sin tablas siguen admitidos. Una copia antigua que no transporta el secreto de autenticación mantiene la limitación anterior para entrar en otro dispositivo. Para nuevas copias portátiles se debe introducir el secreto de recuperación, incluso si no hay columnas de contraseña.
- Restauración en lotes parametrizados de menos de 999 parámetros, con rollback de SQLite. Se verificaron columnas opcionales de copias antiguas y fallos después de varios lotes.
- La restauración usa una interfaz SQLite exclusiva dentro de la cola: las consultas externas esperan al commit. Las transacciones compuestas anteriores conservan su contexto, evitando un bloqueo al ejecutar callbacks anidados.
- Exportación de todas las coincidencias, no solo las páginas cargadas. Tablero incluye todos los carriles; la navegación de calendario no añade un filtro de fechas implícito. La hoja explica ese alcance.
- Contraseñas excluidas por defecto; inclusión explícita con confirmación del número de valores. Los archivos temporales se limpian al cerrar compartir y ante fallos de generación.
- PNG limitado a 100 filas y a 1080 píxeles reales de ancho. La prueba nativa de 86 filas produjo una imagen de 1080 × 18924 píxeles, evitando multiplicar el bitmap por la densidad de pantalla.

## Validación realizada

Los tests cubren aislamiento entre iglesias y usuarios, ids ajenos, permisos, migración, límites de columnas/opciones, creación concurrente, consultas sobre filas fuera de la primera página, orden numérico, relaciones vivas, independencia entre dos tableros y dos calendarios, JSON histórico, cifrado, manipulación, backups antiguos y recuperación sin las claves locales originales.

La verificación de fechas ejecuta el helper real en un proceso Node con `TZ=Europe/Madrid`: medianoche, 29 de febrero de 2028 y ambos cambios de horario. El calendario SQL se prueba con un mes mayor que una página y agendas de varias páginas. Las horas locales usan las convenciones de `Date` del dispositivo; no se añadieron zonas horarias por columna.

QA nativo en el AVD independiente `navis_tables_qa`, Android 36, sin modificar los datos del emulador habitual: creación de tabla y fila, edición y reinicio, campos dinámicos, contraseña cifrada y revelada, desplazamiento entre carriles, mover una fila y actualización de totales, calendario con conteos completos, claro/oscuro y fuente ampliada. XLSX, PDF, Markdown, CSV y PNG llegaron al panel de compartir del sistema; no se enviaron a destinatarios.

La recuperación se comprobó con un backup de 2.087 filas, borrando los datos de la instalación de QA —incluido SecureStore— y restaurando mediante las funciones reales de Expo/SQLite. Se verificaron tanto el login de la cuenta recuperada como una contraseña de celda. El fixture contiene otra tabla con 2.000 filas, 30 columnas, 50 opciones y 500 fechas; se recorrió la cuadrícula hasta la columna 30 en Android.

Comprobaciones finales (todos los comandos prefijados con `rtk`):

| Comando                                                         | Resultado                                                  |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| `pnpm --filter @navis/mobile typecheck`                         | Correcto                                                   |
| `pnpm --filter @navis/mobile lint`                              | 0 errores; 10 warnings previos en otros módulos            |
| `pnpm --filter @navis/mobile exec jest --runInBand --forceExit` | 118 suites, 439 tests correctos                            |
| `pnpm --filter @navis/shared build` y tests                     | Build correcto; 21 suites, 147 tests correctos             |
| `pnpm --filter @navis/i18n build` y `test`                      | Build correcto; 5 tests correctos, paridad de seis idiomas |
| Prettier sobre los archivos modificados y `git diff --check`    | Correctos                                                  |

Jest conserva el aviso previo sobre el import dinámico de `expo-notifications` y requiere cerrar los handles del entorno de tests. Expo Doctor pasó 19/20 verificaciones; señala desfases de versiones patch preexistentes en Expo, Constants y Router. No se actualizaron dependencias para este módulo.

## Límites y verificaciones ampliadas

Se revisaron 320, 375, 390/412 y 768 dp, fuente ampliada y alemán en Android; queda completar las combinaciones de esas condiciones en todas las vistas. La app vigente está bloqueada en orientación vertical (`app.config.ts` y manifiesto Android); la captura de viewport reducido muestra la variante compacta y no constituye una prueba de rotación horizontal. No se cambió esa configuración global.

Quedan la revisión manual con TalkBack/VoiceOver y mediciones de memoria/latencia en Android de gama media. No hay simulador iOS disponible en este entorno Windows. La exportación consulta por lotes pero acumula las filas del archivo en memoria; no es un generador de archivos en streaming.

La dependencia de PBKDF2 en JavaScript requiere medir la duración de exportación y recuperación en un dispositivo físico. El emulador de desarrollo no representa ese rendimiento. No se añadieron dependencias nativas nuevas.

El plan permanece en `pendientes` mientras esas comprobaciones ampliadas no se hayan cerrado. La implementación funcional y las evidencias disponibles quedan registradas aquí.
