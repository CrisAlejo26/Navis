# RFC 0005: Sueños personales

- **Estado**: **Implementado** (API y web). Reescrito el 2026-08-05 sobre el
  borrador del 3 de agosto, que proponía otra cosa: una lista cronológica con
  nube de símbolos y sin ninguna métrica.
- **Fecha**: 2026-08-03 · reescrito e implementado el 2026-08-05
- **Apps afectadas**: **api y web** (escritorio la hereda: es la misma web
  dentro de Tauri). Móvil, no: ver «Fuera de alcance».
- **Depende de**: 0004 en lo de fondo —es de una persona, no de una iglesia— y
  0003 en lo práctico: los audios de las notas ya existen y se reaprovechan.

## Problema

Un sueño se olvida en minutos. Quien lleva un registro quiere apuntarlo nada
más despertarse, con el mínimo número de toques, y poder releerlo después: qué
emociones se repiten, en qué noches se sueña más, qué se acabó cumpliendo y qué
significó al final.

El registro en papel se pierde y no se puede mirar hacia atrás. Una nota en el
teléfono se puede escribir, pero no responde a ninguna de esas preguntas.

## Alcance

Entra:

- Apuntar un sueño con su noche, su título, su cuerpo, sus emociones y sus
  audios, con **solo el cuerpo obligatorio**.
- Un vocabulario de emociones: doce del sistema y las que cada cual añada.
- La posible interpretación, que se escribe después y se cambia las veces que
  haga falta.
- Marcar un sueño como cumplido: cuándo se cumplió y qué significó.
- Adjuntar audios o grabarlos ahí mismo, como en las notas de creyentes.
- Una portada con métricas, un listado filtrable y una ficha.
- Los textos, en los seis idiomas.

### Fuera de alcance

- **Interpretar automáticamente.** Ni ahora ni con IA más adelante sin decirlo
  en un RFC propio. El sistema organiza y devuelve lo que ya se escribió;
  interpretar es de la persona. Esto es lo único de este documento que no se
  negocia por comodidad.
- **La app móvil.** Igual que en las RFC 0002 (§8.7), 0003 (§7.9) y 0004: la
  forma se decide en web, que es donde se ve entera, y se lleva después. La
  pena aquí es real —lo natural es apuntar el sueño desde la cama— y por eso la
  web se hace usable a 375 px con la mano (Regla 5), no como consuelo sino como
  requisito.
- **Los símbolos** («agua», «puerta», «águila») que proponía el borrador. Las
  emociones cubren hoy el papel de vocabulario compartido y son lo que se pidió;
  dos vocabularios a la vez es el doble de interfaz para el mismo gesto. Vuelven
  cuando haya algo que los aproveche de verdad, que es la búsqueda de patrones.
- **Escribir sin conexión con sincronización.** El borrador lo daba por
  requisito. En el proyecto no hay hoy ninguna cola de sincronización, y montar
  una para un módulo es una RFC entera (la 0007 va de eso). Lo que sí hay es una
  PWA que carga sin red; escribir exige red y se dice en la interfaz.
- **Cifrado en reposo.** Ver «Preguntas abiertas». No se promete lo que no se
  va a hacer en esta entrega.
- **Compartir un sueño con alguien.** Todo esto es privado por definición.

## Vocabulario

| Palabra            | Qué es                                                             |
| ------------------ | ------------------------------------------------------------------ |
| **Sueño**          | Lo que se soñó una noche, tal y como se recuerda                   |
| **La noche**       | `dreamedAt`: la noche en que se soñó, no el día en que se escribió |
| **Emoción**        | Una entrada del vocabulario: «paz», «ansiedad», y las propias      |
| **Interpretación** | Lo que se cree que quiere decir. Se escribe después y cambia       |
| **Cumplido**       | El sueño pasó. Lleva fecha y lo que significó                      |
| **Apuntado**       | Escrito y sin interpretar todavía                                  |
| **En estudio**     | Tiene interpretación y aún no se ha cumplido                       |

Los tres últimos son **estados derivados**, no una columna (D8).

## Decisiones tomadas

- **D1 — Un sueño es de un usuario, no de una iglesia.** Igual que la profecía
  del RFC 0004 (D1), y por el mismo motivo: lo que se sueña es de quien lo
  sueña. No hay `church_id`, ni `ActiveChurchGuard`, ni permisos de rol. La
  única barrera es el filtro por dueño, y vive en `DreamsRepository`, que lo
  **exige en todos sus métodos**: si mañana alguien añade un endpoint, no tiene
  forma de saltárselo por descuido. El test que hay que copiar es el e2e de
  profecías que intenta leer la de otro.

- **D2 — Se retiran los permisos `dreams.*`.** Hoy `apps/web/src/lib/nav.ts:73`
  cuelga la entrada de un `permission: 'dreams.view'`, y en
  `packages/shared/src/role-permissions.ts` hay permisos de sueños repartidos
  por roles de iglesia. Con D1 eso es un error con consecuencias: un rol sin ese
  permiso se quedaría sin ver **sus propios** sueños, y un administrador
  esperaría poder ver los de los demás y no va a poder. Se quitan en la misma
  entrega, como se hizo con `prophecies.*` (RFC 0004 D2). La entrada del menú no
  lleva permiso: la ve todo el mundo, y cada cual ve los suyos.

- **D3 — Las emociones son una tabla, no un enum ni texto libre.** El borrador
  las tenía como un `mood` de cinco valores y uno solo por sueño. Se quedan
  cortas por los dos lados: se sienten varias a la vez, y el valor de esto está
  justamente en ver que «ansiedad» sale en once sueños y qué se escribió cada
  vez. Con texto libre, «Ansiedad» y «ansiedad» serían dos cosas y no habría
  nada que contar.

- **D4 — Las doce del sistema se guardan por `slug`, sin texto.** Es la
  decisión que salva la Regla 2. Si la migración siembra «persecución» como
  texto, quien use la aplicación en alemán ve «persecución», y no hay arreglo
  posterior que no sea una tabla de traducciones. Así que la fila del sistema
  guarda `slug = 'persecucion'` y **no guarda nombre**; la interfaz la traduce
  con `t('dreams.emotions.persecucion')` en los seis idiomas. Las propias
  guardan el texto que escribió su dueño, en su idioma, y se enseñan tal cual:
  son suyas y nadie más las va a leer.

- **D5 — La migración que siembra las doce las escribe literalmente.** No
  importa una constante de `@navis/shared`. Esto es una trampa ya documentada en
  `CLAUDE.md`: `CreateRoles` siembra a partir de `ROLES`, y al cambiar esa
  constante cambió lo que crea en una base **nueva** pero no en las que ya
  existían, obligando a que cada migración siguiente valiera para los dos casos.
  Doce filas escritas a mano en la migración están congeladas para siempre, que
  es lo que se quiere de una migración.

- **D6 — Las del sistema no se editan ni se borran; las propias sí.** Se
  distinguen por `owner_id IS NULL`, sin columna `is_system`: una sola fuente de
  verdad. El servicio comprueba el dueño antes de tocar nada y devuelve 403 si
  se intenta con una del sistema. Borrar una propia **no borra los sueños**:
  desaparece de la unión y el sueño se queda con las demás.

- **D7 — El color de una emoción sale de `ACCENT_PALETTE`, que ya existe.**
  Dieciséis tonos separados en el círculo y de luminosidad media, elegidos en el
  RFC 0002 justamente para leerse en claro y en oscuro sin dos valores por
  color (`packages/shared/src/schemas/congregations.ts`). Se reutiliza tal cual,
  con `accentSchema` para validarlo. Cada emoción del sistema nace con el suyo;
  al crear una propia se elige de la misma paleta. Esto no es un adorno: es lo
  que hace que **el color entre por el dato** y no por la decoración (§7.1).

- **D8 — No hay columna de estado. Se deriva.** `fulfilledAt` no nulo es
  «cumplido»; con interpretación y sin cumplir, «en estudio»; sin nada,
  «apuntado». Igual que en el RFC 0004 (D3): dos fuentes de verdad para el
  mismo hecho acaban discrepando, y la que discrepa siempre es la columna.

- **D9 — El cumplimiento es un par de campos, no una tabla hija.** Aquí se
  separa de profecías a propósito: una profecía se cumple a trozos y por eso
  tiene `prophecy_fulfillments`; un sueño pasó o no pasó. Dos columnas
  —`fulfilled_at` y `fulfillment_meaning`— y se acabó. Montar una tabla hija
  «por simetría» sería abstraer por si acaso (Regla 1 §4).

- **D10 — Dos áreas de texto, no tres.** El plan traía «descripción», «posible
  interpretación» e «interpretación final». La tercera se cae y su sitio lo
  ocupa lo que se escribe **al marcar el sueño como cumplido**: qué significó.
  Es la misma frase, pero con fecha y en el momento en que se sabe. Tres cajas
  grandes en un formulario, dos de ellas casi iguales, es la forma segura de que
  nadie rellene ninguna.

- **D11 — Las fechas son `date`, no `timestamptz`.** Una noche es un día, no un
  instante, y no cambia porque se viaje (RFC 0004 D5). Con esto vienen dos
  trampas ya documentadas y ya resueltas: una columna `date` vuelve de Postgres
  como `Date` a medianoche **local**, así que se convierte con
  `apps/api/src/database/iso-day.ts` y en ningún otro sitio; y restar fechas no
  se escribe igual en los dos motores, para lo que está `database/date-sql.ts`.

- **D12 — `fulfilledAt` no puede ser anterior a `dreamedAt`.** Se comprueba en
  el servicio, que es quien tiene la fila delante: al editar puede llegar solo
  una de las dos fechas y el esquema de `shared` no tendría con qué comparar. Un
  sueño cumplido antes de soñarse rompe cualquier métrica que se calcule después.

  **Lo que no se comprueba es que la fecha no esté en el futuro**, y es
  deliberado: «hoy» depende de la zona de quien escribe, y el servidor solo sabe
  la suya. Rechazar por eso convertiría un desfase de husos en un error de
  validación incomprensible. Profecías tomó la misma decisión (RFC 0004 §7.7):
  una fecha rara es asunto de quien la escribe.

- **D13 — Los audios se reaprovechan, y para eso hay que generalizar el
  almacén.** `AudioStorageService` guarda hoy en `<uploads>/<churchId>/<id>.ext`
  y los sueños no tienen iglesia (D1). Pasa a recibir un **ámbito**:
  `churches/<id>` para lo que es de una iglesia y `users/<id>` para lo que es de
  una persona. El servicio sale de `believers/` a `media/`, y con él la
  comprobación de que la ruta no se escapa de la carpeta. La tabla es propia
  (`dream_audios`), espejo de `note_audios`.

  Esto se salta la letra de la Regla 1 §5 —«a la segunda se mira, a la tercera
  se extrae»— y es a conciencia: no son dos cosas que se parecen, es la misma
  cosa. Duplicarla significa dos listas de tipos MIME aceptados, dos topes de
  tamaño y dos sitios donde arreglar el día que uno falle. En web pasa lo mismo
  con `use-recorder.ts` y `audio-field.tsx`: se mueven a un sitio compartido y
  los usan los dos módulos.

- **D14 — El día de la semana se calcula en JS, no en SQL.** `EXTRACT(DOW)` de
  Postgres y `strftime('%w')` de SQLite no se escriben igual y la API corre
  sobre los dos motores. Como el listado de días viene ya acotado por fecha, se
  agrupa en el servicio sobre el día ISO que devuelve `iso-day.ts`. Menos SQL,
  ninguna diferencia entre motores y un test que no necesita base de datos.

- **D15 — Las estadísticas van en un endpoint propio**, `/dreams/stats`, y no
  colgando del listado (RFC 0004 D14): son dos consultas con vidas distintas y
  dos claves de caché distintas. La portada pide estadísticas; el listado, la
  página que toque.

- **D16 — Portada, listado y ficha son tres rutas.** Como en profecías (D9). La
  portada se entra y **se sale hacia algún sitio**: cada tarjeta y cada celda
  abre el listado con su filtro puesto en la URL. Una portada que no lleva a
  ninguna parte es un cuadro de mandos, y esto es un cuaderno.

- **D17 — El formulario de apuntar es corto.** Noche, título opcional, cuerpo y,
  si se quiere, emociones y un audio. **La interpretación y el cumplimiento no
  están ahí**: se escriben desde la ficha, que es cuando se sabe algo. El sueño
  se apunta a las cuatro de la mañana y a esa hora nadie rellena seis campos.
  Solo el cuerpo es obligatorio.

- **D18 — recharts sale de la carpeta de profecías.** Hoy vive detrás de una
  sola puerta en `components/prophecies/charts/` y la portada lo carga con
  `React.lazy`: son ~370 kB en su propio trozo. Se mueve a
  `components/charts/`, se queda igual de perezoso y lo importan los dos. Si
  sueños lo importara desde otro sitio, o se duplica el trozo o se cuela en el
  bundle inicial.

- **D19 — Elemento firma: la franja de noches** (§7.4). Una rejilla de las
  últimas doce semanas, una celda por noche, teñida según cuánto se soñó. Es lo
  que se recuerda de la pantalla, responde de una sola pieza a «por semana» y
  «por noche», y en color pleno **es** el bloque que rompe el blanco.

- **D20 — Una audacia por pantalla** (Regla 9 §4). En la portada, la franja. En
  el listado, la columna de emociones. En la ficha, la cabecera teñida. Lo demás
  acompaña en voz baja: la firma solo se ve si el resto se calla.

### Preguntas abiertas

- **¿Cifrado en reposo?** El borrador lo prometía. Hacerlo de verdad —cifrado
  con clave derivada de quien entra, sin que el servidor pueda leer— cambia el
  modelo entero: no se puede buscar por texto ni agrupar por emoción en SQL. Lo
  que sí se hace ya: no sale del servidor, no hay acceso de administrador y no
  se manda a ninguna IA. Se decide cuando exista la RFC 0007.
- **¿Archivar un sueño?** El borrador tenía un estado `archivado`. Con borrado
  lógico y un filtro por año no se ha echado de menos en profecías. Se deja
  fuera y se mira cuando alguien tenga trescientos.
- **¿Enlazar un sueño con una profecía?** Se sueña algo y se cumple lo
  prometido: la relación existe en la cabeza de quien lo vive. Nadie lo ha
  pedido y ata dos módulos que hoy no se conocen. No en esta entrega.

## Modelo de datos

### 5.1 `dreams`

| Columna               | Tipo            | Notas                                            |
| --------------------- | --------------- | ------------------------------------------------ |
| `id`                  | uuid            | `BaseEntity`                                     |
| `owner_id`            | uuid, índice    | → `user(id)`. **No hay `church_id`** (D1)        |
| `title`               | text, nullable  | Opcional: a las cuatro de la mañana no se titula |
| `body`                | text            | Lo único obligatorio (D17)                       |
| `dreamed_at`          | date, índice    | La noche (D11)                                   |
| `interpretation`      | text, nullable  | La posible interpretación                        |
| `fulfilled_at`        | date, nullable  | No nulo ⇒ cumplido (D8, D12)                     |
| `fulfillment_meaning` | text, nullable  | Qué significó, al cerrarlo (D10)                 |
| `created_at`          | timestamp       | `BaseEntity`                                     |
| `updated_at`          | timestamp       | `BaseEntity`                                     |
| `deleted_at`          | timestamp, null | Borrado lógico                                   |

Índice compuesto `(owner_id, dreamed_at DESC)`: es la consulta de siempre.

### 5.2 `emotions` — el vocabulario

| Columna    | Tipo           | Notas                                                    |
| ---------- | -------------- | -------------------------------------------------------- |
| `id`       | uuid           |                                                          |
| `owner_id` | uuid, nullable | **Nulo ⇒ es del sistema** (D6). Con índice               |
| `slug`     | text, nullable | Solo las del sistema. Es lo que traduce la interfaz (D4) |
| `name`     | text, nullable | Solo las propias. El texto de su dueño, tal cual         |
| `accent`   | text           | Token o `#rrggbb`, validado con `accentSchema` (D7)      |
| `position` | int            | Orden de las del sistema; las propias, alfabéticas       |

Únicos: `slug` cuando no es nulo; `(owner_id, name)` cuando no lo son. Las doce
del sistema, sembradas literalmente por la migración (D5):

| `slug`         | Acento    | `slug`        | Acento    |
| -------------- | --------- | ------------- | --------- |
| `felicidad`    | `#ca8a04` | `curiosidad`  | `#9333ea` |
| `alegria`      | `#ea580c` | `confusion`   | `#6d28d9` |
| `tranquilidad` | `#0d9488` | `ansiedad`    | `#db2777` |
| `paz`          | `#16a34a` | `tristeza`    | `#4f46e5` |
| `esperanza`    | `#0284c7` | `miedo`       | `#57534e` |
| `libertad`     | `#0891b2` | `persecucion` | `#dc2626` |

### 5.3 `dream_emotions` — la unión

`(dream_id, emotion_id)`, clave primaria compuesta, `ON DELETE CASCADE` por los
dos lados. Es el patrón que ya usa `believer_gifts`.

### 5.4 `dream_audios`

Espejo de `note_audios` (RFC 0003) cambiando `note_id` por `dream_id` y
`church_id` por nada: el dueño se alcanza por el sueño. Guarda `storage_key`,
`mime_type`, `size_bytes`, `duration_seconds` y `recorded`. **El fichero no está
en la base de datos**: vive bajo `UPLOADS_PATH`, ahora en `users/<ownerId>/`
(D13), y por eso no entra en un volcado de Postgres —esa carpeta va aparte en
las copias de seguridad—.

### 5.5 Lo que se comparte

En `packages/shared/src/schemas/dreams.ts`: `dreamSchema`, `dreamListItemSchema`
(con `excerpt` del cuerpo, no el cuerpo), `emotionSchema`, `dreamStatsSchema` y
los esquemas de creación y edición. Y en `dream-state.ts`, la función que deriva
el estado (D8), con sus tests: es lógica de negocio, la usan API y web, y no
depende de ninguna de las dos.

## API

Todas bajo `/api/v1`, todas con sesión y **todas filtradas por dueño** (D1).

| Método | Ruta                   | Descripción                                          |
| ------ | ---------------------- | ---------------------------------------------------- |
| GET    | `/dreams`              | Listado paginado con filtros                         |
| POST   | `/dreams`              | Crear. Solo `body` obligatorio                       |
| GET    | `/dreams/stats`        | Lo que pinta la portada (D15)                        |
| GET    | `/dreams/:id`          | La ficha, con emociones y audios                     |
| PATCH  | `/dreams/:id`          | Editar, incluida la interpretación y el cumplimiento |
| DELETE | `/dreams/:id`          | Borrado lógico                                       |
| GET    | `/dreams/emotions`     | El vocabulario: las del sistema y las propias, con   |
|        |                        | cuántas veces se ha usado cada una                   |
| POST   | `/dreams/emotions`     | Crear una propia (nombre y acento)                   |
| PATCH  | `/dreams/emotions/:id` | Editar una propia. 403 si es del sistema (D6)        |
| DELETE | `/dreams/emotions/:id` | Borrar una propia. 403 si es del sistema             |
| POST   | `/dreams/:id/audios`   | Subir o grabar                                       |
| GET    | `/audios/dreams/:id`   | Descargar. `StreamableFile`, nunca `@Res` con pipe   |
| DELETE | `/dreams/audios/:id`   | Borrar ficha y fichero                               |

### 6.1 `GET /dreams` — la consulta

`?q=&emotion=&state=&from=&to=&year=&sort=&order=&page=&perPage=`

- `q` busca en título, cuerpo e interpretación, **en el servidor**: el listado
  se pagina y buscar en el cliente solo buscaría en la página que se está
  mirando (RFC 0004 D13).
- `emotion` acepta varias, y suma (un sueño con cualquiera de ellas).
- `state` es `apuntado | estudio | cumplido`, resuelto sobre las columnas (D8).
- Paginado: con relaciones cargadas, `take`/`skip` de TypeORM se van a una
  subconsulta con `DISTINCT` y Postgres exige entonces que todo lo ordenado esté
  en la lista de selección. Se consulta la tabla sola con `limit`/`offset` y las
  emociones y los audios se piden aparte con los identificadores de la página.

### 6.2 `GET /dreams/stats`

Lo justo para la portada, en una llamada:

```
total                 — todos los sueños apuntados
thisMonth             — los de este mes
thisWeek              — los de esta semana (empieza el lunes)
fulfilled             — los cumplidos
nights[]              — { day, count } de los últimos 84 días: la franja (D19)
weeks[]               — { weekStart, count } de las últimas 12 semanas
byWeekday[]           — { weekday, count }, calculado en JS (D14)
byEmotion[]           — { emotionId, slug, name, accent, count }, de más a menos
streak                — noches seguidas con algo apuntado
```

`nights` y `weeks` salen de la misma consulta: las semanas son la suma de sus
noches, y devolverlas ya sumadas evita que el cliente haga cuentas con fechas,
que es donde se cuelan los errores de huso (D11).

### 6.3 Errores

`404` si el sueño no existe **o no es tuyo**: da igual cuál de las dos, y la
respuesta no distingue —decir «existe pero no es tuyo» ya es contar algo—.
`403` al tocar una emoción del sistema. `400` con las fechas de D12.

## Interfaz

### 7.1 El color, que es lo que hoy falla

En la portada de profecías las seis tarjetas son `bg-card` con degradados al
8-10 % (`stat-card.tsx:51`). Sobre fondo claro eso es blanco, y el diagnóstico
es correcto: el único color de la pantalla son el botón y el anillo. Aquí no se
repite, y estas son las reglas que lo evitan:

1. **El color entra por el dato, nunca como decoración.** Tiñe una emoción, una
   intensidad o un estado. Un degradado que no significa nada es relleno
   (Regla 9 §2).
2. **Una tarjeta rellena por rejilla, no seis.** Seis rectángulos azules con un
   número blanco es _el_ cuadro de mandos de plantilla. La rellena es el ancla:
   `bg-primary` con `text-primary-foreground`.
3. **Por debajo del 12 % de tinte no cuenta como color.** O el acento se ve, o
   no se pone: `bg-primary/12` en la pastilla del icono, el número en
   `text-primary`, un filo de 3 px con el color del estado.
4. **El lienzo se queda neutro.** El fondo de la página no se tiñe: lo que se
   tiñe son los objetos. Un fondo de color y encima tarjetas blancas deja el
   mismo problema una capa más abajo.
5. **Cada bloque de color lleva su pareja `-foreground`.** `bg-primary` con
   `text-primary-foreground`, siempre juntos (Regla 3 §2).
6. **Y se mira en los dos temas.** `bg-muted` sobre `bg-card` se distingue en
   claro y puede no distinguirse en oscuro.

Nada de esto se escribe a ojo: todo sale de tokens o de `ACCENT_PALETTE` (D7).

### 7.2 Las rutas

| Ruta           | Qué es                                   |
| -------------- | ---------------------------------------- |
| `/dreams`      | La portada, con las métricas y la franja |
| `/dreams/list` | El listado, con sus filtros en la URL    |
| `/dreams/:id`  | La ficha de un sueño                     |

`/dreams/list` se declara **antes** que `/dreams/:id`, o «list» se lee como un
identificador. Ya pasó con profecías y está anotado en `router.tsx:213`.

### 7.3 La portada — `/dreams`

De arriba abajo:

1. **Cabecera**: título, una frase con lo que hay —«38 sueños · 5 este mes · 12
   cumplidos»— y el botón de apuntar, tamaño `lg` (48 px), que es la acción
   principal y se pulsa de pie (Regla 5 §4).
2. **La franja de noches** (§7.4). A todo el ancho y nada más entrar.
3. **La rejilla**, `sm:grid-cols-2 xl:grid-cols-3`:
   - **Total**, rellena en `bg-primary` con su llamada «Ver mis sueños» y la
     flecha que avanza al pasar por encima. Es el ancla (§7.1.2).
   - **Este mes**, con la línea de los últimos doce meses debajo.
   - **Esta semana**, con las siete noches en pequeño.
   - **Cumplidos**, en acento `success`, y debajo el último que se cumplió.
   - **El reloj de la semana** (ancha): siete radios, uno por día, largo según
     cuánto se sueña ese día. Un `RadialBarChart`, no barras: profecías ya tiene
     barras mensuales y esto tiene que verse distinto de un vistazo (D20).
   - **El mapa de emociones** (ancha): una sola barra apilada con el color de
     cada emoción y su nombre debajo, de más a menos. Es donde la pantalla tiene
     más color, y es color con significado. Cada tramo abre el listado filtrado
     por esa emoción.
4. **Con cero sueños no se enseñan seis tarjetas a cero**: se enseña una
   invitación con el botón dentro (Regla 9 §6), como hace la portada de
   profecías.

### 7.4 La franja de noches (D19)

Doce columnas —una por semana— de siete celdas. Cada celda es una noche, teñida
en `primary` por la cantidad: sin nada, `bg-muted`; una, al 35 %; dos, al 65 %;
tres o más, plena. Debajo de cada columna, una barra fina con el total de esa
semana, que es la métrica semanal pedida sin gráfico aparte.

- Cada celda es un enlace al listado de esa noche, con `aria-label` completo:
  «Martes 3 de junio, 2 sueños». La intensidad **no informa sola** (Regla 3 §7).
- La noche de hoy va marcada con un filo, como el día de hoy en el calendario.
- Entra en cascada por columnas, `40 ms` de diferencia entre una y la siguiente:
  se lee como el tiempo pasando. Y un elemento admite **una** `animation`, así
  que si una celda tiene que entrar y además destacar, son dos capas anidadas.
- A 375 px caben doce columnas de celdas de 14 px con su hueco. Si no cupieran,
  se recorta a ocho semanas; **no** se hace scroll horizontal de la página.

### 7.5 El listado — `/dreams/list`

Se reutiliza `DataTable` (tabla en `md` y arriba, fichas debajo), `useTableQuery`
para los filtros en la URL y el patrón de barra de filtros de creyentes y
profecías. Lo propio de sueños:

- **La columna de emociones es el acento del listado** (D20): pastillas
  pequeñas con el color de cada una. Es lo que hace que la lista no sea gris.
- La fecha de la noche en grande a la izquierda, con el día de la semana encima
  en pequeño: se busca por «aquella noche», no por el título.
- El estado, pastilla con icono **y** texto (Regla 3 §7).
- Quien tiene audio lo dice con un icono, y se puede oír sin abrir la ficha.
- La fila lleva un `excerpt`, no el cuerpo. **Desde la fila no se edita el
  texto**: se abre la ficha, que lo pide entero. Editar lo que se ha truncado
  recorta sin avisar, y eso ya está escrito en `CLAUDE.md`.

### 7.6 La ficha — `/dreams/:id`

- **Cabecera a sangre** teñida con el color de las emociones del sueño: uno
  solo, degradado entre dos si hay varias, `bg-muted` si no hay ninguna. Con
  la fecha de la noche en grande y el texto en su `-foreground`. Es lo que hace
  que dos sueños no se parezcan al abrirlos.
- **El cuerpo en `max-w-prose`**, tamaño de lectura de verdad, no de tabla.
- **Las emociones**, pastillas que llevan al listado filtrado por cada una.
- **La interpretación**, en su bloque, con su fondo `bg-muted` y su título. Si
  está vacía, una invitación a escribirla, no un hueco.
- **Los audios**, con el reproductor que ya existe.
- **El cumplimiento**: mientras no lo está, la acción principal es «Marcar como
  cumplido», que abre la fecha ahí mismo proponiendo hoy y el área de texto de
  qué significó (D10). Una vez cumplido, ese bloque pasa a ser lo primero que se
  lee bajo la cabecera, en acento `success`.
- Entra en cascada: cabecera, cuerpo, emociones, interpretación, cumplimiento.

### 7.7 Los formularios

- **Apuntar** (D17): la noche —propuesta como hoy, y como **ayer si son antes de
  las seis de la mañana**, que es cuando de verdad se escribe—, título opcional,
  cuerpo grande y con el foco puesto al abrir, emociones y audio. Nada más.
- **Editar**: lo mismo más la interpretación.
- Dentro de un `<dialog>` modal el foco lo reparte el navegador al abrirlo y
  `autoFocus` no vale: `Input` y `Textarea` declaran `ref` como una prop más
  (React 19) y se usa esa.
- El formulario **nace con los datos puestos**, montándose con `key` cuando ya
  están (`ProphecyForm` → `ProphecyFormBody`). Copiar props a estado dentro de
  un efecto es un error de lint, y además un `refetch` pisaría lo que se está
  escribiendo.
- **Gestionar las emociones** es un panel aparte dentro del propio selector:
  las doce del sistema se enseñan y no se tocan; debajo, las propias, con su
  lápiz y su papelera y el selector de color de la paleta.

### 7.8 Movimiento

Se reutiliza lo que ya hay en `global.css` —`page-in`, `rise-in`, `track-in`,
`ring-in`— y se añade solo lo de la franja. Con tres condiciones: solo se anima
`opacity` y `transform` (el compositor no sabe resolver `width`), se respeta
`prefers-reduced-motion`, y ninguna entrada pasa de ~400 ms en total. Una
cascada larga no es elegante: es esperar.

## Criterios de aceptación

- [ ] Un sueño se guarda solo con el cuerpo, sin más campos obligatorios.
- [ ] La noche se propone en ayer si se escribe antes de las seis.
- [ ] Se eligen varias emociones a la vez, y se puede crear, editar y borrar las
      propias; las doce del sistema no se dejan tocar (403).
- [ ] Las doce salen traducidas en los seis idiomas; las propias, tal y como se
      escribieron.
- [ ] Se adjunta un audio y se graba uno, y se oyen desde la ficha y el listado.
- [ ] Al marcar cumplido se piden fecha y significado, y no se acepta una fecha
      anterior a la noche del sueño.
- [ ] La portada enseña total, este mes, esta semana, cumplidos, la franja de
      noches, el reparto por día de la semana y el mapa de emociones.
- [ ] Cada tarjeta y cada celda de la franja abre el listado con su filtro en la
      URL.
- [ ] Un usuario no puede leer los sueños de otro, ni siquiera siendo
      administrador, y hay un e2e que lo intenta.
- [ ] Ninguna pantalla tiene scroll horizontal a 375 px, con el texto en alemán
      y en los dos temas.
- [ ] `pnpm check` y `pnpm test:e2e` en verde, con los e2e de la API contra
      Postgres **y** SQLite.
