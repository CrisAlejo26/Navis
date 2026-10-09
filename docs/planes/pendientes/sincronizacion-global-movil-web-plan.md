# Sincronización global entre móvil y web — plan por fases

- **Estado:** Fases 0 a 6 implementadas el 2026-10-09 (la 4 solo servidor, la 5 y la 6 solo cliente y reglas, inertes tras `SYNC_ENABLED`), sin transferir datos. La 7 es la siguiente. Ver §11.
- **Fecha:** 2026-10-09.
- **Alcance:** toda Navis: todas las iglesias accesibles, todos los módulos, datos personales, relaciones, configuraciones compartidas y archivos. No se limita a la iglesia activa ni a un módulo.
- **Aplicaciones:** `apps/api`, `apps/web`, `apps/mobile`, `packages/shared`, `packages/api-client`; revisar escritorio si utiliza las mismas escrituras de la API.
- **Petición:** poder trabajar meses en el teléfono, vincularlo después a una instalación web, combinar información sin pérdidas, trabajar sin internet y volver al modo local.
- **Antecedentes:** [RFC 0024](../../rfcs/0024-login-completo-movil.md), [ajustes móvil](ajustes-movil-plan.md), [usuarios móvil](usuarios-movil-plan.md).

## 1. Decisión principal y corrección del alcance anterior

La solución será una sincronización bidireccional continua con trabajo local en el móvil. El teléfono mantiene SQLite como base de trabajo; el servidor coordina los cambios compartidos y aplica permisos. La web y el móvil utilizan la misma API. El móvil nunca se conecta directamente a PostgreSQL ni al fichero SQLite del servidor.

La sincronización es **global por instalación y cuenta**, no por la iglesia seleccionada en pantalla. Si una cuenta tiene acceso a veinte iglesias, deben sincronizarse las veinte, además de sus datos personales y recursos compartidos autorizados. Cambiar de iglesia no reinicia la sincronización, no cambia el servidor y no borra la cola de otra iglesia. La cantidad de iglesias y registros determina la paginación y el almacenamiento necesarios, no el alcance funcional.

«Toda la app» no significa descargar datos de otras personas sin permiso. El alcance es el conjunto completo autorizado para esa cuenta: si tiene acceso a toda la instalación, se sincroniza ese conjunto completo. Las restricciones de acceso se aplican tanto en web como en móvil. Las credenciales, sesiones internas del servidor y cachés regenerables tienen un tratamiento específico; no son tablas de negocio que se copien indiscriminadamente.

El RFC 0024 excluía expresamente la sincronización continua y la API key manual. Esta propuesta cambia esa decisión por petición actual del usuario. Durante la implementación habrá que actualizar sus apartados de alcance y conexión, y las referencias al RFC 0007, para no mantener dos arquitecturas contradictorias. Sus fases locales y de desbloqueo siguen siendo aprovechables.

La web continuará necesitando conexión para trabajar con la API; añadir edición offline a la PWA sería una ampliación distinta. **Todos los cambios realizados desde la web sí participan en la sincronización con el móvil.**

## 2. Qué existe realmente en el repositorio

La revisión es del código presente, no una afirmación de que las funciones nuevas ya existan ni de que todos los tests estén pasando.

| Área              | Evidencia actual                                                                                          | Consecuencia para el plan                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Base del móvil    | `apps/mobile/src/data/db.ts`: Expo SQLite, migraciones versionadas, `SCHEMA_VERSION = 21`                 | Evolucionar las bases ya usadas durante meses; no recrearlas                               |
| Contrato local    | `packages/shared/src/local-schema.ts` y esquemas de listas, tablas, cuaderno y tareas                     | Reutilizar y ampliar los contratos compartidos                                             |
| Identificadores   | `apps/mobile/src/data/local-db.ts`: UUID mediante `randomUUID()`                                          | Es posible crear registros offline con identidad estable                                   |
| Servidor          | `apps/api/src/database/data-source.ts`: TypeORM, SQLite o PostgreSQL, migraciones explícitas              | Probar el protocolo con ambos motores soportados                                           |
| Paridad           | `apps/api/src/database/local-schema.parity.test.ts`: columnas, tipos lógicos y anulabilidad               | Es una base útil; no demuestra por sí sola equivalencia de todos los módulos y migraciones |
| Borrado           | `apps/api/src/common/entities/base.entity.ts`: `deleted_at`                                               | Aprovechar borrado lógico, añadiendo propagación e historial de sincronización             |
| Identidad remota  | `apps/api/src/auth/auth.ts`: Better Auth, sesiones revocables, plugin Expo                                | Integrar vinculación y dispositivos en la autenticación existente                          |
| Cliente API       | `packages/api-client/src/client.ts`: URL configurable y `getAuthHeaders`                                  | Reutilizar transporte; no duplicar cada cliente HTTP                                       |
| Cuenta local      | `apps/mobile/src/data/repos/account-repo.ts`: hash con secreto por dispositivo                            | No copiar hashes locales como contraseñas remotas                                          |
| Usuarios y roles  | `apps/mobile/src/data/users/gateway.ts`: actualmente adaptador SQLite                                     | Hay usuarios locales múltiples; mapear identidades, roles y autorías                       |
| Copias            | `apps/mobile/src/lib/backup/`: JSON versionado, fotos, audios y envoltura de claves de tablas             | Extender y verificar cobertura, portabilidad, consistencia y restauración conectada        |
| Restauración      | `restore-backup.ts` reemplaza las tablas locales e inserta filas de la copia                              | No usar esta operación directamente sobre una réplica conectada                            |
| Cifrado de tablas | `apps/mobile/src/lib/tables/crypto.ts`: claves en SecureStore por dispositivo                             | Resolver lectura web y portabilidad de claves antes de sincronizar estas celdas            |
| Ajustes           | `apps/mobile/app/(tabs)/settings.tsx` tiene el concentrador; no se encontró `app/settings/connection.tsx` | Implementar el flujo de conexión, no darlo por existente                                   |

## 3. Respuestas a los casos planteados

| Situación                                                | Comportamiento requerido                                                                                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Meses de trabajo local y servidor vacío                  | Subir el conjunto completo autorizado, con sus iglesias, relaciones, autores y archivos; conservar una copia local y una copia de seguridad previa       |
| Teléfono y web con información distinta                  | Comparar antes de aplicar; añadir nuevos registros, reconocer identidades ya vinculadas y revisar coincidencias dudosas                                  |
| Quiero añadir y omitir duplicados                        | Omitir automáticamente repeticiones de la misma operación o identidad; pedir revisión para personas u objetos diferentes que solo se parecen             |
| Quiero conservar la versión móvil o la web               | Elegir por conflicto o campo; cualquier sustitución masiva exige previsualización y copia previa                                                         |
| Dos personas crean notas sobre el mismo creyente         | Guardar ambas notas, con UUID, autor y fecha propios; no son duplicados por compartir creyente                                                           |
| Dos personas modifican la misma nota                     | Comparar con la versión común, combinar campos independientes y solicitar resolución si el mismo contenido se editó de formas incompatibles              |
| Dos teléfonos crean el mismo creyente con distintos UUID | Detectar posible coincidencia, conservar ambos hasta confirmar y fusionar relaciones con una equivalencia persistente                                    |
| Estoy sin internet                                       | Leer y guardar sobre SQLite; cambios y archivos pendientes quedan en una cola persistente                                                                |
| Regresa internet                                         | Reintentar y reconciliar automáticamente cuando la app pueda ejecutarse; también al abrirla o pulsar «Sincronizar ahora»                                 |
| Desconecto y quiero trabajar local                       | Preparar una copia independiente, con archivos disponibles y nuevas credenciales locales; desvincular sin borrar el servidor                             |
| Desconecto estando offline                               | Conservar lo que ya está en el dispositivo, avisar de su fecha y de los archivos ausentes; no prometer una descarga imposible                            |
| Vuelvo a conectar más adelante                           | Reconocer el origen y comparar lo que cambió a ambos lados; no repetir la importación como si fuera información nueva                                    |
| Hago una copia                                           | Guardar datos, archivos y claves necesarias de forma protegida; comprobar que se puede restaurar                                                         |
| Un usuario pierde permisos mientras está offline         | No se puede revocar a distancia un dispositivo aislado; al reconectar se revalidan permisos, se restringe la réplica y se apartan cambios no autorizados |

## 4. Reglas que todas las fases deben respetar

1. **No perder trabajo de forma silenciosa.** Un rechazo, conflicto, cierre de app o falta de espacio no elimina cambios pendientes.
2. **Cobertura global.** No hay filtros implícitos por iglesia activa. Las pruebas incluyen muchas iglesias, varias cuentas y datos personales.
3. **Confirmación real.** «Sincronizado» significa cambios confirmados y descargas aplicadas hasta un punto conocido; los archivos y conflictos se muestran aparte.
4. **Identidad estable.** Un UUID identifica un registro, no su nombre. Repetir una operación nunca debe crear otro registro.
5. **Permisos en el servidor.** Los roles locales, `owner_id`, `author_id` y `church_id` enviados por el cliente no constituyen autorización.
6. **Relojes no autoritativos.** La hora del teléfono sirve como dato de actividad; las revisiones del servidor controlan la concurrencia.
7. **Relaciones completas.** Importar una persona debe conservar notas, etiquetas, vínculos, fotografías y referencias desde otros módulos.
8. **Separación de destinos.** Una cola vinculada a una instalación/cuenta nunca se envía a otra por cambiar una URL o iniciar otra sesión.
9. **Copias e historial.** La sincronización propaga también errores y borrados; no sustituye a las copias de seguridad.
10. **App operativa entre fases.** Mientras un módulo no cumpla el contrato, no se permite su sincronización parcial con apariencia de completitud.

## 5. Inventario obligatorio de toda la app

La Fase 2 debe producir una matriz de cobertura a partir de **todas** las entidades registradas en la API, las tablas locales, los servicios, los archivos y las configuraciones. Cada recurso tendrá propietario, permiso de lectura/escritura, relaciones, estrategia de borrado, regla de conflicto, exportación, descarga y prueba de convergencia. Una entidad nueva deberá declarar su política o quedar bloqueada por CI.

| Familia               | Elementos que se deben inventariar y cubrir                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Iglesias              | Todas las iglesias accesibles, propietarios, miembros, sedes/congregaciones, datos geográficos y zonas horarias                                 |
| Usuarios              | Cuentas, perfiles, afiliaciones, roles, permisos, autores históricos y transferencias de propiedad                                              |
| Creyentes             | Fichas y campos, fotos, notas, audios, etiquetas, destacados, dones, labores/ministerios y relaciones                                           |
| Calendario            | Calendarios, patrones, fases, reuniones, participantes, asignaciones, excepciones y configuración                                               |
| Contenido personal    | Profecías y cumplimientos; sueños, emociones y audios; enseñanzas; cuaderno y audios; propietarios y referencias                                |
| Tareas y hábitos      | Tareas, hábitos, etiquetas, flujos, series, ocurrencias, recordatorios y registros de tiempo                                                    |
| Listas                | Listas, miembros, vistas, portada, configuración de exportación, publicación, accesos de lectura y concesiones                                  |
| Tablas personalizadas | Definiciones, columnas, filas, vistas, relaciones a creyentes, celdas cifradas y claves necesarias                                              |
| Comunicaciones        | Canales, miembros, mensajes, ediciones, borrados, reacciones y adjuntos; si falta el módulo móvil, añadirlo o su representación local funcional |
| Ajustes               | Configuración de iglesias y cuenta; distinguirla del idioma, tema y preferencias exclusivos de un aparato                                       |
| Archivos              | Fotos, audios, portadas, adjuntos y cualquier recurso descubierto durante el inventario                                                         |
| Datos técnicos        | Catálogos de sistema, índices, cachés, recordatorios del sistema operativo, sesiones y registros de auditoría                                   |

Tratamiento de recursos técnicos:

- Sesiones, contraseñas, códigos de recuperación y secretos del servidor: no se replican como datos normales. El dispositivo tiene sus propias credenciales.
- Accesos públicos a listas/tablas: sincronizar su administración autorizada; sus contraseñas y sesiones se emiten o regeneran en el servidor, con un flujo específico.
- Cachés de estadísticas, búsqueda, geografía o festivos: regenerar o descargar según el contrato; no tratarlos como modificaciones independientes del usuario.
- Notificaciones locales: recalcular después de aplicar cambios; no copiar identificadores de notificaciones de otro teléfono.
- Auditoría global: permanecer en servidor, con consulta según permisos. La actividad pendiente local sí debe conservarse hasta poder publicarla.
- Preferencias del aparato: permanecer locales salvo ajustes que el inventario declare expresamente como preferencias de cuenta.

Los límites de lote y descarga serán configurables. No se fija un número máximo artificial de iglesias ni se carga toda la información en memoria de una sola vez. Si el dispositivo no tiene espacio suficiente, el flujo debe informar y detenerse con seguridad; no recortar el alcance sin avisar.

## 6. Arquitectura y contrato propuestos

```text
Web ── operaciones de dominio ──┐
                              API ── base compartida + revisiones + registro de cambios
Móvil ── motor de sync ─────────┘
  │
SQLite: datos + cambios pendientes + versiones base + conflictos + archivos
  │
Todas las pantallas móviles leen y escriben mediante repositorios locales
```

Los cambios compartidos se publican desde todos los caminos de escritura: web, móvil, administración, importaciones y procesos automáticos. Revisar tareas programadas, cascadas, borrados y servicios que actualizan varias entidades. Una modificación que no entra en el registro de cambios produciría una web y un móvil distintos.

### 6.1. Metadatos locales

Nombres orientativos; concretar en Fases 2 y 4 sin contaminar las tablas de autenticación de Better Auth:

| Recurso             | Información mínima                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `sync_connection`   | Identidad estable de instalación, URL, cuenta remota, dispositivo, estado, versión del protocolo y generación del conjunto de permisos |
| `sync_outbox`       | `operation_id`, destino, entidad, ID, operación, revisión base, campos modificados, dependencias, estado, intentos y error             |
| `sync_entity_state` | Revisión confirmada y versión base por entidad para comparar y reconstruir cambios pendientes                                          |
| `sync_checkpoint`   | Cursor por flujo autorizado; avance durable de descargas y bootstrap                                                                   |
| `sync_conflicts`    | Base, propuesta local, estado remoto, motivo y decisión de resolución                                                                  |
| `sync_id_map`       | Equivalencias de identidades, usuarios, iglesias y catálogos entre origen local y servidor                                             |
| `sync_assets`       | ID lógico, hash, tamaño, tipo, ruta local, referencia remota y avance de transferencia                                                 |
| `sync_jobs`         | Importaciones, descargas, desconexiones y restauraciones reanudables                                                                   |

Separar el contenido confirmado de las ediciones pendientes, mediante una base persistida y una proyección local. Una descarga no puede sobrescribir la versión editada que el usuario aún no ha enviado. Después de recibir cambios se reconstruye o reajusta la proyección y se detectan conflictos.

### 6.2. Metadatos del servidor

- Dispositivos/vinculaciones: cuenta, alcance, nombre, estado, expiración y revocación.
- Revisiones de entidad: incrementar mediante comparación atómica; comprobar `base_revision` dentro de la transacción.
- Registro de cambios duradero: altas, modificaciones, borrados y cambios de visibilidad, con contexto de permisos.
- Recibos idempotentes: operación, destino y huella de petición, resultado y revisión aplicada.
- Trabajos de bootstrap/importación: manifiesto, mapeos aprobados, comprobaciones, conflictos y progreso.
- Generación de instalación/restauración: reconocer un servidor restaurado o recreado aunque conserve URL y algunos UUID.

La modificación del dominio, su revisión, el recibo y el cambio publicado deben confirmarse en la misma transacción. Las operaciones de archivo necesitan estados propios porque el almacenamiento de objetos no comparte esa transacción.

**Atención al cursor:** un autoincremento o timestamp no basta si las transacciones confirman fuera de orden. Diseñar una publicación que no pueda saltarse una transacción pendiente: por ejemplo, un publicador serializado lee eventos ya confirmados y asigna posiciones de entrega. Un bootstrap combina un snapshot consistente con una frontera de cambios verificada. Las pruebas deben cubrir esta carrera en PostgreSQL y SQLite.

El cursor se vincula a cuenta y generación de permisos. Una nueva afiliación dispara bootstrap de los nuevos recursos aunque sus datos sean antiguos. Una revocación genera instrucciones de retirada de la réplica y sus archivos, sin revelar datos de otras iglesias. No basta con filtrar los siguientes cambios por permisos: quedarían datos antiguos accesibles.

### 6.3. API orientativa

Las rutas se confirmarán al implementar; no se presentan como existentes.

| Método y ruta                                        | Función                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `GET /api/v1/sync/capabilities`                      | Identidad de instalación, protocolo, módulos, límites y compatibilidad |
| `POST /api/v1/device-links`                          | Usuario autenticado genera token de vinculación temporal               |
| `POST /api/v1/device-links/exchange`                 | Canjear token una vez y vincular credencial individual                 |
| `GET /api/v1/devices` / `DELETE /api/v1/devices/:id` | Consultar y revocar dispositivos propios; administración según permiso |
| `POST /api/v1/sync/bootstrap`                        | Crear descarga inicial consistente de todo el conjunto autorizado      |
| `GET /api/v1/sync/bootstrap/:id`                     | Consultar progreso y páginas/manifiestos                               |
| `GET /api/v1/sync/changes?cursor=...`                | Descarga incremental autorizada, paginada                              |
| `POST /api/v1/sync/operations`                       | Enviar operaciones idempotentes con revisión base y dependencias       |
| `POST /api/v1/sync/imports/preview`                  | Preparar comparación sin modificar datos de negocio                    |
| `POST /api/v1/sync/imports/:id/commit`               | Aplicar decisiones aprobadas revalidando permisos y revisiones         |
| `GET /api/v1/sync/jobs/:id`                          | Recuperar estado después de perder conexión                            |
| `POST /api/v1/sync/assets/...`                       | Preparar, transferir y verificar archivos con autorización             |

No exponer una API genérica que acepte SQL, cualquier tabla o columnas arbitrarias. Cada adaptador usa validaciones y reglas de dominio compartidas con los servicios normales. La lista de entidades admitidas es explícita.

## 7. Fases de implementación

### Fase 0 — Acordar invariantes y mapa global

**Objetivo:** que las fases posteriores desarrollen la arquitectura solicitada y no la antigua migración puntual.

- Registrar la ampliación de alcance en el RFC 0024 y los documentos relacionados.
- Inventariar los módulos web que todavía no tienen almacenamiento o función equivalente móvil.
- Definir estados: local, preparando vínculo, conectado, sin internet, pausado, necesita autenticación, con conflictos y preparando desconexión.
- Determinar la separación por instalación/cuenta y la política de datos privados.
- Adoptar las reglas de conservación, duplicados y borrados de este documento.
- Preparar escenarios de aceptación con varias iglesias, usuarios y meses de datos locales.

**Salida:** decisiones trazables y lista completa de recursos. **Aceptación:** ninguna fase posterior se limita implícitamente a la iglesia activa.

### Fase 1 — URL y token de vinculación desde la web

**Objetivo:** empezar por la conexión que pide el usuario, sin habilitar todavía una subida de datos incompleta.

En la web, Ajustes → Dispositivos/Conexión móvil:

- Mostrar URL canónica de API y nombre de instalación.
- Generar token temporal de un solo uso, con opción de QR, ligado a una cuenta autenticada y un dispositivo nuevo.
- Propuesta inicial: validez de 10 minutos; configurable y comprobada por el servidor.
- Mostrar cuenta y alcance que tendrá el vínculo. Por defecto, todo el conjunto autorizado, no solo la iglesia activa.
- Listar dispositivos, última actividad y revocación; no volver a mostrar secretos persistentes.

En móvil, Ajustes → Conexión:

- Introducir URL y token, o leer QR; normalizar base de API y comprobar compatibilidad antes de usar credenciales.
- Exigir HTTPS en producción; HTTP únicamente para desarrollo o una política local explícita.
- Mostrar destino/cuenta para evitar vincular por error otra instalación.
- Canjear token por sesión o credencial individual revocable, integrada con Better Auth y los guards actuales.
- Guardar secretos en SecureStore. Una credencial Bearer requiere implementación explícita en el servidor: el guard actual resuelve sesiones, no acepta automáticamente cualquier token.
- Aplicar expiración, límites de intentos, redacción de logs y revocación. No incluir token en URLs o parámetros de consulta.
- No enviar credenciales a hosts distintos a través de redirecciones. Cambiar de URL requiere comprobar identidad del servidor.

El token es de **vinculación**, no una API key permanente compartida por todos. La cuenta aporta los permisos y el dispositivo los puede reducir, nunca ampliar. El inicio de sesión habitual sigue disponible para renovación o nueva autenticación.

**Salida:** vínculo autenticado y pantalla de estado «Vinculado; datos aún sin sincronizar». **Aceptación:** el token no se reutiliza, revocar bloquea el dispositivo y no se altera ninguna fila de negocio.

### Fase 2 — Paridad completa de modelos y migraciones

**Objetivo:** revisar las BBDD antes de transferir información, como propone el usuario.

La web utiliza la base de la API; no tiene una tercera BBDD de negocio que deba copiarse. Los modelos de dominio deben ser equivalentes, pero SQLite móvil y PostgreSQL pueden representar tipos de manera diferente. La identidad local, colas y cachés tienen tablas propias. **No se exige igualdad física de todas las tablas; se exige que ningún dato de negocio pierda información al viajar en ambos sentidos.**

- Completar la matriz de §5 y contrastar campos, anulabilidad, valores por defecto, enums, validación, únicos, relaciones y semántica de borrado.
- Revisar esquemas declarados y bases reales obtenidas al ejecutar migraciones; comprobar bases antiguas, no solo instalaciones nuevas.
- Extender la prueba de paridad a recursos omitidos y a las diferencias de motor. La comparación actual no comprueba valores por defecto ni todos los comportamientos.
- Definir adaptadores explícitos para nombres SQL/DTO, booleanos, números, JSON, fechas y horas. Diferenciar fecha sin hora, instante UTC y zona horaria.
- Resolver columnas heredadas, como el destacado del creyente, y catálogos sembrados con IDs diferentes en cada dispositivo.
- Completar el esquema móvil de comunicaciones y de cualquier otro módulo web que falte.
- Añadir revisiones y metadatos sin cambiar UUID existentes ni borrar registros.
- Preservar IDs de personas e iglesias salvo colisión real de origen, que exige mapeo explícito.
- Probar viajes móvil → API → móvil sin pérdida de campos ni relaciones.

**Salida:** matriz de cobertura y migraciones compatibles. **Aceptación:** cada recurso está clasificado y tiene contrato de ida y vuelta; las bases con meses de uso siguen abriendo y conservan sus datos.

### Fase 3 — Copias, identidades, permisos y datos cifrados

**Objetivo:** preparar protección y propiedad antes de cualquier transferencia real.

- Extender las copias existentes con manifiesto, integridad, archivos ausentes, origen y versiones.
- Obtener un snapshot consistente de filas y archivos; no leer tablas sucesivas mientras cambian y llamar a eso una copia coherente.
- Crear copia previa a conectar, fusionar, desconectar y restaurar; verificarla y permitir guardarla fuera del teléfono.
- Proteger el paquete completo con contraseña y cifrado autenticado; envolver solo claves de tablas no cifra automáticamente el resto del JSON.
- Verificar recuperación en un teléfono distinto y tras reinstalar. El soporte de claves/pepper presente debe probarse; no asumir ni portabilidad completa ni restricción absoluta basándose en documentación anterior.
- Nunca incluir sesiones ni credenciales remotas activas en una copia exportable.
- Definir `local_user_id → remote_user_id`, afiliaciones e iglesias, conservando autoría histórica.
- Un correo coincidente es candidato, no prueba suficiente para adjudicar una cuenta: verificar o aprobar vínculo con autorización.
- Aprobar política para usuarios locales aún no vinculados: invitación pendiente o autor histórico sin login. No fabricar sesiones de esos usuarios.
- Clasificar datos personales y compartidos por registro, incluso dentro de la misma iglesia.
- Resolver celdas cifradas: transformar al contrato remoto existente mediante sesión autorizada, y cifrar la copia local con claves del aparato. Si se quiere cifrado extremo a extremo compartido, requerirá una arquitectura de claves y clientes específica antes de activar esas celdas.
- No subir sobres cifrados con claves que solo conoce un móvil y declarar que la web ya puede leerlos. La política concreta exige revisar el servicio remoto y probar ambos clientes.

**Salida:** copias restaurables, mapa de identidades y controles de acceso. **Aceptación:** un usuario local no gana privilegios remotos por importar su rol, y una celda/archivo puede recuperarse por su destinatario autorizado.

### Fase 4 — Protocolo y registro de cambios en toda la API

**Objetivo:** crear los fundamentos de concurrencia y entrega fiables.

- Implementar revisiones, recibos idempotentes, cursores y registro de cambios.
- Integrar todos los caminos de escritura de la API, incluyendo los usados por web, escritorio y procesos automáticos.
- Definir unidades atómicas de negocio: una nota con relaciones, una asignación de calendario o una fusión no deben quedar a medias.
- Para una operación repetida, devolver resultado previo; mismo ID con contenido diferente produce error, no una segunda ejecución.
- Identificar dependencias entre operaciones y resultados por operación/grupo: aceptada, duplicada, conflicto, rechazada o pendiente.
- Aplicar validación, autorización actual, autoría efectiva y límites de tamaño/carga por recurso.
- Definir retención de recibos y borrados compatible con meses offline. Si se supera, forzar rebase/descarga completa sin eliminar la cola local.
- Reconocer restauraciones del servidor mediante nueva generación y reconciliación; no aceptar cursores antiguos como válidos.

**Salida:** API de sync interna, bajo bandera de activación. **Aceptación:** un cambio web aparece en el flujo móvil; una petición repetida tras perder su respuesta no duplica nada; cursores no pierden transacciones concurrentes.

### Fase 5 — Motor móvil y trabajo offline global

**Objetivo:** guardar siempre localmente y transportar los cambios de forma reanudable.

- En cada escritura conectada, confirmar modificación local y entrada de cola en la misma transacción SQLite.
- En modo exclusivamente local, conservar procedencia y cambios desde un punto de separación si existía una conexión previa.
- Implementar un único coordinador por destino y particiones por dependencias; evitar dos workers enviando simultáneamente la misma operación.
- Descargar snapshot y cambios paginados; confirmar página y cursor en la misma transacción local.
- Enviar cambios con revisión base; mantener recibos hasta reconciliarlos incluso si la app se cerró antes de guardar la respuesta.
- Encadenar ediciones locales sucesivas: la revisión de la segunda depende del resultado de la primera. No enviarlas todas contra la misma revisión antigua.
- No volver a poner en cola los cambios descargados. Separar aplicación remota de la escritura iniciada por el usuario.
- Reintentar con espera creciente y variación aleatoria; distinguir errores transitorios, autenticación, permisos, validación y conflictos.
- Sincronizar al abrir app, recuperar conexión, volver a primer plano y pulsar sincronización manual; tareas de fondo como ayuda.
- Pérdida de token o error 401 detiene transporte y pide autenticar, conservando trabajo; un 403 aparta la operación para revisión y no se reintenta infinitamente.
- Incluir todas las iglesias y los recursos personales sin exigir abrir cada pantalla.
- Tratar red intermitente, portal cautivo, servidor caído, batería baja, almacenamiento insuficiente y reinicio del teléfono.

No prometer sincronización instantánea con la app cerrada: el sistema operativo decide cuándo permite tareas de fondo. El trabajo pendiente debe sobrevivir y retomarse al ejecutar la app. Esta limitación está documentada por [Expo BackgroundTask](https://docs.expo.dev/versions/latest/sdk/background-task/).

**Salida:** lectura y escritura offline con cola global observable. **Aceptación:** trabajar en varias iglesias sin red, cerrar el proceso, reabrir y reconectar produce el mismo resultado compartido sin perder cambios.

### Fase 6 — Conflictos, duplicados, fusiones y borrados

**Objetivo:** que concurrencia no signifique «el último sobrescribe todo».

- Implementar comparación de tres versiones: base conocida, cambio local y versión remota actual.
- Combinar campos independientes cuando las reglas de dominio lo permitan; comprobar invariantes del objeto completo después de combinar.
- Si ambos cambian el mismo campo de modo incompatible, conservar versiones y mostrar decisión: local, remoto o edición combinada.
- Texto largo, cuerpo de nota y documentos: no concatenar ni reemplazar silenciosamente; conservar alternativas. Edición colaborativa carácter a carácter puede evaluarse después.
- JSON de tablas: comparar por celda, no por cadena serializada completa; cambios de esquema/columna pueden bloquear una edición.
- Relaciones: unir altas independientes; resolver altas/bajas sobre el mismo vínculo usando base y operaciones, evitando resucitar bajas.
- Orden de listas y fases: usar una regla de orden estable y resolver movimientos incompatibles sin perder miembros.
- Borrado frente a edición: mantener borrado y edición en conflicto, sin resucitar automáticamente. Restaurar exige una acción autorizada.
- Un borrado de iglesia o cuenta verifica impacto completo y propiedad; no puede resolverse como una simple actualización de campo.
- Resoluciones se envían con nueva revisión base: si otro usuario editó mientras se decidía, se vuelve a comparar.
- Una fusión de registros redirige todas sus relaciones y archivos, registra alias duraderos y queda auditada.

**Reglas de duplicados:**

| Coincidencia                                    | Tratamiento                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| Misma operación y destino                       | Una ejecución; devolver recibo                                                       |
| Mismo UUID con procedencia verificada           | Mismo registro; comparar revisiones                                                  |
| Mismo UUID de origen incompatible               | Colisión; no sobrescribir, remapear con revisión                                     |
| Dos notas nuevas para la misma persona          | Dos notas; conservar autores y archivos                                              |
| Nombre igual o parecido                         | Solo sugerencia de coincidencia                                                      |
| Teléfono/correo igual en dos personas           | Evidencia útil, no certeza: familias y contactos compartidos existen                 |
| Nombre/ciudad iguales en iglesias               | No fusionar automáticamente                                                          |
| Catálogo de sistema con misma clave estable     | Mapear a entrada canónica autorizada                                                 |
| Catálogos personalizados similares              | Comparar contenido y ámbito; aprobar equivalencias                                   |
| Archivo con hash igual                          | Deducir almacenamiento si procede, manteniendo referencias y permisos independientes |
| Ocurrencia de tarea o fila de creyente en tabla | Respetar únicos de negocio; reconciliar el contenido, no descartar sus cambios       |

**Ejemplo:** Ana añade una nota «Visitamos a Juan» y Luis añade «Juan pidió oración». Aunque son del mismo creyente y día, son dos registros válidos. Si Ana y Luis editaron la misma nota a partir de la revisión 4, la primera operación crea la revisión 5; la segunda se compara con 4 y 5 antes de aprobar otra revisión.

**Salida:** políticas por entidad y centro global de conflictos. **Aceptación:** los escenarios anteriores preservan información y relaciones; no se usa la hora del móvil como criterio exclusivo de ganador.

### Fase 7 — Primera conexión con meses de información local

**Objetivo:** vincular toda la app poblada a un servidor poblado sin destrucción ni duplicación masiva.

Flujo obligatorio:

1. Comprobar vínculo, versiones, permisos, espacio y cobertura global del servidor.
2. Crear y verificar copia local; establecer snapshot local de comparación. Si se sigue editando, guardar cambios posteriores aparte.
3. Descargar inventario autorizado del servidor y preparar un trabajo de comparación reanudable, por páginas.
4. Vincular identidades y decidir qué iglesias existentes corresponden a las locales. Crear nuevas iglesias requiere permiso; la cantidad no altera el flujo.
5. Comparar recursos por identidad y reglas de §Fase 6, incluyendo datos personales y archivos.
6. Mostrar resumen global y por iglesia/módulo: nuevos, ya vinculados, posibles duplicados, conflictos, rechazos y archivos pendientes.
7. Elegir «Combinar y añadir» como opción predeterminada: conservar remoto, añadir nuevos y revisar diferencias. Omitir solo duplicados demostrados.
8. Ofrecer descargar remoto a un espacio local separado si se quiere conservar la base anterior sin publicarla. No borrar automáticamente el trabajo local.
9. Para «priorizar móvil» o «priorizar web», mostrar qué campos/registros cambiarán. Priorizar una versión no implica borrar registros exclusivos del otro lado; eliminar un conjunto es una operación adicional explícita.
10. Aprobar mapeos y resoluciones; el servidor revalida permisos y revisiones, ya que la web puede haber cambiado desde la previsualización.
11. Subir archivos y aplicar grupos consistentes en orden de dependencias; mantener el trabajo reanudable. No intentar una transacción gigantesca de todas las iglesias.
12. Descargar estado confirmado, recomponer la proyección local y aplicar cambios hechos durante el proceso.
13. Verificar relaciones, integridad y manifiestos; terminar solo cuando cada recurso esté confirmado o figure claramente pendiente/bloqueado.

Preparar información en staging sin hacerla visible hasta confirmar unidades consistentes. Cada grupo publicado debe poder verificarse. Cancelar antes de publicar no cambia negocio; cancelar después de publicar parte deja un informe y posibilidad de reanudar. **No ejecutar un rollback masivo que borre ediciones posteriores de otros usuarios.**

No basta con comparar totales de registros: las fusiones pueden cambiar cantidades. Comprobar cobertura de identidades, relaciones y contenidos normalizados, además de conteos y hashes de archivos.

**Salida:** asistente completo de importación/combinación. **Aceptación:** servidor vacío, servidor poblado y reconexión de una antigua copia local, con varias iglesias, preservan datos y admiten interrupción a mitad de proceso.

### Fase 8 — Integración de todos los módulos y archivos

**Objetivo:** llevar el protocolo a toda la aplicación, sin presentar un piloto como sincronización completa.

Orden técnico recomendado para desarrollar adaptadores y probar dependencias:

1. Identidades autorizadas, perfiles, todas las iglesias, miembros y catálogos.
2. Creyentes, relaciones, notas, fotos y audios.
3. Calendarios, patrones, fases, reuniones y participantes.
4. Profecías, sueños, emociones, enseñanzas y cuaderno.
5. Tareas, hábitos, series, ocurrencias, etiquetas, flujos y tiempos.
6. Listas, miembros, vistas, portadas, publicación y accesos.
7. Tablas, columnas, vistas, filas, enlaces y celdas protegidas.
8. Comunicaciones, canales, mensajes, reacciones y adjuntos.
9. Ajustes restantes y cualquier recurso adicional del inventario.

Estos grupos son dependencias de implementación, **no una elección de qué iglesias sincronizar**. No hay un límite funcional de una iglesia ni necesidad de seleccionarlas individualmente.

Archivos:

- Usar ID lógico, tamaño, tipo MIME y hash verificable; las rutas del teléfono y claves del servidor se traducen.
- Transferencias por streaming y por partes/reanudables cuando el tamaño lo requiera. No convertir toda la biblioteca a base64 en memoria para sincronizarla.
- Un registro puede marcar «archivo pendiente» hasta completar la transferencia, sin fingir que el archivo está disponible offline.
- Separar progreso de datos y archivos. Antes de una desconexión completa, descargar todos los archivos autorizados incluidos en la copia.
- Autorizar subida, descarga y referencias independientemente del hash del archivo.
- Manejar falta de archivo original, corrupción, espacio agotado y adjuntos huérfanos; limpieza diferida con retención.
- Después de cada aplicación, invalidar consultas, búsqueda, estadísticas y avisos que dependan de los datos modificados.

**Salida:** matriz de cobertura cerrada y adaptadores completos. **Aceptación:** todos los recursos de §5 tienen sincronización o tratamiento técnico documentado y probado. Cualquier módulo móvil inexistente se considera trabajo pendiente, no excepción al alcance.

### Fase 9 — Pausa, cierre de sesión, desconexión y reconexión

**Objetivo:** poder volver a trabajar localmente sin confundir acciones diferentes.

| Acción                        | Efecto                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Pausar                        | Mantiene vinculación, réplica y cola; no transporta cambios hasta reanudar                                                |
| Cerrar sesión                 | Bloquea acceso de la cuenta y detiene transporte; conserva trabajo de forma aislada, sin entregarlo a la siguiente cuenta |
| Desconectar y conservar local | Crea copia independiente autorizada, credenciales locales y punto de separación; elimina credencial activa y desvincula   |
| Quitar datos del dispositivo  | Elimina réplica/archivos locales tras resolver o exportar pendientes; no borra datos del servidor                         |
| Borrar datos compartidos      | Acción de dominio distinta, autorizada y con impacto global visible                                                       |

Desconexión con conexión disponible:

1. Mostrar pendientes, conflictos, fecha de última descarga y espacio necesario.
2. Revalidar permiso para exportar/conservar el conjunto de datos. Con acceso revocado no se puede convertir la antigua caché en una exportación autorizada.
3. Sincronizar o exportar/apartar pendientes; cualquier operación en vuelo se consulta por su recibo antes de decidir si ya se aplicó.
4. Obtener una instantánea consistente de **todas** las iglesias y datos personales autorizados con todos sus archivos.
5. Verificar copia y crear espacio local independiente; mantener autoría histórica y mapeos.
6. Crear/revalidar acceso local del propietario del teléfono. No copiar cuentas remotas con sus contraseñas.
7. Revocar credencial de dispositivo y quitar secretos remotos; cambiar al modo local solo cuando la preparación termine.

Desconexión sin internet:

- Permitir continuar local con la copia disponible, indicando fecha, archivos ausentes y operaciones cuyo resultado remoto se desconoce.
- Exportar y preservar pendientes con su procedencia; la revocación remota queda pendiente o se realiza después desde la web.
- Mantener constancia de que es una copia incompleta, sin marcar descarga finalizada.
- Aplicar la política offline acordada para conservar/exportar información compartida.

Reconexión:

- Con misma instalación y cuenta: usar IDs, mapa de origen y base de separación para comparar cambios posteriores, incluidos los publicados por otros.
- Si el historial ya expiró: bootstrap/rebase completo con conservación de cambios locales, revisión de duplicados y borrados; no reiniciar IDs.
- Otra cuenta o instalación: nuevo espacio y nueva previsualización; nunca reutilizar automáticamente la cola anterior.
- Reconectar después de revocación necesita nueva autorización; tener una copia local no concede permisos.

**Salida:** ciclo completo conectar → offline → desconectar → local → reconectar. **Aceptación:** conservar toda la app autorizada sin borrar el servidor ni duplicar registros al reconectar.

### Fase 10 — Administración completa de usuarios y accesos

**Objetivo:** cubrir las funciones de acceso de toda Navis. Las comprobaciones de seguridad ya existen desde Fases 1–4; esta fase completa los flujos de administración.

- Cuenta local y remota son identidades distintas con equivalencia verificada, no la misma contraseña replicada.
- Invitar o vincular usuarios locales conservando autores históricos. Alta real de cuenta remota requiere procedimiento de autenticación, no una inserción directa de la fila local.
- Aprobar roles personalizados importados comparando permisos; un rol llamado «Pastor» o «Superadmin» no da automáticamente ese poder.
- Sincronizar afiliaciones a todas las iglesias autorizadas y cambios de propietario.
- Proteger reglas de último administrador, tope de rol y baja con iglesias propias mediante servicios existentes.
- Alta/baja de usuarios, cambios de contraseña y elevación de permisos requieren conexión en modo conectado. No se encolan contraseñas en una outbox de negocio.
- Offline se usa una autorización previamente comprobada, con una vigencia acotada; propuesta inicial configurable: 30 días para edición de datos ya descargados. Revalidar al volver a tener red, aunque aún no haya vencido.
- PIN/biometría desbloquean el aparato, no renuevan permisos remotos. No se pretende detectar inmediatamente una revocación sin internet.
- Tras revocación, retirar los datos que dejan de ser accesibles y preservar únicamente el trabajo propio recuperable según una política de cuarentena protegida; no permitir exportar contenido de terceros revocado.
- Las sesiones y contraseñas de accesos públicos de lectura se administran en servidor. Offline mostrar último estado conocido, sin generar enlaces/credenciales que aparenten ser válidos.
- Al convertir una copia a local, los antiguos usuarios quedan como autores históricos; solo se habilitan cuentas locales nuevas o vinculadas de forma explícita. Descargar una iglesia no habilita a cualquiera a entrar.
- Separar información entre cuentas en almacenamiento, consultas, archivos, notificaciones y pantallas tras cerrar sesión.

La vigencia offline es un compromiso de producto: debe permitir viajes sin conexión y a la vez limitar acceso obsoleto. Confirmar esta política antes de activar datos compartidos, sin alterar la libertad de trabajar meses en el modo puramente local.

**Salida:** gestión coherente de usuarios, roles, dispositivos y accesos públicos. **Aceptación:** usuarios diferentes y permisos distintos convergen solo sobre sus conjuntos autorizados, sin escalada de privilegios ni filtraciones entre iglesias/cuentas.

### Fase 11 — Copias del servidor, restauración y recuperación

**Objetivo:** recuperar datos ante pérdida del teléfono, borrado accidental, corrupción o avería del servidor.

- Copias locales manuales y automáticas; paquete completo cifrado y portátil, conservado fuera del teléfono.
- Copias del servidor consistentes de base, almacenamiento de archivos y claves/configuración necesarias; restauración independiente del motor SQLite/PostgreSQL.
- Propuesta de retención inicial: 7 diarias, 4 semanales y 6 mensuales, configurable según volumen y almacenamiento.
- Separar exportación autorizada de negocio de copia administrativa completa de servidor.
- Verificar archivos, compatibilidad de versiones y claves; un archivo que falta debe provocar informe de copia incompleta.
- Restaurar en staging; validar antes de reemplazar. Coordinar base, archivos y secretos: no sobrescribir archivos activos antes de asegurar la restauración.
- La restauración local conectada no sobrescribe la nube automáticamente. Se abre como copia local aparte o se propone una importación comparada.
- No convertir revisiones antiguas de una copia en operaciones nuevas sin revisión: podría resucitar borrados o revertir trabajo de otras personas.
- Restaurar un servidor cambia generación de sync, invalida cursores y exige rebase seguro de móviles. Revisar también sesiones y credenciales.
- Un teléfono nuevo hace bootstrap remoto y recupera pendientes solo desde una copia que los incluya; trabajo nunca enviado y sin copia no puede recuperarse desde la web.
- Hacer simulacros con pérdida total del dispositivo, copia antigua, clave incorrecta y servidor restaurado. Medir cuánto trabajo se puede perder y cuánto tarda recuperar, sin prometer objetivos antes de medirlos.

SecureStore no debe ser la única ubicación de material imprescindible para recuperar información. Su comportamiento tras desinstalación/restauración depende de la plataforma, como documenta [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/).

**Salida:** procedimientos y copias verificadas. **Aceptación:** restauración comprobada en otro dispositivo y servidor limpio, con archivos y datos protegidos legibles por usuarios autorizados.

### Fase 12 — Validación global, observabilidad y despliegue

**Objetivo:** habilitar la función únicamente cuando la cobertura completa y las pruebas críticas estén cerradas.

- Ejecutar pruebas de contrato por entidad, migración histórica, idempotencia, concurrencia, permisos, archivos y restauración.
- Verificar dos o más móviles y web operando sobre múltiples iglesias, con varios propietarios, afiliaciones y módulos personales.
- Probar meses offline, relojes incorrectos, pérdida de respuestas, caída entre escritura/recibo, cierres de proceso y lotes parcialmente aceptados.
- Probar miles de registros y un volumen representativo de archivos; definir presupuestos medidos de memoria, batería, tiempos y espacio. No asumir capacidad ilimitada del teléfono.
- Medir cola pendiente, edad del pendiente más antiguo, conflictos, rechazos, avance de archivos, duración de bootstrap y retraso de publicación.
- Logs con IDs técnicos; redactar tokens, cuerpos de notas, archivos y datos personales.
- Mantener bandera de activación, compatibilidad de clientes y procedimiento para detener transporte sin borrar información local.
- Piloto con copias verificadas y después despliegue progresivo. El piloto puede cubrir módulos de forma interna; la opción global pública exige la matriz completa.
- Revisar los textos funcionales de Ajustes, mensajes de error y estados en los seis idiomas. El diseño visual detallado requiere su investigación de referencias específica durante implementación.

**Salida:** función global disponible y recuperación operativa. **Aceptación:** todas las fases previas, escenarios de §8 y recursos de §5 cerrados; ningún módulo o iglesia queda fuera sin tratamiento explícito.

## 8. Matriz mínima de aceptación de extremo a extremo

| Caso                                              | Resultado verificable                                                      |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| Local antiguo con 3 iglesias → servidor vacío     | Todas las entidades y archivos autorizados llegan; móvil sigue funcionando |
| Cuenta con 20 iglesias y solo una abierta         | Cambios de las 20 sincronizan sin navegar a cada iglesia                   |
| Datos privados de 2 usuarios en misma iglesia     | Solo se replica lo que cada uno puede ver                                  |
| Local + web poblados, personas similares          | Previsualización, revisión y mapeo; sin descarte por nombre                |
| Repetir importación/reintentar tras timeout       | Sin duplicados ni efectos secundarios dobles                               |
| Dos notas nuevas sobre el mismo creyente          | Dos notas visibles, con autoría y adjuntos correctos                       |
| Misma nota editada por dos usuarios               | Combinación segura o conflicto preservado                                  |
| Edición local pendiente + descarga remota         | La propuesta local no se sobrescribe                                       |
| Borrado web + edición offline                     | Conflicto explícito; no resurrección automática                            |
| Fusión de creyentes con vínculos a otros módulos  | Todas las relaciones redirigidas y alias persistente                       |
| Cambio de propietario o membresía                 | Permisos se revalidan y réplica se actualiza                               |
| Nueva iglesia asignada con datos antiguos         | Se descarga sin depender de timestamps nuevos                              |
| Usuario revocado durante viaje offline            | Al reconectar se bloquea transporte y se aplica retiro/cuarentena          |
| Cierre durante subida de audio                    | Transferencia reanudable, registro y estado de archivo consistentes        |
| Desconectar online                                | Copia completa de todo lo autorizado, credencial desvinculada              |
| Desconectar offline                               | Copia disponible conservada y límites mostrados con precisión              |
| Local tras desconectar + cambios web → reconectar | Comparación desde punto de separación, sin repetición masiva               |
| Otra cuenta o servidor con misma URL              | Identidad comprobada; colas aisladas                                       |
| Restaurar backup con cambios recientes en web     | Importación comparada; sin sobrescritura automática                        |
| Servidor restaurado a copia antigua               | Nueva generación y rebase; no pérdida por cursores viejos                  |
| Dos transacciones confirman fuera de orden        | El consumidor recibe ambas; cursor no salta una                            |
| Falta de espacio o archivo original ausente       | Trabajo conservado y estado incompleto visible                             |
| Módulo nuevo añadido al producto                  | CI exige contrato de sync y clasificación de backup                        |

## 9. Orden de ejecución y criterio de cierre

El orden es **0 → 1 (token/URL) → 2 (paridad) → 3 (protección e identidades) → 4 (protocolo) → 5 (motor offline) → 6 (conflictos) → 7 (primera combinación) → 8 (todos los módulos) → 9 (desconexión) → 10 (administración completa) → 11 (recuperación) → 12 (despliegue)**.

La vinculación de Fase 1 puede entregarse sola, pero no habilita transferencias destructivas ni anuncia sincronización completa. Las protecciones de usuarios, archivos y copias necesarias para cualquier operación real se implementan en Fase 3 y se refuerzan después; no se aplazan hasta las últimas fases.

Cada fase debe dejar una lista concreta de archivos modificados, migraciones, pruebas ejecutadas, resultados y limitaciones restantes. Este documento autoriza y define el plan; no supone que se haya pedido implementar todas las fases en esta conversación.

El trabajo se considera terminado cuando un usuario puede empezar local, conectar toda su app con todas sus iglesias autorizadas, comparar información existente, trabajar offline, resolver concurrencia, desconectar conservando sus datos, reconectar y restaurar copias, sin pérdidas silenciosas y con los mismos permisos efectivos que en la web.

## 10. Referencias técnicas y alcance de sus aportaciones

- [Android Developers: aplicaciones offline-first](https://developer.android.com/topic/architecture/data-layer/offline-first): fundamento para repositorios con fuente local, colas persistentes y reconciliación. Las políticas concretas de este documento son una propuesta para Navis, no una receta copiada de Android.
- [Expo BackgroundTask](https://docs.expo.dev/versions/latest/sdk/background-task/): límites de ejecución en segundo plano según sistema operativo; respalda la necesidad de reanudar también en primer plano.
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/): comportamiento de secretos persistidos y límites de recuperación; respalda pruebas de portabilidad y no depender solo del aparato para recuperar datos.

Durante cada fase se debe consultar la documentación de las versiones efectivamente instaladas. Las referencias a documentación vigente no sustituyen validar las APIs y compatibilidad del proyecto.

## 11. Registro de implementación

### Fases 0 y 1 (2026-10-09)

**Fase 0.** Enmienda escrita en el RFC 0024. Los ocho estados de la Fase 0 son el contrato `SYNC_STATES` (`packages/shared/src/sync-state.ts`), con su texto en los seis idiomas (`sync.state.*`). Hoy solo se alcanzan `local` y `connected`.

**Fase 1.**

- API: módulo `apps/api/src/devices/` (`device_links`, `devices`, migración `CreateDevices1790899200000`). Rutas: `GET /sync/capabilities` (pública), `POST /device-links`, `POST /device-links/exchange` (pública, 60 por minuto y por IP), `GET /devices`, `DELETE /devices/:id`. Solo se guardan huellas SHA-256; el token vale 10 minutos y se consume con un `UPDATE` condicionado. `SessionGuard` acepta `Authorization: Bearer nvd_…` y un dispositivo no puede generar vínculos.
- Compartido: `packages/shared/src/schemas/devices.ts`, `sync-link.ts` (normalización de URL; `http` solo en desarrollo) y hooks en `packages/api-client` (`device-hooks`, `device-mutations`).
- Web: Ajustes → Dispositivos (`components/devices/`): código con estela de caducidad, copiar, lista y revocación.
- Móvil: Ajustes → Conexión (`app/settings/connection.tsx`, `components/sync/`, `lib/sync/`): comprueba el servidor, canjea el código, guarda la credencial en SecureStore y el destino en `stores/sync-connection.ts`. Desvincular revoca y vuelve al modo local sin tocar datos.

**Limitaciones.** Sin QR (ni generarlo en la web ni leerlo en el móvil: haría falta `expo-camera`, dependencia nativa nueva). El token se liga a la cuenta que lo genera, no a un dispositivo concreto. Migración probada solo en SQLite.

- **Sin tope de dispositivos:** una cuenta puede vincular tantos teléfonos como quiera, cada uno con su credencial revocable por separado (cubierto en `devices.e2e-spec.ts`).

### Fase 2, primer tramo (2026-10-09)

- **Matriz de cobertura:** `packages/shared/src/sync-coverage.ts` clasifica las 58 tablas de la API (`synced`, `pending-mobile`, `cache`, `server-only`) con su ámbito de lectura. `apps/api/src/database/sync-coverage.test.ts` falla si una entidad nueva no declara política, si una tabla `synced` no tiene espejo local o si queda una política huérfana.
- **Huecos que la matriz deja a la vista:** `profiles` y las cinco tablas de comunicaciones (`channels`, `channel_members`, `messages`, `message_attachments`, `message_reactions`) no tienen espejo móvil; son trabajo pendiente de la Fase 8, no excepciones.
- **Paridad de valores por defecto:** `local-schema.parity.test.ts` ahora compara los literales por defecto. Encontró una divergencia real: `custom_table_views.sort_order` valía `desc` en la API y `asc` en el móvil; alineado a `desc` (`local-table-schema.ts` y `table-views.ts`).
- **Pendiente de la Fase 2:** adaptadores explícitos de tipos (booleanos, JSON, fechas), catálogos sembrados con IDs distintos, comprobar bases antiguas migradas y el viaje móvil → API → móvil sin pérdida.

### Fase 2, segundo tramo (2026-10-09)

- **Adaptadores de tipos:** `packages/shared/src/sync-codec.ts` (`encodeRow`/`decodeRow`) y `sync-column-kinds.ts` fijan qué es un día (`YYYY-MM-DD`, sin zona), una hora, un instante (ISO UTC con milisegundos; acepta el `YYYY-MM-DD HH:MM:SS` que TypeORM guarda en SQLite) y un JSON; los booleanos viajan como `true/false`. `sync-column-kinds.test.ts` de la API compara esa tabla con los tipos de las entidades.
- **Ida y vuelta:** `sync-roundtrip.test.ts` (API) guarda una fila de cada una de las 52 tablas espejo con TypeORM y comprueba que vuelve idéntica; `sync-codec.test.ts` hace lo mismo en `shared`. Rompiendo la normalización de instantes a propósito, los 52 fallan.
- **Catálogos con ids distintos:** `sync-catalogs.ts` declara roles, emociones de serie, ministerios, dones y etiquetas de creyente de serie por su clave natural, con `mapCatalogIds` y las referencias que hay que reescribir (`CATALOG_REFERENCES`). Reescribir de verdad esas referencias al importar queda para la Fase 7.
- **Esquema real del móvil:** `local-schema-actual.test.ts` pasa una base por **todas** las migraciones reales y compara el resultado con lo declarado. Encontró que `believers.featured_tag_id` sigue vivo (el móvil lo lee y escribe; `believer_tag_links.featured` no se escribe nunca): se deja como columna heredada declarada y `sync-legacy.ts` traduce en los dos sentidos. Eliminarla exige reescribir los repositorios de creyentes y el formato de copias; queda pendiente y debe hacerse con el móvil a la vista.
- **Fase 2 cerrada salvo:** el esquema móvil de comunicaciones y de `profiles` (Fase 8) y retirar la columna heredada anterior.

### Fase 4 (2026-10-09)

Servidor, tras `SYNC_ENABLED` (apagado por defecto; la API no registra ni acepta nada).

- **Registro de cambios por triggers**, no por eventos de TypeORM: unas 78 llamadas de la API (`repo.update`, `repo.delete`) no disparan eventos y se habrían escapado. `packages/shared/src/sync-trigger-sql.ts` genera, para SQLite y Postgres, un trigger por tabla `synced` que sube la revisión (`sync_revisions`) y apunta el cambio (`sync_changes`) en la **misma transacción** de la escritura, con la iglesia y el dueño resueltos subiendo por `SYNC_PARENTS`. Vive en `shared` porque las migraciones no pueden importar ficheros locales (TypeORM las carga con `require`). Migración `CreateSyncLog1790985600000` (no congelada: una tabla nueva exige reinstalar triggers y `sync-triggers.test.ts` falla si se olvida).
- **Cursor sin pérdidas:** `position` nace nulo y `SyncPublisher` (serializado y con índice único) lo reparte solo para filas ya confirmadas, así que una transacción lenta nunca queda por detrás del cursor.
- **`GET /sync/changes`:** páginas por cursor, filtradas (catálogos: todos; datos personales: su dueño; datos de iglesia: sus miembros, y solo el dueño si la fila tiene dueño), con la fila actual en forma de protocolo. `409` si cambia la `generation` de la instalación o el cursor es posterior al servidor. Sin más páginas, el cursor salta lo publicado que esa cuenta no ve.
- **`POST /sync/operations`:** recibos idempotentes (`sync_receipts`) guardados en la misma transacción que el adaptador; repetir un `operationId` devuelve `duplicate`, reutilizarlo con otro contenido se rechaza, y lo que no tiene adaptador (`SyncAdapterRegistry`) se rechaza. Los adaptadores por módulo son la Fase 8.
- **Pruebas:** 9 unitarias de triggers/publicación y 6 e2e de punta a punta (`sync.e2e-spec.ts`). Toda la suite e2e (18 ficheros, 262 tests) pasa **también contra Postgres 18**, con el contenedor desechable de esta sesión.

**Pendiente de la Fase 4:** revisión base en las operaciones (hace falta el adaptador de cada tabla), retención y poda de `sync_changes` y recibos, y que los permisos por módulo filtren el flujo (hoy solo pertenencia y dueño, por eso sigue apagado).

### Fase 4, cierre (2026-10-09)

- **Permisos por módulo en el flujo:** `sync-permissions.ts` fija el permiso de lectura de cada tabla (el mismo que la pantalla de la web) y `GET /sync/changes` no entrega lo que el rol no puede leer; quien tiene `believers.view` no gana las llaves de las listas (`lists.share`).
- **Revisión base:** una operación cuya `baseRevision` no coincide con la de la entidad es un `conflict` (`stale-base`, con la revisión actual) y el adaptador no se ejecuta; el recibo guarda el conflicto.
- **Retención y poda:** `SYNC_RETENTION_DAYS` (180 por defecto). `SyncRetentionService` borra lo publicado hasta la última posición vieja y anota `pruned_through`; un cursor anterior recibe 409 y rehace la descarga. Los recibos viejos también se podan.
- **Triggers a prueba de migraciones:** en SQLite, TypeORM recrea una tabla al quitar o cambiar una columna y se lleva sus triggers. `SyncInstallationService` los comprueba al arrancar y reinstala los que falten; las migraciones que tocan tablas con triggers usan `ALTER TABLE` directo.
- **Tres fallos que solo salieron al ejecutar todo con la captura encendida**, y ya corregidos: `list_members` y `list_grants` no tienen `id` (clave compuesta, `sync-keys.ts`); seis tablas no tienen `deleted_at`; el identificador compuesto (73 caracteres) no cabía en `varchar(64)` de Postgres; y el ámbito de una hija de dato personal salía como `text` donde la columna es `uuid`.
- **Verificación en los dos motores desde cero:** Postgres 18 y un SQLite vacío, solo con las migraciones, 265/265 tests e2e con `SYNC_ENABLED` apagado y encendido. `sync-triggers.test.ts` ejecuta insert, update y delete sobre las 52 tablas sincronizadas.

### Fase 3 (2026-10-09)

- **Copia v2 (`lib/backup`):** manifiesto (filas por tabla, cada fichero con tamaño y SHA-256, ficheros ausentes), origen, huella de todo el contenido, lectura de todas las tablas en una sola transacción y verificación antes de restaurar (`corrupt` sin tocar nada). Las copias v1 se siguen restaurando.
- **Paquete cifrado:** AES-256-GCM con clave PBKDF2 (`package-crypto.ts`); contraseña de 12 caracteres como mínimo, y una equivocada o un fichero alterado fallan igual.
- **Copia previa:** `safety-backup.ts` deja una copia verificada (se vuelve a leer y pasa la comprobación de restauración) antes de restaurar, conectar y desconectar; si no puede, la operación no sigue. Guarda las 5 últimas, sin claves portables, en el almacenamiento privado de la app. Para llevarla fuera se usa la exportación con contraseña.
- **Nunca credenciales remotas:** una copia no lleva la credencial del dispositivo ni la conexión (test).
- **Identidades y roles (`sync-identity.ts`):** el correo coincidente es solo un candidato; quien vincula queda verificado con su cuenta (`identities` en el vínculo); los demás usuarios locales son autores históricos sin acceso; importar un rol no da poder y uno propio con otro conjunto de permisos se revisa.
- **Celdas protegidas:** el protocolo lleva la contraseña en claro (solo HTTPS y solo con `tables.view`, como `reveal`) y cada extremo la cifra con su clave: `sync-password-cells.ts` en el servidor y `sync-cells.ts` en el móvil. Nunca viaja un sobre que solo entiende un teléfono.
- **Visibilidad por registro (`sync-privacy.ts`):** la misma regla que los triggers (dos personas de una iglesia ven cada una solo sus tareas).

**Pendiente de la Fase 3:** persistir `sync_id_map` y aplicar la decisión de roles y autores al importar (Fase 7); restaurar en otro teléfono ya está probado con la contraseña del paquete (`backup-keys.test.ts` y `backup-v2.test.ts`), pero no en un teléfono físico.

### Fase 5 (2026-10-09)

Motor móvil, **inerte mientras el servidor no tenga `SYNC_ENABLED`** (el motor consulta `GET /sync/capabilities` en cada vuelta y no envía ni descarga nada si `dataSyncEnabled` es falso). Migración local 22.

- **Cola en la misma transacción que la escritura:** triggers SQLite (`packages/shared/src/sync-local-triggers.ts`) apuntan cada escritura en `sync_outbox` desde cualquier repositorio; una entrada pendiente por entidad y destino (las ediciones seguidas se funden con `ON CONFLICT` sobre un índice parcial). Solo escriben con un destino vinculado (`capturing`) y fuera de una descarga (`applying`): lo que baja del servidor no vuelve a subir. Tablas de metadatos en `data/sync-migration.ts`: `sync_state`, `sync_outbox`, `sync_entity_state`, `sync_checkpoint`, `sync_conflicts` (del aparato: ni paridad con TypeORM ni copias).
- **Destinos aislados:** cola, revisiones y cursor llevan `destination` (`apiUrl|cuenta`); la cola de una instalación no se envía a otra aunque cambie la URL o la sesión.
- **Motor (`lib/sync/engine.ts`):** descarga primero y sube después. Primero porque ahí se descubre un servidor restaurado (`409`) y las revisiones base de la cola dejan de valer; esto lo encontró un test, la primera versión subía antes. Cada página se aplica y guarda su cursor en la misma transacción; cada resultado de una subida se guarda al recibirlo.
- **Idempotencia y encadenado:** el `operation_id` se guarda **antes** de la petición, así que tras un corte se reenvía el mismo; una entidad aparece una vez por tanda y su segunda edición espera a que la primera deje su revisión.
- **Conflictos sin pérdida:** una descarga no pisa una entidad con edición sin enviar y no adelanta su revisión base, de modo que al subirla el servidor responde `stale-base`, se anota en `sync_conflicts` y la edición local se conserva. La resolución es la Fase 6.
- **Errores clasificados** (`classify-error.ts`): sin red o 5xx (reintento con espera exponencial y variación, `backoff.ts`), 401 (se detiene y pide vincular de nuevo), 403 (pausa), 409 (rehacer descarga), contrato roto. Una tabla que el servidor aún no aplica se queda en cola sin reintentarse en bucle.
- **Un solo coordinador** (`sync-runner.ts`): las llamadas simultáneas comparten la misma vuelta. `device-runner.ts` sincroniza al abrir, al volver a primer plano, al recuperar la red (`expo-network`), cada minuto con la app a la vista y a mano; `useSyncScheduler` lo enciende solo mientras hay vínculo.
- **Contraseñas de tablas:** suben en claro (`cellsToWire`) y bajan selladas con la clave del aparato (`cellsFromWire`).
- **Restaurar una copia se niega mientras el teléfono está vinculado** (`linked`): reemplazaría todo y la cola lo propagaría como borrados. La restauración conectada es la Fase 11.
- **Interfaz:** la pantalla de conexión muestra el estado de la última vuelta, lo que falta por enviar, lo que espera revisión, la última vez y «Sincronizar ahora»; textos en los seis idiomas.
- **Pruebas:** 148 en `lib/sync` (cola y triggers de las 52 tablas, aplicación de las 52 tablas, motor contra un servidor falso con las mismas reglas —sin red, respuesta perdida, encadenado, conflicto, 401, 409, apagado, tabla sin adaptador, destinos aislados, contraseñas—, coordinador, reintentos, clasificación).

**Pendiente de la Fase 5:** tarea en segundo plano del sistema (`expo-background-task`, solo ayuda), tratamiento explícito de batería baja y de falta de espacio, y verlo en un teléfono (la app solo está probada en Jest). Ningún adaptador de servidor existe todavía (Fase 8), así que hoy toda operación real se rechaza con `unsupported-table` y espera en la cola.

### Fase 5, pendientes cerrados (2026-10-09)

- **Tarea en segundo plano** (`lib/sync/background-task.ts`, `expo-background-task` + `expo-task-manager`, plugin en `app.config.ts`): ayuda, no garantía; el sistema decide cuándo la ejecuta. `defineTask` va al cargar el módulo y la tarea rehidrata el almacén del vínculo antes de sincronizar. Se registra al vincular y se retira al desvincular. Para que una ejecución sin interfaz no apague el registro, el coordinador **ya no toca la captura cuando no ve vínculo** (desvincular la apaga).
- **Batería baja** (`resources.ts`, `expo-battery`): una vuelta automática con menos del 15 % y sin cargador espera; la del botón no. Una lectura que falla no frena.
- **Falta de espacio** (`Paths.availableDiskSpace`): por debajo de 50 MB se sube lo pendiente pero no se aplican descargas (`lowStorage`), y al liberar espacio llega todo.

### Fase 6 (2026-10-09)

- **Fusión a tres bandas** (`packages/shared/src/sync-merge.ts` + `sync-merge-policy.ts`): base, local y remota. Un campo que cambió solo en un lado se toma de ese lado; si cambió en los dos y distinto, es conflicto y decide una persona; nunca gana «el último» ni interviene la hora del teléfono. Políticas por tabla: `updated_at` no es edición, `position` lo manda el servidor, las celdas de una fila de tabla se fusionan celda a celda, `last_note_at` gana la mayor y los campos derivados (`search_name`, `search_text`) siguen a su fuente.
- **Versión base** (`sync_entity_state.base_json`): lo último que confirmó el servidor por entidad. **Sin contraseñas en claro**: los metadatos guardan una huella SHA-256 con una clave secreta del aparato (`secret-cells.ts`); para fusionar se tienen en claro un momento en memoria. Así una contraseña editada aquí y otra celda editada en el servidor no chocan.
- **Conciliación** (`reconcile.ts`), entre descargar y subir: lo del servidor sobre una entidad con edición local sin enviar se guarda aparte (`sync_remote_pending`) y se concilia. Campos independientes: fusión automática y la fusión sube sobre la revisión del servidor. Mismo campo, o **borrado contra edición** en cualquiera de los dos sentidos: se conserva todo y queda un conflicto abierto; la entrada de la cola se aparta para que no se envíe a ciegas. Si los dos lados borraron, no hay conflicto.
- **Resolución** (`resolve-conflict.ts`): por campo (lo local, lo del servidor o un valor combinado escrito a mano; el texto largo no se concatena solo), y para borrados aceptar/conservar. Parte de lo que hay **ahora**, no de la instantánea que se enseñó, y sube con la revisión del servidor como base: si otro editó mientras se decidía, se vuelve a comparar. Restaurar algo borrado por otro lo autoriza el servidor (adaptadores, Fase 8).
- **Duplicados** (`sync-duplicates.ts`): solo sugerencias, dentro de la misma iglesia: mismo nombre sin acentos, mismo teléfono o correo; nombre más un dato de contacto es «probable», lo demás «posible» (las familias comparten teléfono). **Fusionar** (`merge-believers.ts`): notas, etiquetas, dones, audios, pertenencias de listas (clave compuesta) y celdas pasan al conservado; si el vínculo ya existía (misma etiqueta, mismo don) no se duplica, aunque el esquema local no tenga el índice único que sí tiene la API; se traen los datos de contacto que faltaban; el retirado se borra y queda un **alias persistente** (`sync_aliases`): lo que llegue del servidor apuntando al retirado se redirige al conservado y el retirado no resucita.
- **Servidor:** borrar una iglesia, una membresía o un rol no viaja como operación de campo (`protected-entity`), haya adaptador o no.
- **Interfaz:** «Revisar cambios» (centro de conflictos con la hoja de decisión) y «Posibles duplicados» (con confirmación y elección de cuál se conserva), desde la pantalla de conexión; textos en los seis idiomas.
- **Pruebas:** 178 en `lib/sync` (fusión pura en `shared`, escenarios de conflicto con el servidor falso: campos independientes, mismo campo con las cuatro decisiones, decisión inválida, edición concurrente durante la decisión, borrados en los dos sentidos, contraseñas, fusión de duplicados y redirección por alias).

**Pendiente de la Fase 6:** que el servidor aplique de verdad las resoluciones y fusiones (adaptadores, Fase 8); fusión con entidades que cuelgan por otras columnas distintas de `believer_id` (si aparecen); y verlo en un teléfono.
