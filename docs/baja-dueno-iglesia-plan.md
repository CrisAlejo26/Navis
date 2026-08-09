# Baja de una cuenta dueña de una iglesia: qué conservar y qué no

> **Estado**: Borrador · **Fecha**: 2026-08-08 · **Slug**: `baja-dueno-iglesia`

- **Tipo**: ampliación de la administración de cuentas (RFC 0008 D-ownerId,
  RFC 0014 D4). Un endpoint nuevo, un servicio nuevo, y un paso más en un
  diálogo que ya existe.
- **Apps afectadas**: api y web. Escritorio hereda la web. Móvil no tiene
  pantalla de administración de accesos todavía, así que no entra.
- **Motivo**: `UserAdminService.remove()` borra la cuenta de Better Auth sin
  mirar qué deja detrás. Si esa cuenta es dueña de una iglesia (`churches.manage`,
  autoprovisionada — RFC 0014 D4), su iglesia, sus creyentes, sus listas, su
  calendario entero y sus audios se quedan huérfanos: nadie los ve, nadie los
  borra, y no hay vuelta atrás porque nadie decidió nada.

## 1. Objetivo y alcance

Entra:

- Al dar de baja una cuenta que es **dueña** de una o más iglesias
  (`Church.ownerId = id`), la baja se detiene y pide una decisión **por cada
  iglesia**: eliminarla con todo su contenido, o trasladar todo su contenido a
  otra iglesia existente a la que quien administra también llegue.
- El traslado mueve **la iglesia entera como unidad**: creyentes, sus notas y
  audios, listas y quién las ve, calendarios, sedes, patrones, reuniones y sus
  fases — todo junto, para no dejar referencias colgando (§3, decisión D1).
- Los ficheros en disco (audios de notas, fotos de creyentes) se mueven de
  verdad, no solo la fila de la base de datos: su `storage_key`/`photo_key`
  lleva el id de la iglesia en la ruta (§2, hallazgo clave).
- De paso, se tapa un agujero contiguo: hoy `remove()` no limpia las filas de
  `church_members` de la cuenta borrada en las iglesias donde era **miembro**
  (no dueña). Se quedan apuntando a un `user_id` que ya no existe.

No entra:

- **Elegir por categoría** («conservo los creyentes pero borro las listas»).
  Se explica por qué en D1: rompe referencias entre categorías.
- **Cuentas de creyente, ministerio o superadministrador sin iglesia propia.**
  Solo entra en juego cuando `Church.ownerId` apunta a la cuenta que se borra;
  el flujo de baja de cualquier otra cuenta no cambia.
- **Profecías y sueños.** No llevan `church_id` (son de la persona, RFC 0004
  D1); se van con la cuenta igual que hoy, sin pasar por este flujo.
- **Comunicaciones.** El módulo todavía no está implementado (solo la RFC y
  la pantalla puente); nada que mover.
- **Exportar antes de borrar.** Fuera de alcance de esta entrega; queda como
  pregunta abierta (§9).

## 2. Hallazgos de investigación

### Cómo lo resuelven otros

- **GitHub** no deja borrar una cuenta que todavía posee una organización: hay
  que trasladar la propiedad o borrar la organización primero. El borrado de
  cuenta y la resolución de lo que posee son **dos pasos obligados**, no uno
  con una casilla opcional — es el patrón que evita el huérfano por descuido,
  y el que sigue este plan (§4, el `DELETE` se niega hasta tener una decisión
  por cada iglesia).
- **Slack** y **Notion**, al dar de baja a alguien, no le borran el contenido:
  quien administra **traslada la propiedad** de lo que esa persona tenía
  (canvases, listas, páginas) a otra cuenta, o lo deja donde está si el
  espacio lo sigue usando otra gente. El paralelo aquí es la iglesia: no es
  "de una persona", es un espacio de trabajo (RFC 0008), así que trasladarla
  entera a otra que ya existe es más natural que fragmentar su contenido.
- **`REASSIGN OWNED` de Postgres** confirma la forma correcta de un traslado
  masivo: una operación por tabla, dentro de una única transacción, sin
  bloquear más filas de las necesarias a la vez. Como aquí no hay claves
  foráneas declaradas en `church_id` (ver Trampa del repositorio: "el `DataSource`..."
  y el resto de entidades con `ownerId`/`role`, todas sin FK), no hace falta
  `DEFERRABLE`: cada `UPDATE ... WHERE church_id = origen` es independiente y
  se ejecuta en el orden que se quiera dentro de la transacción.

### Hallazgo clave del propio código: los ficheros llevan el id de la iglesia en la ruta

`FileStorageService.scopePath` (`apps/api/src/media/file-storage.service.ts`)
no le pone prefijo al ámbito de iglesia **a propósito** — el comentario ya
avisa: _"los audios ya guardados viven en `<uploads>/<churchId>/` y su
`storage_key` apunta ahí. Moverlos... obligaría a tocar disco y base de datos
a la vez para no ganar nada"_. Eso significa que trasladar una iglesia **sí**
es ese caso: cada `NoteAudio.storageKey` y `Believer.photoKey` empieza por el
id de la iglesia de origen (`<churchId>/<uuid>.<ext>`). Mover la carpeta en
disco sin reescribir esas columnas deja el audio inaccesible (404 de
`FileStorageService.read`, que comprueba que el fichero exista en la ruta que
dice la base de datos). Los dos movimientos van en el mismo paso.

### El resto del modelo de datos

Todo lo que cuelga de una iglesia, agrupado por cómo se ata a ella:

| Ata por                         | Tablas                                                                                                                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `church_id` directo             | `believers`, `believer_notes`, `note_audios`, `ministries`, `gifts`, `lists`, `list_viewers`, `calendars`, `congregations`, `meeting_patterns`, `meetings`, `church_members`                                 |
| Cuelga de una de las anteriores | `believer_ministries`/`believer_gifts` (de `believer_id`), `pattern_phases` (de `pattern_id`), `meeting_slots` (de `meeting_id`), `list_members`/`list_grants`/`list_views`/`list_access_log` (de `list_id`) |
| No lleva `church_id`            | `prophecies`, `prophecy_fulfillments`, `dreams`, `dream_audios`, `dream_emotions` — son de la persona (RFC 0004 D1), no de la iglesia                                                                        |

Ninguna de las tablas del primer grupo tiene clave foránea a `churches`: la
coherencia la sostiene el servicio, igual que `Church.ownerId` (Trampa del
repositorio: _"Padre e hijo de TypeORM no se importan..."_ es la misma familia
de decisión — sin FK declarada, sin ciclo de importación, y aquí además sin
bloqueo de fila entre tablas al trasladar). Consecuencia práctica: **no hace
falta desactivar ninguna restricción** para el `UPDATE` masivo; sí hace falta
que el propio servicio recorra las tablas en el orden correcto y dentro de una
transacción, porque nadie más lo va a comprobar por él.

Todas las entidades heredan `deletedAt` de `BaseEntity` (borrado lógico). El
"eliminar" de este flujo sigue esa misma convención — `softRemove` masivo, no
un `DELETE` de SQL — para no romper el patrón que ya usa el resto de la
aplicación (Regla 1 §3, "sigue el estilo que ya hay").

## 3. Dirección de diseño

**D1 — La unidad de decisión es la iglesia entera, no cada categoría.** El
enunciado original pedía "elegir qué conservar y qué no" hasta el nivel de
creyentes o listas por separado. No se ofrece esa granularidad: una lista con
`list_members` que apuntan a creyentes borrados aparte, o una reunión sin su
sede porque la sede se quedó y la reunión se fue, son referencias colgando
sin que ninguna consulta las proteja (no hay FK, así que no hay error: hay un
`id` que ya no encuentra nada, y una pantalla que revienta más tarde). Elegir
por iglesia entera —eliminar o trasladar todo junto— es lo que Slack y Notion
hacen también (§2) y es lo único que se puede hacer sin dejar basura.

**D2 — La detección va en el propio `DELETE`, no en un endpoint aparte.**
Antes de borrar la cuenta, el servicio mira si es dueña de alguna iglesia. Si
lo es y la petición no trae una decisión para cada una, no borra nada y
devuelve **409** con el detalle en `data` — el mismo patrón que ya usa la
puerta de una lista restringida y el límite de intentos (`ApiErrorBody.data`,
Regla 1 §3 "Contrato único"). Un segundo endpoint de "impacto" solo para
enseñar los números sería una llamada más para lo mismo que el propio intento
de borrar ya tiene que calcular.

**D3 — El traslado es una operación de servicio, no once `UPDATE` sueltos en
el controlador.** `ChurchTransferService` nuevo, en el módulo `churches`
(mismo criterio de capas que ya separa controlador fino / servicio con la
lógica, Regla 1 §3). Una transacción por iglesia resuelta, siguiendo el mismo
patrón que `BelieverNotesService` (`dataSource.transaction(async (manager) =>
...)`).

**D4 — Los `church_members` no se copian sin mirar.** Si alguien es miembro de
las dos iglesias a la vez (de la que se traslada y de la que recibe), mover su
fila chocaría con `UQ_church_members` (`church_id`, `user_id`). Se filtran
antes de mover: las filas cuyo `user_id` ya tiene membresía en el destino se
sueltan (esa persona ya llega); el resto se traslada tal cual. Es la misma
familia de problema que la carrera de `ensureFor` arreglada esta sesión —choque
de único, no error real— así que se resuelve igual: comprobar antes de mover,
no capturar la excepción después.

**D5 — Los ficheros del origen que se elimina no se borran de disco.** Si la
decisión es "eliminar", los datos de esa iglesia pasan a `deletedAt` (borrado
lógico, D-el de arriba) pero los audios y fotos se quedan donde están. Borrar
ficheros es irreversible y esta aplicación no borra nada irreversible por
ninguna otra vía (ni siquiera dar de baja una cuenta hoy toca disco). La
carpeta huérfana es pequeña, vive fuera de la base de datos y ya está fuera
del volcado de Postgres (Trampa del repositorio: "Los ficheros subidos no
están en la base de datos"); limpiarla es tarea de un script de mantenimiento
aparte, no de esta entrega (§9).

**D6 — El agujero contiguo se tapa en el mismo cambio.** `UserAdminService.remove()`
pasa a borrar también las filas de `church_members` de la cuenta en **todas**
sus iglesias (no solo las que posee) antes de borrar la cuenta de Better Auth.
Es el mismo `id` de usuario, el mismo método, y dejarlo para otra entrega
significaría un ratio conocido de basura en cada baja mientras tanto.

## 4. Arquitectura

### `packages/shared`

| Qué                                                                                                                                                       | Dónde                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `ChurchDecision` (`{ churchId, action: 'delete' \| 'transfer', targetChurchId?: string }`) y `RemoveUserInput` (`{ churchDecisions?: ChurchDecision[] }`) | `src/schemas/user-admin.ts` (ampliación) |
| `OwnedChurchImpact` (`{ id, name, believers, lists, calendars, congregations, notes, members }`) para el cuerpo del 409                                   | `src/schemas/churches.ts` (ampliación)   |

Zod valida la forma en la frontera de la API (Regla 10 §3); en el cliente,
los tipos salen inferidos del mismo esquema.

### `apps/api`

| Qué                                                                                                                                             | Dónde                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `ChurchTransferService`: `impactOf`, `transferAll(origen, destino)`, `deleteAll(origen)`                                                        | `src/churches/church-transfer.service.ts`            |
| `FileStorageService.moveScope(origen, destino)`: renombra la carpeta y devuelve cuántos ficheros movió                                          | `src/media/file-storage.service.ts` (ampliación)     |
| `UserAdminService.remove()` exige `churchDecisions` si hay iglesias propias; si faltan, lanza `ConflictException` con `data: { ownedChurches }` | `src/users/user-admin.service.ts` (ampliación)       |
| `RemoveUserDto` (el `churchDecisions` opcional, con `class-validator`)                                                                          | `src/users/dto/remove-user.dto.ts` (nuevo)           |
| El controlador acepta cuerpo en el `DELETE`                                                                                                     | `src/users/users.controller.ts` (ampliación puntual) |

`ChurchTransferService.transferAll` recorre, dentro de una única transacción,
las tablas del primer grupo del §2 con un `UPDATE churchId = :destino WHERE
churchId = :origen` cada una (las del segundo grupo no hace falta tocarlas:
cuelgan de un id que no cambia), filtra `church_members` como dice D4, llama a
`files.moveScope` para audios y fotos reescribiendo `storageKey`/`photoKey`
con el prefijo nuevo, y por último `softRemove` de la `Church` de origen.
`deleteAll` hace lo mismo pero sin destino: `softRemove` en cascada de cada
tabla del primer grupo (TypeORM `softRemove` no sigue relaciones solo; se
listan las filas y se pasan al `softRemove` de cada repositorio, como ya hace
`believer-notes.service.ts` con una nota sola) y de la `Church`.

### `packages/api-client`

| Qué                                                                                                                                      | Dónde                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `useDeleteUser` pasa a aceptar el segundo argumento `churchDecisions`                                                                    | `src/user-admin-hooks.ts` (ampliación) |
| El error 409 con `ownedChurches` se expone tal cual en `ApiError.body.data`, ya soportado por el cliente (Regla 1: nada que añadir aquí) | —                                      |

### `apps/web`

| Qué                                                                                                                                                                                                                                                                              | Dónde                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `DeleteUserDialog` detecta el 409, guarda `ownedChurches` en estado y muestra el paso 2 en vez de cerrar con un error genérico                                                                                                                                                   | `components/access/delete-user-dialog.tsx` (ampliación) |
| El paso 2: una fila por iglesia con su nombre y sus números (`believers`, `lists`…), un `Select` con "Eliminar" / "Trasladar a…", y si es traslado, un segundo `Select` con `useChurches()` filtrado (sin la propia iglesia, sin ninguna marcada para eliminar en el mismo plan) | `components/access/church-decision-row.tsx` (nuevo)     |
| El botón de confirmar sigue pidiendo escribir el nombre de la cuenta (ya existe en `ConfirmDialog`) y además exige una decisión para cada fila                                                                                                                                   | `components/access/delete-user-dialog.tsx`              |

`church-decision-row.tsx` es su propio fichero porque `DeleteUserDialog` ya
tiene su responsabilidad (confirmar + llamar al hook) y esto es una pieza de
formulario con su propio estado de validación — mezclar las dos superaría
sin necesidad las ~100 líneas de la Regla 6, y es exactamente el patrón que ya
sigue `ChurchFilter` en la misma carpeta: un componente, un propósito.

## 5. Pasos ordenados

1. `packages/shared`: `ChurchDecision`, `RemoveUserInput`, `OwnedChurchImpact`.
2. `apps/api`: `FileStorageService.moveScope` + su test (mover, y comprobar
   que reescribe la ruta devuelta).
3. `apps/api`: `ChurchTransferService.impactOf` + test (los números, sin
   tocar nada).
4. `apps/api`: `ChurchTransferService.deleteAll` + test (todo a `deletedAt`,
   nada en disco).
5. `apps/api`: `ChurchTransferService.transferAll` + test (incluido el caso
   D4: alguien miembro de las dos iglesias no duplica su fila).
6. `apps/api`: `UserAdminService.remove()` exige `churchDecisions`, valida
   (destino existe, es alcanzable, no es el origen, no está también marcado
   para eliminar) y aplica D6 (limpiar `church_members` de toda cuenta
   borrada, no solo de la dueña) + tests.
7. `apps/api`: `RemoveUserDto`, controlador, e2e (Postgres: la única forma de
   probar de verdad la transacción y el choque de `UQ_church_members`).
8. `packages/api-client`: `useDeleteUser` con el segundo argumento.
9. `apps/web`: `church-decision-row.tsx`.
10. `apps/web`: `DeleteUserDialog` con el paso 2.
11. i18n: claves nuevas (§6) en los seis idiomas.
12. e2e de web: dar de baja a un pastor con iglesia propia, elegir trasladar,
    comprobar que sus creyentes aparecen en la iglesia destino; otro caso
    eligiendo eliminar, comprobar que ya no aparecen en ningún listado.

## 6. i18n

Sección `roles.*`, junto a las claves que ya usa `DeleteUserDialog`:

| Clave                          | es                                                                       |
| ------------------------------ | ------------------------------------------------------------------------ |
| `roles.ownsChurchesTitle`      | "Esta cuenta administra {{count}} iglesia(s)"                            |
| `roles.ownsChurchesBody`       | "Antes de darla de baja, decide qué pasa con cada una."                  |
| `roles.churchActionDelete`     | "Eliminar, con todo su contenido"                                        |
| `roles.churchActionTransfer`   | "Conservar: trasladar todo a…"                                           |
| `roles.churchTransferTarget`   | "Elige la iglesia destino"                                               |
| `roles.churchImpact`           | "{{believers}} creyentes · {{lists}} listas · {{calendars}} calendarios" |
| `roles.churchDecisionRequired` | "Elige qué hacer con cada iglesia antes de confirmar"                    |
| `roles.churchTransferSelf`     | "No puedes trasladarla a sí misma"                                       |

Escritas primero en `es.ts`, traducidas de verdad en los otros cinco (Regla
2); el test de claves iguales (`create-i18n.test.ts`) las exige.

## 7. Decisiones de diseño

| Decisión                                                        | Elegida                                 | Alternativas descartadas                | Razón                                                                                                                 |
| --------------------------------------------------------------- | --------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Granularidad del traslado                                       | Iglesia entera                          | Por categoría (creyentes sí, listas no) | Deja referencias colgando sin FK que las proteja (D1)                                                                 |
| Dónde se detecta la falta de decisión                           | En el propio `DELETE`, con 409 y `data` | Endpoint `GET /impact` aparte           | Reutiliza el patrón ya existente de `ApiErrorBody.data`; una llamada menos                                            |
| Ficheros del origen al eliminar                                 | Se quedan en disco, huérfanos           | Borrarlos en el momento                 | Irreversible; ninguna otra baja de esta app toca disco hoy (D5)                                                       |
| `church_members` duplicados al trasladar                        | Se filtran antes de mover               | Capturar el choque de único después     | Ya hay un patrón hecho esta sesión para esto (`isUniqueViolation`); comprobar antes es más barato que fallar y releer |
| Limpiar `church_members` de cuentas no dueñas al darlas de baja | Sí, en el mismo cambio (D6)             | Dejarlo para otra entrega               | Es el mismo método, el mismo `id`, y es basura conocida desde ya                                                      |

## 8. Plan de pruebas

- **`apps/api`**: `church-transfer.service.test.ts` (impacto, traslado con y
  sin solape de miembros, eliminación, y que ninguna tabla del segundo grupo
  del §2 se toca porque no hace falta). `file-storage.service.test.ts`
  ampliado con `moveScope`. `user-admin.service.test.ts` ampliado: sin
  decisiones y con iglesias propias → `ConflictException` con `data`; con
  decisiones completas → borra. Doble de test para `dataSource.transaction`
  como ya hace `believer-notes.service.test.ts` (una función que ejecuta el
  callback directo, sin abrir una transacción de verdad).
- **e2e de la API**: de punta a punta contra Postgres — es la única forma de
  probar el choque real de `UQ_church_members` y que la transacción no deja
  la mitad de las tablas movidas si algo falla a mitad de camino.
- **`apps/web`**: `church-decision-row.test.tsx` (no deja confirmar sin
  elegir todas; no deja elegir la propia iglesia como destino).
- **e2e de web**: los dos casos de baja del paso 12 (§5).
- `pnpm check` y los dos `test:e2e` en verde antes de dar la entrega por
  hecha (Regla 4).

## 9. Preguntas abiertas

- [ ] ¿La iglesia que se elimina debería poder **recuperarse** desde algún
      sitio (una papelera), o el borrado lógico es suficiente porque nadie de
      la interfaz llega ahí de todas formas?
- [ ] Cuando alguien tiene **varias** iglesias propias, ¿tiene sentido ofrecer
      "trasladar todas a la misma" de un tirón, o siempre fila por fila?
- [ ] ¿Hace falta un script de limpieza de las carpetas huérfanas de D5, o se
      deja como deuda conocida hasta que haga falta de verdad?
- [ ] Exportar antes de eliminar (declarado fuera de alcance en §1): ¿lo pide
      alguien de verdad, o es prematuro sin un caso real todavía?
