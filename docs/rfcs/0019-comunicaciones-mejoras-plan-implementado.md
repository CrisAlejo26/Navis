# Comunicaciones: menú por chat, emoji, exportar y compositor a todo lo ancho

> **Estado**: Implementado · **Fecha**: 2026-08-11 · **Slug**: `comunicaciones-mejoras`

- **Tipo**: mejoras sobre RFC 0016 (ya implementado en `main`). No reabre su
  modelo de datos ni su arquitectura — todo lo de aquí se resuelve
  reutilizando lo que ya existe en `apps/web/src/components/chat/`.
- **Apps afectadas**: web. Escritorio hereda la web. Móvil queda fuera de esta
  entrega (decisión explícita, ver §1).
- **Depende de**: RFC 0016 (chat de Comunicaciones), RFC 0009/0017 (el
  escritor de ZIP sin comprimir de `lib/export/zip.ts`, que se reutiliza tal
  cual).

## 1. Objetivo y alcance

El usuario, viendo `/communications` en producción, pide cuatro cosas:

1. Un menú por conversación en la **lista**, como el de WhatsApp al mantener
   pulsado un chat — hoy solo existe dentro de la conversación abierta
   (`ConversationHeader` → `MessageMenu`), no sobre la fila de la lista.
2. Más emoji en el compositor, "la misma cantidad que WhatsApp" — hoy el único
   selector de emoji es `ReactionPicker`, acotado a 7 a propósito (§6 del RFC 0016) y solo para reaccionar a un mensaje, no para escribirlos en el texto.
3. El campo de texto del compositor a todo el ancho — hoy se queda angosto.
4. Exportar una conversación, o varias, para guardarlas o compartirlas — no
   existe ninguna vía hoy.

Y de propina: revisar qué otra funcionalidad típica de un chat falta y
aplicar criterio sobre qué encaja en Navis.

**Entra:**

- Menú por fila en `ChannelList`, con las mismas acciones que ya existen
  (silenciar, archivar, limpiar historial, salir del grupo) — cero backend
  nuevo, es la misma mutación que ya usa `ConversationHeader`.
- Selector de emoji para **escribir**, con un catálogo comparable al de
  WhatsApp (categorías, buscador, recientes), independiente del
  `ReactionPicker` que ya existe (ese se queda igual: sigue acotado a
  propósito para reaccionar).
- Arreglar el ancho del compositor.
- Exportar una conversación a `.txt` (mismo formato que usa el propio
  WhatsApp: remitente, hora y texto) y exportar varias de una vez en un
  `.zip` con un `.txt` por conversación — reutilizando el escritor de ZIP sin
  comprimir que ya existe en `lib/export/zip.ts` (RFC 0009/0017), no una
  librería nueva.
- **Formato en el texto**: negrita, cursiva, tachado y monoespaciado, con la
  misma sintaxis que ya usa WhatsApp (`*negrita*`, `_cursiva_`, `~tachado~`,
  `` `código` ``) para que quien ya la conoce la use sin pensar. Y **color de
  texto**, que WhatsApp no tiene — se resuelve reutilizando los cinco tokens
  semánticos que RFC 0016 §5 ya usa para el avatar (`primary`, `success`,
  `warning`, `destructive`, `accent`), nunca un color libre (Regla 3: un
  hexadecimal a mano rompería el contraste en alguno de los dos temas). Todo
  se guarda dentro del mismo `body` de texto que ya existe — cero columnas
  nuevas, cero cambio de esquema.
- Revisión visual general de la pantalla (Regla 9): la fila de conversación y
  la burbuja llevan ya bastante trabajo hecho; se pule lo que quede genérico
  al paso, no se rehace desde cero.

**No entra, y por qué:**

- **Fijar una conversación arriba (`pinnedAt`) y marcar como no leída a
  mano.** Las dos son típicas de WhatsApp, pero las dos piden una columna
  nueva en `ChannelMember` (migración en los dos motores) más su endpoint:
  no son un ajuste de interfaz, son una ampliación del modelo del RFC 0016.
  Se dejan anotadas para una entrega aparte, con su propia migración, en vez
  de colarlas sin el mismo cuidado con que se diseñó `archivedAt`/`clearedAt`.
- **Eliminar una conversación entera.** El propio RFC 0016 ya lo descartó a
  propósito («no se ha pedido borrar una conversación para siempre», §3): solo
  se borra un mensaje. Este plan no lo reabre.
- **Reenviar mensaje.** Ya está implementado (`ForwardMessageDialog`, acción
  "Reenviar a…" en `MessageMenu`) — el usuario lo pedía como ejemplo de lo que
  podía faltar, y no falta.
- **App móvil.** El pedido llegaba sobre la web en producción. Móvil usa un
  mecanismo de descarga distinto (sin `URL.createObjectURL`, con
  `expo-file-system`/`expo-sharing`) y ampliaría bastante el trabajo; queda
  como seguimiento aparte, decidido explícitamente y no por omisión.

## 2. Referencias

- **WhatsApp, menú al mantener pulsado un chat**: fijar, silenciar, archivar,
  eliminar y "más" (ver contacto, atajo, bloqueo). Se toma silenciar/archivar
  (ya existen); se descarta eliminar (fuera de alcance del RFC 0016) y fijar
  (necesita modelo nuevo, ver §1).
- **WhatsApp, exportar chat**: un `.txt` por conversación, remitente + hora +
  texto, sin adjuntos por defecto, una conversación cada vez. Se toma el
  formato de texto; se añade la variante "varias a la vez" porque aquí ya
  existe el mecanismo de ZIP (RFC 0017) y es una línea de código extra, no un
  sistema nuevo.
- **`unicode-emoji-json`** (paquete de datos, MIT, sin UI, 1914 emoji en 9
  categorías: `Smileys & Emotion`, `People & Body`, `Animals & Nature`,
  `Food & Drink`, `Travel & Places`, `Activities`, `Objects`, `Symbols`,
  `Flags`): se usa como fuente de datos; la interfaz del selector es propia de
  Navis, con los tokens de tema — no se importa un componente de picker ya
  hecho (Regla 9: nada de plantilla ajena pegada tal cual).
- **RFC 0017 (`journal-markdown.ts`, `zip.ts`)**: el patrón "una entidad → un
  fichero de texto; varias → un `.zip` con el mismo escritor sin comprimir"
  ya está resuelto y probado; exportar chats es el mismo patrón sobre otro
  contenido.
- **Formato de texto de WhatsApp**: `*negrita*`, `_cursiva_`, `~tachado~`,
  ` ```monoespaciado``` ` (WhatsApp usa tres comillas invertidas; aquí basta
  con una, no hay bloques de código de varias líneas que desambiguar). Se
  toma la sintaxis tal cual porque es la que la congregación ya conoce de
  fuera; el color de texto no tiene equivalente en WhatsApp, así que su
  sintaxis (§4) es propia de Navis y solo se genera desde la barra del
  compositor, nunca hace falta escribirla a mano.

## 3. Dirección de diseño

Nada de esto introduce un elemento firma nuevo: usa el vocabulario que RFC
0016 §5 ya fijó (la estela, los separadores en versalitas, los tokens de
color). El selector de emoji, el menú de fila y la barra de formato son
controles, no protagonistas — van en `bg-popover`/`border` como el resto de
menús de la pantalla (`MessageMenu`, `ReactionPicker`), para que se lean como
parte del mismo sistema y no como un plugin insertado.

**El color de texto, acotado a los mismos cinco tokens del avatar** —
`text-primary`, `text-success`, `text-warning`, `text-destructive`,
`text-accent-foreground` — y no a una rueda de color libre: así un mensaje en
"éxito" se sigue leyendo en los dos temas sin que quien escribe tenga que
pensar en contraste, y la paleta del chat no se dispara a docenas de tonos
sueltos (Regla 3, Regla 9 §4).

## 4. Arquitectura

Todo en `apps/web`, sin tocar `apps/api` ni `packages/shared` salvo por las
claves de i18n:

| Qué                                                                              | Dónde                                                 |
| -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Menú de fila (reutiliza `MessageMenu`)                                           | `components/chat/channel-row.tsx`                     |
| Datos de emoji agrupados desde `unicode-emoji-json`                              | `lib/chat/emoji-data.ts`                              |
| Selector de emoji del compositor (categorías, buscador, recientes)               | `components/chat/emoji-picker.tsx`                    |
| Recientes en `localStorage`, mismo criterio que el tema/idioma                   | `lib/chat/emoji-recent.ts`                            |
| Compositor: ancho completo + botón de emoji                                      | `components/chat/composer.tsx`                        |
| Transcripción de una conversación a texto plano                                  | `lib/export/chat-transcript.ts`                       |
| Descarga de una o varias (reutiliza `zip.ts`, `downloadFile`)                    | `lib/export/chat-export.ts`                           |
| Selección múltiple en la lista + barra de exportar                               | `components/chat/channel-list.tsx`, `channel-row.tsx` |
| Parser del `body` a segmentos con formato (negrita/cursiva/tachado/código/color) | `lib/chat/message-format.ts`                          |
| Barra de formato del compositor (envuelve la selección del `Textarea`)           | `components/chat/format-toolbar.tsx`                  |
| Entradas nuevas de i18n                                                          | `packages/i18n/src/locales/*.ts`                      |

`chat-transcript.ts` recorre el historial completo con la misma paginación por
cursor que ya usa `useMessages` (`messagesPath`, `nextMessagesCursor` de
`@navis/api-client`), pero en un bucle plano — no como hook de React, porque
exportar no es una consulta que la pantalla observe, es una acción puntual.

`message-format.ts` es texto puro: un tokenizador de una pasada, sin
librería de Markdown completa (aquí no hace falta listas, enlaces ni
encabezados, y traerla sería resolver un problema que no existe — Regla 1
§4). El texto en la transcripción exportada (`chat-transcript.ts`) usa el
`body` **tal cual**, marcadores incluidos: es texto plano y el propio
WhatsApp exporta igual, sin resolver el formato.

## 5. Pasos ordenados

1. `pnpm --filter @navis/web add unicode-emoji-json` y `lib/chat/emoji-data.ts`
   (agrupar por categoría, exponer búsqueda por nombre).
2. `emoji-picker.tsx` + `emoji-recent.ts`, enganchado al compositor: botón
   junto a adjuntar, inserta en la posición del cursor del `Textarea`.
3. Arreglar el ancho del compositor (contenedor `flex-1 min-w-0` alrededor
   del `Textarea`).
4. `channel-row.tsx`: añadir `MessageMenu` a la fila con las acciones que ya
   expone `ConversationHeader` (silenciar, archivar, limpiar, salir), sin
   navegar al hacer clic en el menú.
5. `lib/export/chat-transcript.ts` + `lib/export/chat-export.ts`: exportar
   una conversación (`.txt`) desde el menú de fila y desde
   `ConversationHeader`.
6. Selección múltiple en `ChannelList` (botón "Seleccionar", checkboxes,
   barra inferior con "Exportar (n)" → `.zip`).
7. `lib/chat/message-format.ts` + `format-toolbar.tsx`: negrita, cursiva,
   tachado, código y los cinco colores de token, aplicados a la selección del
   `Textarea`; `MessageBubble` renderiza el `body` a través del mismo parser
   en vez de un `<p>` plano.
8. i18n: claves nuevas en los seis locales.
9. Repaso visual (Regla 9): que el menú de fila, el picker de emoji y la
   barra de formato no introduzcan un segundo elemento "audaz" — van en voz
   baja, como el resto de controles de la pantalla.
10. `pnpm check`; comprobación manual en los dos temas, tres anchos y con el
    alemán activo.

## 6. Interfaz

- **Web**: sin rutas nuevas — todo vive dentro de `routes/communications.tsx`
  y `routes/conversation.tsx`, que ya existen (RFC 0016).
- **Móvil**: no entra en esta entrega (§1).
- Animaciones: el popover de emoji entra con la misma transición que ya usan
  `MessageMenu`/`ReactionPicker` (`animate-page-in`, opacidad + escala
  pequeña) — se reutiliza la clase existente, no se inventa una nueva. El
  menú de fila se revela con el mismo `opacity-0 group-hover:opacity-100` que
  ya usa `MessageMenu`, pero además **siempre visible por debajo de `md`**:
  en un teléfono no hay hover, y hoy los tres puntos de mensaje tampoco se ven
  ahí — se corrige en los dos sitios de una vez (`message-menu.tsx` es
  compartido). `prefers-reduced-motion` ya lo respeta `animate-page-in`
  (Regla 9 §5): nada que añadir.
- Textos nuevos, sección `communications.*` (valor en español):

  | Clave                                | es                                  |
  | ------------------------------------ | ----------------------------------- |
  | `communications.exportChat`          | Exportar conversación               |
  | `communications.exportAttachment`    | Adjunto: {{name}}                   |
  | `communications.selectConversation`  | Seleccionar {{name}}                |
  | `communications.selectChats`         | Seleccionar                         |
  | `communications.cancelSelection`     | Cancelar selección                  |
  | `communications.emojiPicker`         | Emoji                               |
  | `communications.searchEmoji`         | Buscar un emoji                     |
  | `communications.recentEmoji`         | Usados recientemente                |
  | `communications.noEmojiResults`      | Ningún emoji con ese nombre         |
  | `communications.emojiCategories.*`   | 9 claves, una por categoría Unicode |
  | `communications.formatBold`          | Negrita                             |
  | `communications.formatItalic`        | Cursiva                             |
  | `communications.formatStrikethrough` | Tachado                             |
  | `communications.formatCode`          | Monoespaciado                       |
  | `communications.formatColor`         | Color del texto                     |
  | `communications.formatting`          | Formato                             |
  | `communications.colorNames.*`        | 5 claves, una por token de color    |

  «Exportar (n)» y «n seleccionados» de la barra de selección **no** son
  claves nuevas: reutilizan `export.selected`/`export.selectedAction`, que ya
  existían para el mismo patrón en el cuaderno (RFC 0017) — el mismo criterio
  de reutilización del punto 2. `SelectionBar` subió de `components/journal/`
  a `components/ui/` en el mismo cambio, y `useSelection` de
  `lib/journal/` a `lib/`, por la misma razón.

  Escritas primero en `es.ts`, traducidas de verdad en los otros cinco.

## 7. Consideraciones

- **Privacidad**: exportar produce un fichero con el contenido íntegro de la
  conversación en el dispositivo de quien exporta — mismo nivel de acceso que
  ya tiene al leerla en pantalla, no se abre nada nuevo.
- **Offline**: la exportación pide el historial completo por HTTP; sin
  conexión, falla como cualquier otra consulta de la pantalla (no hay caso
  especial que resolver).
- **IA**: no aplica.

## 8. Alternativas descartadas

| Alternativa                                          | Por qué no                                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Importar un componente de selector de emoji ya hecho | Regla 9: se leería como plantilla ajena; el catálogo (`unicode-emoji-json`) sí se reutiliza, la UI no |
| Exportar a PDF                                       | El propio WhatsApp exporta a texto plano; un PDF de una conversación larga no aporta sobre el `.txt`  |
| Colar `pinnedAt`/marcar-no-leído en esta pasada      | Piden migración nueva; se documentan como fuera de alcance en vez de improvisar el modelo (§1)        |

## 9. Plan de pruebas

- `channel-row.test.tsx`: el menú aparece, cada acción llama a la mutación
  correspondiente sin navegar a la conversación.
- `lib/chat/emoji-data.test.ts`: agrupa por categoría, la búsqueda encuentra
  por nombre parcial.
- `lib/export/chat-transcript.test.ts`: recorre varias páginas simuladas,
  formatea remitente/hora/texto, marca adjuntos y mensajes eliminados.
- `lib/chat/message-format.test.ts`: cada marcador por separado, combinados
  (negrita **dentro** de un color), un marcador sin cerrar (se pinta como
  texto plano, no revienta), y un mensaje sin ningún marcador.
- Comprobación manual: exportar una conversación y abrir el `.txt`; exportar
  dos y abrir el `.zip`; el compositor a todo lo ancho en 375 px y en
  escritorio; el picker de emoji con el teclado (foco, `Escape` cierra); la
  barra de formato envolviendo texto seleccionado y sin selección; los seis
  idiomas en el picker, el menú de fila y la barra de formato.
- `pnpm check` en verde antes de dar el trabajo por hecho.

## Criterios de aceptación

- [x] La lista de conversaciones tiene un menú por fila con silenciar,
      archivar, limpiar historial y salir del grupo (si aplica), sin abrir la
      conversación.
- [x] El compositor ocupa todo el ancho disponible en cualquier tamaño de
      pantalla.
- [x] Hay un selector de emoji para escribir, con categorías, buscador y
      recientes, comparable en variedad al de WhatsApp.
- [x] Se puede exportar una conversación a `.txt` y varias a la vez en un
      `.zip`, desde la lista y desde la conversación abierta.
- [x] Un mensaje admite negrita, cursiva, tachado, monoespaciado y uno de los
      cinco colores de token, aplicados desde una barra en el compositor.
- [x] Los seis idiomas cubren las claves nuevas y `pnpm check` pasa en verde.
