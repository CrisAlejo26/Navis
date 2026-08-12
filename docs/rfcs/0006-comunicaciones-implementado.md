# RFC 0006: Comunicaciones (chat y avisos)

- **Estado**: Implementado en api y web (escritorio hereda de web). Móvil,
  pendiente — ver nota abajo.
- **Fecha**: 2026-08-03
- **Apps afectadas**: api / web / mobile / desktop
- **Depende de**: 0003 (creyentes), 0008 (iglesias como espacio de trabajo)

> El modelo de datos, la API y las decisiones de esta página son las que fijó
> [RFC 0016](./0016-chat-comunicaciones-plan.md) al implementarla: `kind`
> renombrado a `individual`/`grupo`/`aviso`, `churchId` en `Channel`, los
> cursores `archivedAt`/`clearedAt` por miembro y los adjuntos. Este documento
> queda actualizado con ese resultado; el detalle de por qué se decidió así
> vive en el plan.
>
> **Móvil se dejó fuera de esta entrega** a petición expresa: la pantalla
> puente de `app/communications.tsx` sigue en pie hasta que se implemente
> `app/communications/index.tsx` y `[channelId].tsx` con el mismo reparto que
> ya usa `believers` (§6 del plan). El `useChatSocket` de `packages/api-client`
> ya acepta `getCookie` para ese caso, así que móvil no necesita ningún cambio
> de arquitectura, solo escribir las pantallas.

## Problema

La coordinación de una iglesia vive en grupos de WhatsApp donde el aviso del
ensayo se pierde entre memes, no hay historial buscable y quien entra nuevo no
ve nada de lo anterior. Además, mezcla los datos de contacto de la congregación
con una plataforma que no controla nadie.

## Alcance

Entra: canales de conversación, mensajes directos y avisos de solo lectura,
dentro de la propia aplicación.

No entra: llamadas de voz o vídeo, y pasarelas a WhatsApp o SMS. La pasarela es
tentadora pero implica proveedores externos, costes por mensaje y consentimiento
para mensajería comercial: merece su propio documento.

## Modelo de datos

```
Channel
├── id: uuid
├── churchId → Church(id)        — alcance: cada iglesia ve solo lo suyo
├── kind: enum                  — individual | grupo | aviso
├── name: text | null           — null en «individual»: se pinta con el
│                                  nombre de la otra persona
├── description: text | null
├── photoKey: text | null       — foto de grupo (FileStorageService)
├── isArchived: boolean         — archivo GLOBAL, lo pone un moderador
├── createdBy → user(id)
└── ← ChannelMember[]  ← Message[]

ChannelMember
├── channelId → Channel(id)
├── userId → user(id)
├── role: enum                  — miembro | moderador
├── lastReadAt: timestamptz     — para el contador de no leídos
├── archivedAt: timestamptz | null   — archivo PERSONAL
├── clearedAt: timestamptz | null    — cursor de «limpiar», mismo patrón
│                                       que lastReadAt
└── mutedUntil: timestamptz | null

Message
├── id: uuid
├── channelId → Channel(id)
├── authorId → user(id)
├── body: text | null           — null si el mensaje es solo adjunto(s)
├── replyToId → Message(id) | null   — hilos ligeros, sin subcanales
├── forwardedFromId → Message(id) | null   — para la etiqueta «Reenviado»
├── editedAt / deletedAt: timestamptz | null
└── ← MessageAttachment[]  ← MessageReaction[]

MessageAttachment
├── id: uuid
├── messageId → Message(id)
├── kind: enum                  — imagen | archivo
├── storageKey: text
├── originalName: text
├── mimeType: text
└── sizeBytes: int

MessageReaction (messageId, userId, emoji)
UNIQUE (messageId, userId, emoji) — varias reacciones por persona, nunca la
                                     misma dos veces
```

`kind: aviso` es un canal donde solo escriben los moderadores. Es el caso más
frecuente —«el ensayo se mueve al jueves»— y en un grupo normal ese mensaje se
entierra en dos minutos.

`lastReadAt` por miembro, no un registro por mensaje leído: con mil mensajes y
cincuenta personas, lo segundo son cincuenta mil filas para mostrar un punto
rojo. `archivedAt` y `clearedAt` siguen el mismo patrón: archivar y limpiar son
por persona, no cambian lo que ve el resto.

## API

| Método | Ruta                                           | Rol mínimo        | Descripción                    |
| ------ | ---------------------------------------------- | ----------------- | ------------------------------ |
| GET    | `/api/v1/channels`                             | member            | Canales propios con no leídos  |
| POST   | `/api/v1/channels`                             | leader            | Crear canal                    |
| GET    | `/api/v1/channels/:id/messages?before=&limit=` | miembro           | Historial paginado hacia atrás |
| POST   | `/api/v1/channels/:id/messages`                | miembro           | Enviar                         |
| PATCH  | `/api/v1/messages/:id`                         | autor             | Editar                         |
| DELETE | `/api/v1/messages/:id`                         | autor o moderador | Borrado lógico                 |
| POST   | `/api/v1/channels/:id/read`                    | miembro           | Marcar como leído              |
| WS     | `/api/v1/ws`                                   | miembro           | Mensajes en tiempo real        |

## Tiempo real

WebSocket con `@nestjs/websockets`, autenticado con la **misma cookie de sesión**
de Better Auth: un segundo mecanismo de autenticación sería un segundo sitio
donde equivocarse.

El cliente no depende del socket para funcionar: si se cae, cae a sondeo cada 30
segundos. Un chat que deja de mostrar mensajes porque se perdió el socket es
peor que uno lento.

Escalar a varias instancias de la API exige un adaptador de Redis. Mientras el
despliegue sea de una sola instancia —que es el escenario objetivo—, no hace
falta, pero conviene no diseñar nada que lo impida.

## Interfaz

- **Web**: `/communications`, lista de canales a la izquierda y conversación a
  la derecha; en móvil, una vista cada vez.
- **Móvil**: dentro de «Más», con el mismo reparto que `believers`
  (`app/communications/index.tsx` y `[channelId].tsx`) — pendiente, ver la
  nota de estado arriba. Las notificaciones push quedan fuera de esta entrega
  en cualquier caso (RFC 0016 §1): la app se apoya en el WebSocket mientras
  está abierta y en el contador de no leídos al volver a abrirla.
- Textos nuevos bajo `communications.*` en los seis idiomas.

## Consideraciones

- **Privacidad**: los mensajes directos no los lee ningún admin. El borrado es
  lógico y el mensaje se muestra como «eliminado», sin desaparecer del hilo:
  borrarlo del todo cambia el sentido de una conversación ajena.
- **Offline**: se cachea el historial reciente. Los mensajes escritos sin
  conexión quedan en cola y se marcan como pendientes.
- **Notificaciones**: silenciar por canal es obligatorio desde el primer día. Un
  chat que no se puede silenciar se abandona. Las push quedan para una
  propuesta aparte (RFC 0016 §1); esta entrega solo tiene el WebSocket y el
  contador de no leídos.
- **IA**: resumir un canal muy activo. Más adelante y siempre bajo petición.

## Alternativas descartadas

- **Integrar Matrix o Rocket.Chat**: mucha más funcionalidad, pero otro servicio
  que desplegar y mantener, y una identidad separada de la de la aplicación.
- **Solo avisos, sin conversación**: más simple, pero la gente responde igual y
  acabaría respondiendo en WhatsApp, que es justo lo que se quiere evitar.

## Criterios de aceptación

- [x] Un mensaje llega a otro cliente conectado en menos de un segundo.
      Comprobado a mano con dos sesiones reales (RFC 0016 §11).
- [ ] Si el WebSocket se cae, los mensajes siguen llegando por sondeo.
      Implementado (`usePollFallback`, 30 s), sin comprobar a mano cortando la
      conexión.
- [x] En un canal de aviso, un miembro no puede escribir. Cubierto por
      `chat.e2e-spec.ts` y comprobado a mano.
- [x] Los no leídos se calculan con una sola consulta por usuario
      (`ChannelStatsService.unreadCounts`).
- [ ] Silenciar un canal deja de sonar en el propio dispositivo (las push no
      entran en esta entrega, ver arriba). Implementado, sin comprobar a mano.
- [x] Los textos están en los seis idiomas (`create-i18n.test.ts`).
