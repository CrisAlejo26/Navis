# Chat en Comunicaciones: plan de implementación

- **Tipo**: funcionalidad nueva y grande. Implementa y **amplía** RFC 0006
  (comunicaciones), que hoy es solo un documento — la pantalla de
  `/communications` sigue siendo el puente de `PlaceholderPage`.
- **Apps afectadas**: api / web / mobile / desktop (escritorio hereda de web).
- **Depende de**: RFC 0006 (comunicaciones), RFC 0008 (iglesias como espacio de
  trabajo, para el alcance por `church_id`), el sistema de permisos de
  `packages/shared` (ya implementado, no hay que tocarlo).

## 1. Objetivo y alcance

Sustituir el puente de comunicaciones por una mensajería real dentro de
Navis: conversaciones 1:1 y en grupo entre cuentas de la misma iglesia,
con historial persistente, adjuntos, reacciones, respuestas, reenvíos,
archivado y limpieza — para que la coordinación deje de vivir en un grupo de
WhatsApp que nadie controla (el problema que ya planteaba RFC 0006).

Entra, en esta entrega:

- Conversaciones **individuales** y **de grupo**, creadas por cualquier cuenta
  con acceso a Comunicaciones.
- Canales de **aviso** (solo lectura salvo para quien modera), que ya estaban
  en el RFC.
- Adjuntar **imágenes y archivos** (documentos), no solo texto.
- Historial completo y paginado, con reconexión y sondeo de respaldo si el
  socket se cae.
- **Reaccionar**, **responder** (citar un mensaje) y **reenviar** un mensaje a
  otra conversación.
- **Eliminar** un mensaje propio (borrado lógico, como ya definía el RFC).
- **Archivar** una conversación y **limpiar** su historial — las dos, por
  persona: archivar no la oculta para el resto, limpiar no borra lo que ven
  los demás.
- Web, escritorio (hereda la web) y móvil.

No entra — y por qué, con la misma disciplina de alcance que ya usa RFC 0006:

- **Notificaciones push.** El proyecto no tiene hoy ninguna integración de
  `expo-notifications` ni de push web (comprobado: cero referencias en
  `apps/mobile`). Añadirla es un proyecto en sí mismo — claves APNs/FCM,
  permisos del sistema, VAPID para la PWA — y esta entrega ya es grande. La
  app se apoya en el WebSocket mientras está abierta y en el contador de no
  leídos al volver a abrirla; el push queda para una propuesta aparte, como ya
  hizo RFC 0007 con la sincronización offline.
- **Llamadas de voz o vídeo, y pasarelas a WhatsApp/SMS.** Ya descartadas por
  el propio RFC 0006, y las razones siguen valiendo.
- **Mensajes de voz grabados en el chat.** El usuario ha pedido texto,
  imágenes y archivos; grabar audio es una ampliación natural de
  `common.audio.*` (ya existe para creyentes y sueños) pero no la ha pedido
  nadie todavía — se deja como una línea futura escrita en «Alternativas»,
  no como trabajo a medias en esta entrega.
- **Búsqueda de texto dentro del historial.** Con paginación por cursor no hay
  dónde enganchar un `LIKE` barato; un buscador de verdad pide un índice de
  texto completo (Postgres `tsvector`, y SQLite no lo tiene igual de fácil).
  Se deja anotado como ampliación futura.
- **Un servidor de licencia — Redis, réplicas.** RFC 0006 ya lo señala: mientras
  el despliegue objetivo sea una sola instancia de la API, un adaptador de
  Redis para Socket.IO no hace falta. Este plan no diseña nada que lo impida.

## 2. La pregunta del "creyente": quién entra a Comunicaciones

El encargo decía: _"el único que no va a tener usuario va a ser el
creyente… y con el que no estaría en la parte de comunicaciones"_. Antes de
diseñar nada hacía falta comprobar qué es el rol `creyente` en este
repositorio, porque hay dos cosas con ese nombre:

1. **La ficha de creyente** (`apps/api/src/believers/believer.entity.ts`):
   el registro pastoral de una persona de la congregación. Su columna
   `user_id` está «reservada para el día en que lo tenga… y hoy no lo usa
   nadie» — la mayoría de fichas no tienen ninguna cuenta detrás.
2. **El rol `creyente`** de Better Auth (`packages/shared/src/constants.ts`):
   el rol por defecto que se asigna a quien se registra, antes de que alguien
   le suba de nivel.

La ficha (1) nunca participa en el chat porque, salvo excepción, no tiene
cuenta con la que iniciar sesión — no hace falta ninguna regla nueva para
excluirla, ya está excluida por no existir como sesión.

El rol (2) sí puede tener cuenta y sesión, y aquí está el hallazgo que
resuelve el resto del diseño: **`ROLE_PERMISSIONS.creyente` es un array
vacío** (`packages/shared/src/role-permissions.ts:107`), con el comentario
_"Sin acceso al panel. Su cuenta existe para quedar enlazada a su ficha de
creyente."_ Ese rol no tiene `communications.view` — ni ningún otro permiso—,
así que **el sistema de permisos que ya existe cumple exactamente lo que se
ha pedido**, sin escribir un caso especial: basta con seguir el mismo patrón
que ya usan calendario, creyentes y listas —`@RequirePermissions('communications.view')`
en cada endpoint, `ActiveChurchGuard` para el alcance— y el rol `creyente`
queda fuera solo.

Esto también fija quién sale en el buscador de contactos para arrancar una
conversación: cuentas de la iglesia activa (`church_members`) cuyo rol tenga
`communications.view` concedido — se resuelve igual que ya lo hace
`PermissionsGuard`, con `RolesService.permissionsOf(slug)` y `hasPermission`
de `@navis/shared`, no con una comparación de texto contra la columna
`permissions` (que es JSON serializado a texto — Regla 10, nada de asumir su
forma sin pasarlo por la función que ya sabe leerlo).

## 3. Hallazgos de investigación

- **El propio RFC 0006 ya acierta en las dos decisiones que más suelen
  romperse a escala**: `lastReadAt` por miembro en vez de una fila de "leído"
  por mensaje y persona, y borrado lógico en vez de borrar la fila. La
  investigación en apps reales lo confirma como el patrón que escala: guardar
  «leído por cada uno» revienta en un grupo de cientos de personas, y la
  respuesta estándar es un cursor por miembro (`last_read_seq`), justo lo que
  ya proponía el RFC. Este plan añade dos cursores más del mismo tipo —
  `archivedAt` y `clearedAt` — en vez de tablas nuevas, por la misma razón.
- **Paginación por cursor, no por página**: el consenso (chats reales y
  literatura de sistemas) es indexar por `(channel_id, created_at)` y pedir
  "los N mensajes antes de X", nunca `LIMIT/OFFSET`. Es exactamente lo que ya
  especifica el RFC (`?before=&limit=`) y coincide con la trampa de este
  repositorio sobre `take`/`skip` con relaciones cargadas (CLAUDE.md): aquí no
  se puede caer en ella porque el cursor nunca pasa por ahí.
- **Archivar, limpiar y eliminar son tres acciones distintas**, y conviene no
  mezclarlas: _archivar_ saca la conversación de la lista sin tocar los
  mensajes ni para el otro lado; _limpiar_ vacía lo que yo veo sin borrar lo
  que ve el resto; _eliminar_ (un mensaje, no la conversación entera — no se
  ha pedido borrar una conversación para siempre) quita solo ese mensaje y dej
  a un hueco «Mensaje eliminado». El propio WhatsApp separa las tres así, y
  es el motivo por el que `archivedAt`/`clearedAt` son cursores **por
  miembro** y no una propiedad del canal.
- **Autenticación del WebSocket con la cookie de sesión**, tal y como
  planteaba el RFC, es el patrón recomendado en NestJS cuando la sesión ya es
  de servidor (evita el problema de los JWT de corta duración caducando a
  media conexión). La única pieza que faltaba investigar era **móvil**: no hay
  cookie de navegador (`apps/mobile/src/lib/api.ts` ya lo dice y adjunta la
  cookie a mano en cada petición REST). La solución no es un segundo mecanismo
  de autenticación — sería un segundo sitio donde equivocarse, justo lo que
  CLAUDE.md pide evitar — sino pasar esa misma cookie en el _handshake_ del
  socket (`auth: { cookie }` en el cliente) y que el gateway se la pase tal
  cual a `AuthService.getSession()`, la misma función que ya usa `SessionGuard`.
- **Diseño de la pantalla**: la lista de conversaciones a la izquierda y la
  conversación a la derecha (maestro-detalle) es del todo estándar en 2026,
  pero no hay ningún patrón de maestro-detalle en este repositorio hoy —
  `dream.tsx` usa `grid-cols-[...]` para otra cosa. Se diseña desde cero, con
  rutas anidadas de React Router (`/communications` y
  `/communications/:channelId`) y el mismo criterio de Regla 5 que ya usa
  `app-layout.tsx`: una vista cada vez por debajo de `md`, las dos a la vez
  por encima.

## 4. Modelo de datos

Amplía el modelo del RFC 0006. Los cambios respecto al original están
marcados; el resto se mantiene igual.

```
Channel
├── id: uuid
├── churchId → Church(id)        — NUEVO: sin esto, dos iglesias en el mismo
│                                   servidor verían los chats de la otra
├── kind: enum                   — individual | grupo | aviso
│                                   (RFC 0006 los llamaba directo|canal|anuncios;
│                                    se renombran para que digan lo que son —
│                                    ver Decisión D1)
├── name: text | null            — null en «individual»: se pinta con el
│                                   nombre de la otra persona, no se guarda
├── description: text | null
├── photoKey: text | null        — NUEVO: foto de grupo, mismo mecanismo que
│                                   la foto de un creyente (FileStorageService)
├── isArchived: boolean          — archivo GLOBAL: lo pone un moderador y
│                                   afecta a todo el mundo (D2)
├── createdBy → user(id)
└── ← ChannelMember[]  ← Message[]

ChannelMember
├── channelId → Channel(id)
├── userId → user(id)
├── role: enum                   — miembro | moderador
├── lastReadAt: timestamptz
├── archivedAt: timestamptz | null   — NUEVO: archivo PERSONAL (D2)
├── clearedAt: timestamptz | null    — NUEVO: cursor de «limpiar», mismo
│                                       patrón que lastReadAt (D3)
└── mutedUntil: timestamptz | null

Message
├── id: uuid
├── channelId → Channel(id)
├── authorId → user(id)
├── body: text | null            — null si el mensaje es solo adjunto(s)
├── replyToId → Message(id) | null
├── forwardedFromId → Message(id) | null   — NUEVO: para la etiqueta
│                                              «Reenviado» (D4)
├── editedAt / deletedAt: timestamptz | null
└── ← MessageAttachment[]  ← MessageReaction[]

MessageAttachment                — NUEVO respecto al RFC, que solo la nombraba
├── id: uuid
├── messageId → Message(id)
├── kind: enum                   — imagen | archivo
├── storageKey: text             — clave de FileStorageService (ámbito iglesia)
├── originalName: text           — el nombre real, para la descarga: el
│                                   servicio de ficheros nunca guarda el
│                                   nombre que manda el cliente (CLAUDE.md)
├── mimeType: text
└── sizeBytes: int

MessageReaction (messageId, userId, emoji)
UNIQUE (messageId, userId, emoji) — una persona puede dejar varios emoji
                                     distintos en el mismo mensaje (como
                                     Telegram/Slack), nunca el mismo dos veces
```

Migración con la `Table` API de TypeORM (como manda CLAUDE.md), probada en
SQLite y en Postgres. `Channel.churchId` lleva índice, igual que
`ChannelMember(channelId, userId)` único y `Message(channelId, createdAt)`
para el cursor.

## 5. Dirección de diseño

**Un elemento firma, no cinco.** El vocabulario náutico de Navis ya vive en
la interfaz — la `Sonda` de creyentes rellena una pista con
`transform: scaleX()` y cambia de tono sin depender solo del color
(`apps/web/src/components/believers/sonda.tsx`). El chat reutiliza esa misma
técnica, no la reinventa, para su propio elemento firma:

- **La estela**: en vez de los dos ganchitos grises/azules que copia todo el
  mundo, el estado de un mensaje propio es una línea corta bajo la hora —
  vacía al enviar, a la mitad al entregarse, llena y en `text-primary` al
  leerse — que se anima con `scaleX()`, igual que la Sonda. Es la única
  animación con personalidad de la pantalla; todo lo demás va en voz baja.
- **Los separadores de día** se leen como una entrada de cuaderno de
  bitácora: «— 10 de agosto —» en versalitas pequeñas y color
  `text-muted-foreground`, sin la píldora gris rellena que usa cualquier
  clon de WhatsApp. Es la pieza que se quita para dejar sitio a la estela
  (Regla 9 §4: una audacia, no dos).
- **El estado vacío** no lleva ilustración ni mascota: una línea horizontal
  fina (`border-border`), como un horizonte, y el texto invita a escribir a
  alguien — nada de «¡Empieza a chatear!» de relleno (Regla 9 §6).

**Sin tipografía nueva.** El proyecto no define ninguna familia propia hoy
(no hay `@font-face` ni `font-family` en `tokens.css` ni en `index.html`): el
chat no introduce una fuente de "app de mensajería" que desentonaría con el
resto de Navis. La jerarquía se construye con el tamaño y el peso que ya usa
la aplicación.

**Colores, solo tokens.** Los avatares con iniciales (para cuentas sin foto,
que serán la mayoría) no llevan un color aleatorio en hexadecimal: se
recorren cinco combinaciones ya existentes en el sistema de tokens —
`bg-primary/15 text-primary`, `bg-success/15 text-success`,
`bg-warning/15 text-warning`, `bg-accent text-accent-foreground`,
`bg-secondary text-secondary-foreground` — elegida de forma estable a partir
del id de usuario (mismo criterio que un «mapa de variantes», Regla 1 §3), no
de un valor nuevo. Las burbujas propias van en `bg-primary
text-primary-foreground`; las ajenas, en `bg-muted text-foreground` — nunca
un azul o un gris fijo, para que el contraste se mantenga solo al cambiar de
tema (Regla 3).

**Composición: maestro-detalle, con la jerarquía de Regla 5.** En escritorio,
dos columnas fijas; en móvil y tablet estrecho, una vista cada vez con
`Drawer` para el listado —el mismo componente que ya usa `app-layout.tsx`—.

```
Escritorio (≥ 768px)                            Móvil (< 768px)
┌────────────────────────────────────┐         ┌──────────────────────┐
│ Comunicaciones            [+ Nuevo] │         │ ← María José    ⋮   │
├───────────────┬──────────────────────┤         ├──────────────────────┤
│ 🔍 Buscar     │ María José Ruiz   ⋮  │         │    — 10 de agosto —  │
│               │ ──────────────────── │         │                       │
│ ● María José  │    — 10 de agosto —  │         │  ┌─────────────────┐ │
│   2 min       │                       │         │  │¿Confirmamos hora?│ │
│               │  ┌──────────────────┐ │         │  └─────────────────┘ │
│ Grupo Alabanza│  │¿Confirmamos hora?│ │         │             14:02 ▁  │
│   1 h         │  └──────────────────┘ │         │                       │
│               │              14:02 ▁  │         │ ┌──────────┐          │
│ Avisos        │                       │         │ │Sí, a las7│          │
│   ayer        │ ┌──────────┐          │         │ └──────────┘          │
│               │ │Sí, a las7│          │         │         14:05 ▔▔     │
│ [Archivados]  │ └──────────┘          │         │                       │
│               │         14:05 ▔▔     │         │ [📎] [Escribe…]  [➤] │
│               │                       │         └──────────────────────┘
│               │ [📎] [Escribe…]  [➤] │
└───────────────┴──────────────────────┘
```

(`▁` = estela vacía/a la mitad, `▔▔` = estela llena — el detalle real lo
decide el componente, esto es solo para fijar la idea.)

**Suelo de calidad, no negociable** (Regla 9 §5): objetivos táctiles de 44 px
en los botones de reacción/adjuntar/enviar (Regla 5 §4), foco visible en cada
mensaje y control, `prefers-reduced-motion` apaga la transición de la estela
(se muestra el estado final directamente, sin animar), y todo funciona a
375 px con el alemán activo — «Mensaje eliminado» es una de las cadenas que
más crece al traducir.

## 6. Arquitectura

### `packages/shared`

| Qué                                                                   | Dónde                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Esquemas de canal, miembro, mensaje, adjunto y reacción (zod)         | `src/schemas/chat-channels.ts`, `chat-messages.ts`                        |
| `FILE_EXTENSIONS`, `isFileMimeType`, `MAX_FILE_BYTES` (documentos)    | `src/schemas/chat-attachments.ts` (gemelo de `photos.ts`/`note-audio.ts`) |
| `MAX_GROUP_MEMBERS` y constantes de paginación (`MESSAGES_PAGE_SIZE`) | `src/constants.ts`                                                        |

Ningún permiso nuevo: `communications.view`/`communications.manage` ya
existen y ya están sembrados por rol (§2).

### `apps/api`

Módulo `chat/`, con la misma forma que `believers/`: entidades finas,
servicios por caso de uso, controlador delgado.

| Qué                                                                                       | Dónde                                                                                    |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Entidades (`Channel`, `ChannelMember`, `Message`, `MessageAttachment`, `MessageReaction`) | `src/chat/*.entity.ts`, listadas a mano en `data-source.ts`                              |
| Quién puede chatear con quién (§2)                                                        | `src/chat/chat-participants.service.ts`                                                  |
| Crear/listar/archivar/limpiar canales                                                     | `src/chat/channels.service.ts`                                                           |
| Enviar/editar/borrar/paginar mensajes                                                     | `src/chat/messages.service.ts`                                                           |
| Reaccionar                                                                                | `src/chat/message-reactions.service.ts`                                                  |
| Reenviar                                                                                  | `src/chat/message-forward.service.ts`                                                    |
| Adjuntos: gemelo de `AudioStorageService`/`ImageStorageService`                           | `src/media/document-storage.service.ts`                                                  |
| Controladores REST                                                                        | `src/chat/channels.controller.ts`, `messages.controller.ts`, `attachments.controller.ts` |
| Puerto de tiempo real (interfaz, sin depender de Socket.IO)                               | `src/chat/chat-broadcaster.ts` (interfaz `ChatBroadcaster` + token)                      |
| Adaptador real sobre Socket.IO                                                            | `src/chat/chat.gateway.ts`                                                               |
| Módulo                                                                                    | `src/chat/chat.module.ts`                                                                |

`ChatBroadcaster` es una **interfaz + token** (patrón ya usado por
`AiProvider`, Regla 1 §3): los servicios de mensajes llaman a
`this.broadcaster.messageCreated(...)` sin saber que hay un socket detrás.
La razón no es «por si algún día cambia de librería» —eso sería abstraer por
si acaso—, es que así `messages.service.test.ts` prueba la lógica de negocio
con un `ChatBroadcaster` falso, sin levantar Socket.IO, con el mismo criterio
de «inyecta en vez de mockear» que ya usa `createApiClient`.

El `ChatGateway` reutiliza la autenticación que ya existe: en
`handleConnection`, arma un objeto de cabeceras a partir de
`client.handshake.headers.cookie` (web/escritorio) o de
`client.handshake.auth.cookie` (móvil, que la manda a mano por no tener
cookies de navegador) y se lo pasa tal cual a `AuthService.getSession()` —
la misma función que usa `SessionGuard`. Cero mecanismos de autenticación
nuevos.

### `packages/api-client`

| Qué                                                      | Dónde                                                    |
| -------------------------------------------------------- | -------------------------------------------------------- |
| Listado de canales con no leídos, crear canal/grupo      | `src/chat-channel-hooks.ts`, `chat-channel-mutations.ts` |
| Historial paginado (`useInfiniteQuery`, cursor `before`) | `src/chat-message-hooks.ts`                              |
| Enviar/editar/borrar/reaccionar/responder/reenviar       | `src/chat-message-mutations.ts`                          |
| El socket: conectar, unirse a una sala, escuchar eventos | `src/chat-socket.ts`                                     |
| Subir un adjunto (multipart, con progreso)               | `src/chat-attachment-mutations.ts`                       |

La paginación del historial sigue el mismo criterio que ya fijó la bitácora
de creyentes (`useBelieverNotes`, con su comentario D11): un botón «Ver
mensajes anteriores» arriba del todo, no un `IntersectionObserver` que
dispare solo, porque eso también hay que poder activarlo con teclado. El
socket vive en un hook propio (`useChatSocket`) que se conecta una vez por
sesión de la pantalla de comunicaciones y cae a sondeo cada 30 s si se
desconecta, tal y como especifica el RFC.

### `apps/web`

| Qué                                                                   | Dónde                                                                                   |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Layout maestro-detalle, rutas anidadas                                | `routes/communications.tsx` (lista) + `routes/conversation.tsx` (detalle, `:channelId`) |
| Lista de conversaciones, con archivo                                  | `components/chat/channel-list.tsx`, `channel-row.tsx`                                   |
| Cabecera de conversación                                              | `components/chat/conversation-header.tsx`                                               |
| Historial + separadores de día                                        | `components/chat/message-list.tsx`, `day-divider.tsx`                                   |
| Burbuja de mensaje, con reacciones/responder/reenviar/eliminar (menú) | `components/chat/message-bubble.tsx`, `message-menu.tsx`                                |
| La estela (elemento firma)                                            | `components/chat/message-status.tsx`                                                    |
| Compositor: texto + adjuntar + vista previa antes de enviar           | `components/chat/composer.tsx`, `composer-attachment.tsx`                               |
| Picker de contactos/creación de grupo                                 | `components/chat/new-conversation-dialog.tsx`                                           |
| Selector de emoji para reaccionar (acotado, sin librería completa)    | `components/chat/reaction-picker.tsx`                                                   |
| Avatar con iniciales y variante de color estable                      | `components/chat/avatar.tsx`                                                            |

Elimina `communications` de `PUENTES` en `lib/placeholders.ts` y su entrada
del `NavKey` de `routes/placeholder.tsx`.

### `apps/mobile`

`app/communications.tsx` (un solo fichero hoy) pasa a ser una carpeta, con el
mismo criterio de expo-router que ya usan `believers`:

| Qué                                         | Dónde                                                                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Lista de conversaciones                     | `app/communications/index.tsx`                                                                                               |
| Conversación                                | `app/communications/[channelId].tsx`                                                                                         |
| Compositor dentro de `KeyboardAvoidingView` | `src/components/chat/composer.tsx` (Regla 5 §5)                                                                              |
| El resto de componentes                     | Mismo reparto que en web, JSX propio (Regla 1 §2.3): hook y tipo compartidos vía `api-client`, la vista se escribe dos veces |

`app/(tabs)/more.tsx` no cambia de estructura: comunicaciones sigue dentro de
«Más», como ya fija Regla 5 §2.

## 7. Adjuntos

Reutiliza `FileStorageService` con el mismo criterio que audios y fotos
(CLAUDE.md, «Los audios se guardan por ámbito»): `churchScope(churchId)`,
porque un adjunto de chat es de la iglesia y no de una persona — igual que
las notas.

- **Imágenes**: `ImageStorageService`, que ya existe, sin tocarlo.
- **Archivos**: `DocumentStorageService` nuevo, gemelo de
  `AudioStorageService`/`ImageStorageService` sobre el mismo
  `FileStorageService` — el «mapa de variantes» de la Regla 1 aplicado a
  servicios en vez de a componentes. Con lista blanca de extensiones (PDF,
  Word, Excel, PowerPoint, texto plano, ZIP) y tope de 25 MB — más que una
  imagen porque un documento pesa más, menos que un vídeo porque esto no es
  para vídeo (pregunta abierta, §11).
- **Subida**: `POST /channels/:id/attachments`, `multipart/form-data`, mismo
  patrón de `FileInterceptor` que `NoteAudiosController`.
- **Descarga**: `GET /attachments/:id`, `StreamableFile` con
  `Cache-Control: private, max-age=31536000, immutable` — el contenido de un
  adjunto no cambia nunca una vez subido, igual que un audio.
- **El nombre del fichero lo pone el servidor**; el nombre que ve quien
  descarga es `originalName`, guardado aparte en `MessageAttachment` (§4).

## 8. Tiempo real

Sigue el diseño del RFC 0006 sin cambios de fondo, con dos precisiones:

- El `ChatGateway` **no** vive bajo `/api/v1`: el _handshake_ de Socket.IO es
  una petición HTTP aparte que no pasa por el enrutador de Nest ni por su
  versionado por URI, así que forzarlo ahí sería replicar a mano lo que
  `enableVersioning` ya hace para las rutas REST, sin ganar nada. El cliente
  se conecta contra el mismo origen que `VITE_API_URL`/`EXPO_PUBLIC_API_URL`,
  con la ruta por defecto de Socket.IO.
- Cada conexión se une (`socket.join`) a una sala por `channelId`, solo para
  los canales de los que la cuenta es miembro **en ese momento** —
  comprobado contra la base de datos al unirse, no confiando en lo que
  mande el cliente. Si a alguien lo echan de un grupo, el servidor lo saca de
  la sala explícitamente.
- Eventos: `message:new`, `message:updated` (edición o borrado lógico),
  `message:reaction`, `channel:read` (para el contador de no leídos de los
  demás dispositivos) y `channel:typing` (opcional, con un plan explícito
  para que un evento perdido no deje el «escribiendo…» pegado: expira solo a
  los 5 s si no llega el siguiente).

## 9. Pasos ordenados

0. **Actualizar RFC 0006** con el modelo final (§4) y el estado a
   `Aceptado`: la RFC sigue siendo la referencia que enlaza `PUENTES`, y este
   plan la corrige en varios puntos (kinds renombrados, cursores nuevos) — no
   tiene sentido implementar contra un documento que ya sabemos que va a
   cambiar.
1. `packages/shared`: esquemas, permisos (ya existen, solo se referencian) y
   constantes de adjuntos.
2. `apps/api`: entidades + migración, probada en SQLite y Postgres (Regla 4).
3. `apps/api`: `chat-participants.service.ts` — la consulta de «con quién
   puedo hablar» es la base de todo lo demás, y ya resuelve la pregunta del
   §2.
4. `apps/api`: `channels.service.ts` + controlador — crear individual/grupo,
   listar con no leídos, archivar/desarchivar, limpiar. Tests unitarios.
5. `apps/api`: `messages.service.ts` + controlador — enviar, paginar,
   editar/borrar, responder. Tests unitarios, incluido el borrado lógico
   («Mensaje eliminado» sin desaparecer del hilo, como pide el RFC).
6. `apps/api`: reacciones y reenvío, sobre lo anterior.
7. `apps/api`: `DocumentStorageService` + controlador de adjuntos, calcado de
   `NoteAudiosController`.
8. `apps/api`: `ChatBroadcaster` (interfaz) + `ChatGateway` (Socket.IO) +
   autenticación por cookie (§6, §8).
9. `packages/api-client`: hooks y mutaciones, con el socket detrás de
   `useChatSocket` y sondeo de respaldo.
10. `apps/web`: `components/ui` que falten (picker de emoji, si no vale
    reutilizar `combobox.tsx`), después la lista de conversaciones, después
    la conversación, después el compositor y los adjuntos, después el picker
    de contactos/grupo. Retirar el puente de `PUENTES`.
11. `apps/mobile`: mismas pantallas, JSX propio, dentro de `KeyboardAvoidingView`.
12. i18n: las claves del §10, en los seis idiomas.
13. e2e de web (§11) y comprobación visual en los dos temas, tres anchos y
    con el alemán activo (Reglas 2, 3 y 5).

## 10. i18n

Sección nueva `communications.*` (sustituye a la única clave `nav.communications`
que ya existe, que no cambia). Claves nuevas y el valor en español:

| Clave                                | es                                    |
| ------------------------------------ | ------------------------------------- |
| `communications.newConversation`     | Nueva conversación                    |
| `communications.newGroup`            | Nuevo grupo                           |
| `communications.searchContacts`      | Buscar en la iglesia                  |
| `communications.noConversations`     | Todavía no hay ninguna conversación   |
| `communications.startOne`            | Escribe a alguien de tu iglesia       |
| `communications.archived`            | Archivados                            |
| `communications.archive`             | Archivar                              |
| `communications.unarchive`           | Desarchivar                           |
| `communications.clearHistory`        | Limpiar historial                     |
| `communications.clearHistoryConfirm` | Se borrarán los mensajes solo para ti |
| `communications.deleteMessage`       | Eliminar mensaje                      |
| `communications.deletedMessage`      | Mensaje eliminado                     |
| `communications.reply`               | Responder                             |
| `communications.forward`             | Reenviar                              |
| `communications.forwardTo`           | Reenviar a…                           |
| `communications.forwarded`           | Reenviado                             |
| `communications.react`               | Reaccionar                            |
| `communications.typing`              | Escribiendo…                          |
| `communications.attachFile`          | Adjuntar un archivo                   |
| `communications.attachImage`         | Adjuntar una imagen                   |
| `communications.messagePlaceholder`  | Escribe un mensaje                    |
| `communications.groupName`           | Nombre del grupo                      |
| `communications.groupMembers`        | Miembros                              |
| `communications.leaveGroup`          | Salir del grupo                       |
| `communications.mute`                | Silenciar                             |
| `communications.unmute`              | Quitar el silencio                    |
| `communications.readAt`              | Visto {{time}}                        |
| `communications.deliveredAt`         | Entregado                             |
| `communications.offlineQueued`       | Se enviará al recuperar conexión      |

Escritas primero en `es.ts`, traducidas de verdad en los otros cinco (Regla 2) — el alemán es el que hay que vigilar en el compositor y en la fila de
conversación, que son los sitios donde menos aire sobra.

## 11. Plan de pruebas

- **`apps/api`**: un test por servicio (`channels.service.test.ts`,
  `messages.service.test.ts`, `message-reactions.service.test.ts`,
  `message-forward.service.test.ts`, `chat-participants.service.test.ts`),
  con `DB_DRIVER=sqlite` como el resto de unitarios. Casos: el rol `creyente`
  no aparece en `eligibleFor`; un miembro no puede escribir en un canal de
  `aviso`; borrar deja «Mensaje eliminado» sin quitar la fila; archivar no
  afecta al otro miembro; limpiar no borra mensajes para el resto; reenviar
  copia el contenido y marca `forwardedFromId`.
- **e2e de la API** (`chat.e2e-spec.ts`): dos cuentas de la misma iglesia
  intercambian mensajes por REST; un tercero de otra iglesia no puede entrar
  al canal (alcance, RFC 0008 §6.2); subir un adjunto y descargarlo. Contra
  Postgres, como manda Regla 4.
- **`packages/api-client`**: `chat-message-hooks.test.ts` para la paginación
  por cursor (imita el patrón de `calendar-cache.test.ts`).
- **`apps/web`**: `message-bubble.test.tsx` (roles y etiquetas accesibles,
  Regla 4 §4), `channel-list.test.tsx` (no leídos, orden, archivado).
- **e2e de web** (`comunicaciones.spec.ts`, Chromium y Pixel 7): crear una
  conversación, enviar un mensaje y verlo llegar por WebSocket a una segunda
  sesión (dos contextos de Playwright con dos cuentas); apagar el socket a
  mano y comprobar que el sondeo lo sustituye; archivar y comprobar que
  desaparece de la lista; el rol `creyente` no ve `/communications` en la
  navegación.
- `pnpm check` y `pnpm test:e2e` en verde antes de dar el módulo por hecho
  (Regla 4).

## 12. Decisiones de diseño

| Decisión                              | Elegida                                                                             | Alternativas descartadas                                           | Razón                                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| D1. Nombres de `kind`                 | `individual` \| `grupo` \| `aviso`                                                  | Mantener `directo`/`canal`/`anuncios` del RFC                      | Dicen lo que son en el idioma del proyecto; `canal` sonaba a Slack y confundía con «grupo»                                  |
| D2. Archivar                          | Cursor `archivedAt` por miembro, además del `isArchived` global del canal           | Solo el global del RFC                                             | Archivar en WhatsApp es personal; el global sigue existiendo para que un moderador retire un canal muerto para todos        |
| D3. Limpiar historial                 | Cursor `clearedAt` por miembro (como `lastReadAt`)                                  | Borrar filas de `Message` para ese usuario; una tabla de «ocultos» | Cero filas nuevas por mensaje, mismo patrón ya validado por `lastReadAt`, y no toca lo que ven los demás                    |
| D4. Reenviar                          | Mensaje nuevo con `forwardedFromId`, cuerpo y adjuntos copiados                     | Referenciar el mensaje original sin copiar                         | Si el original se borra o el canal de origen deja de ser visible, el reenviado debe seguir leyéndose                        |
| D5. Quién crea un grupo               | Cualquier cuenta con `communications.view`                                          | Solo quien tenga `communications.manage`                           | Es como funciona un grupo de verdad; `manage` queda para lo que de verdad pide más confianza: canales de aviso y moderación |
| D6. Autenticación del socket en móvil | Cookie pasada en `handshake.auth.cookie`, verificada con `AuthService.getSession()` | Un JWT de corta duración propio para el socket                     | Cero mecanismos nuevos; reutiliza exactamente lo que ya valida cada petición REST del móvil                                 |
| D7. Reacciones                        | Varias por persona y mensaje, una por emoji (`UNIQUE(messageId,userId,emoji)`)      | Una sola reacción por persona (se sustituye al cambiar)            | Telegram y Slack permiten varias; restringir a una es más trabajo (hay que borrar la anterior) para menos expresividad      |

## 13. Preguntas abiertas

- [imagenes y texto o cualquier archivo, que la otra persona pueda ver y descargar] **Tope de archivo y tipos permitidos**: se propone 25 MB y una lista
  blanca de ofimática/ZIP (§7). ¿Hace falta admitir vídeo o algo más
  pesado desde el principio, o se deja para cuando alguien lo pida?
- [100] **Tamaño máximo de un grupo**: no hay tope técnico (el cursor por
  miembro escala), pero conviene decidir un límite de producto —¿50?
  ¿100?— antes de que alguien intente meter a toda la iglesia en uno.
- [superadmin o pastor] **Quién puede archivar un canal para todos** (`isArchived` global,
  D2): ¿solo `communications.manage`, o también el creador del grupo
  aunque no tenga ese permiso?
- [esta perfecto] **Notificaciones dentro de la app** cuando llega un mensaje y
  Comunicaciones no está abierta (un globo en el icono de navegación,
  por ejemplo): entra en el alcance de esta entrega o se deja para
  cuando se aborde el push del §1.
