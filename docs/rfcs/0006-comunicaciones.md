# RFC 0006: Comunicaciones (chat y avisos)

- **Estado**: Borrador
- **Fecha**: 2026-08-03
- **Apps afectadas**: api / web / mobile / desktop
- **Depende de**: 0003 (creyentes)

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
├── name: text
├── kind: enum                  — canal | directo | anuncios
├── description: text | null
├── isArchived: boolean
├── createdBy → user(id)
└── ← ChannelMember[]  ← Message[]

ChannelMember
├── channelId → Channel(id)
├── userId → user(id)
├── role: enum                  — miembro | moderador
├── lastReadAt: timestamptz     — para el contador de no leídos
└── mutedUntil: timestamptz | null

Message
├── id: uuid
├── channelId → Channel(id)
├── authorId → user(id)
├── body: text
├── replyToId → Message(id) | null   — hilos ligeros, sin subcanales
├── editedAt / deletedAt: timestamptz | null
└── ← MessageAttachment[]  ← MessageReaction[]

MessageReaction (messageId, userId, emoji)
```

`kind: anuncios` es un canal donde solo escriben los moderadores. Es el caso más
frecuente —«el ensayo se mueve al jueves»— y en un grupo normal ese mensaje se
entierra en dos minutos.

`lastReadAt` por miembro, no un registro por mensaje leído: con mil mensajes y
cincuenta personas, lo segundo son cincuenta mil filas para mostrar un punto
rojo.

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
- **Móvil**: dentro de «Más» (`app/communications.tsx`), con notificaciones push
  vía `expo-notifications`.
- Textos nuevos bajo `communications.*` en los seis idiomas.

## Consideraciones

- **Privacidad**: los mensajes directos no los lee ningún admin. El borrado es
  lógico y el mensaje se muestra como «eliminado», sin desaparecer del hilo:
  borrarlo del todo cambia el sentido de una conversación ajena.
- **Offline**: se cachea el historial reciente. Los mensajes escritos sin
  conexión quedan en cola y se marcan como pendientes.
- **Notificaciones**: silenciar por canal es obligatorio desde el primer día. Un
  chat que no se puede silenciar se abandona.
- **IA**: resumir un canal muy activo. Más adelante y siempre bajo petición.

## Alternativas descartadas

- **Integrar Matrix o Rocket.Chat**: mucha más funcionalidad, pero otro servicio
  que desplegar y mantener, y una identidad separada de la de la aplicación.
- **Solo avisos, sin conversación**: más simple, pero la gente responde igual y
  acabaría respondiendo en WhatsApp, que es justo lo que se quiere evitar.

## Criterios de aceptación

- [ ] Un mensaje llega a otro cliente conectado en menos de un segundo.
- [ ] Si el WebSocket se cae, los mensajes siguen llegando por sondeo.
- [ ] En un canal de anuncios, un miembro no puede escribir.
- [ ] Los no leídos se calculan con una sola consulta por usuario.
- [ ] Silenciar un canal deja de enviar notificaciones push.
- [ ] Los textos están en los seis idiomas.
