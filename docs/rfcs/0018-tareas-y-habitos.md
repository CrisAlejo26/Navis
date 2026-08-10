# RFC 0018: Tareas y hábitos

- **Estado**: Borrador
- **Fecha**: 2026-08-10
- **Apps afectadas**: api y web (escritorio hereda de web, es la misma web
  dentro de Tauri). La app móvil **queda fuera de esta versión**, con su
  pantalla puente hasta que exista su propio documento — mismo criterio que la
  RFC 0002 aplicó al calendario (§8.7 de esa RFC).
- **Depende de**: [0008](./0008-iglesias-como-espacios-de-trabajo.md) (iglesias
  como espacio de trabajo: de ahí sale el `church_id` y el sistema de permisos
  que usa esta propuesta) y de [0001](./0001-panel-de-metricas.md) (panel de
  inicio, que esta RFC amplía con una tarjeta nueva).

## Problema

Hoy no hay ningún sitio dentro de Navis donde alguien del equipo pastoral
apunte lo que tiene que hacer — preparar la predicación del viernes, llamar a
alguien, montar el reparto del mes — ni ningún sitio que ayude a sostener una
disciplina personal en el tiempo: leer la Biblia cada día, orar, hacer
ejercicio. Eso vive repartido entre una app de notas del teléfono, un papel y
la memoria, sin relación con la iglesia desde la que se está trabajando: quien
pastorea dos iglesias mezcla en la misma lista lo de una y lo de otra, y nadie
más del equipo lo ve ni lo hereda si esa persona deja de estar disponible.

Esta propuesta añade una sección de **Tareas y hábitos** a Navis: tareas con
fecha, hora, prioridad y repetición; hábitos con su propio ritmo; ambos con
etiquetas de color e icono para encontrarlos de un vistazo; y una **racha**,
al estilo Duolingo, que premia completar las tareas del día en días seguidos.

## Alcance

**Entra:**

- **Tareas**: título, descripción, fecha, hora, prioridad (baja/media/alta),
  estado (pendiente/en progreso/completada), repetición configurable (nunca,
  diaria, semanal, mensual o cada N días, con fin nunca/en una fecha/tras un
  número de repeticiones) y un recordatorio opcional (activado por defecto).
- **Hábitos**: título, meta, descripción, fecha, hora, repetición simple (por
  defecto no se repite; diaria, semanal o mensual) y el mismo recordatorio
  opcional.
- **Etiquetas** con icono y color, compartidas entre tareas y hábitos, y que el
  propio recordatorio también puede llevar las suyas.
- Un **catálogo de icono** amplio (~100), por categorías y con buscador, y un
  **selector de color** con paleta preestablecida más selector libre.
- **Racha de tareas** (solo tareas, no hábitos), con animación en bucle.
- Tres pantallas: **Hoy** (portada del día, con la racha), **Estadísticas**
  (gráficos) y **Listado** (calendario y lista, con filtros avanzados).
- Una tarjeta con las tareas del día en la **página de inicio** existente
  (RFC 0001), junto al calendario semanal que ya vive ahí.

**No entra** — y por qué:

- **Delegar o asignar una tarea a otra persona.** Nadie lo ha pedido y el
  encargo describe siempre «yo apunto, yo cumplo, mi racha». Construir reparto
  y notificación de «te han asignado esto» sin que haga falta es exactamente lo
  que la Regla 1 §5 llama abstraer por si acaso. Ver D6 y «Alternativas
  descartadas».
- **Subtareas o listas de comprobación dentro de una tarea.** Todoist y TickTick
  las tienen porque las han pedido durante años; aquí no hay ese pedido y
  añadirla ahora duplica la jerarquía de repetición y de recordatorio sin
  necesidad. Queda anotada como ampliación natural el día que alguien la pida.
- **Notificaciones push del recordatorio.** El proyecto no tiene hoy ninguna
  integración de push —ni `expo-notifications` en móvil ni Web Push en la
  PWA—, exactamente el mismo hallazgo que ya hizo la RFC 0016 §1 con el chat.
  El recordatorio en esta entrega es **visual, dentro de la aplicación**: se
  ve en la página «Hoy», en el listado y en el detalle; el aviso que llega al
  teléfono aunque la app esté cerrada es un proyecto de push en sí mismo y
  queda para cuando exista esa infraestructura.
- **Comentarios, adjuntos o archivos en una tarea.** No se ha pedido y esto es
  un espacio de trabajo personal, no una mensajería (para eso está
  Comunicaciones, RFC 0006/0016).
- **La app móvil.** Se documenta el modelo pensando en ella (mismo tipo, misma
  clave de traducción, JSX propio — Regla 1 §2.3), pero no se implementa
  todavía; ver «Apps afectadas» arriba.
- **Notificaciones automáticas de racha en riesgo** («te quedan 3 horas»): es
  una capa sobre el push que no existe. Cuando haya push, es la primera
  candidata (§14).

## Vocabulario

| Término          | Qué es                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Tarea**        | Algo puntual o repetitivo, con prioridad y tres estados                                 |
| **Hábito**       | Una disciplina que se repite (o no), sin prioridad ni tres estados                      |
| **Etiqueta**     | Un nombre con icono y color, del vocabulario de cada cuenta                             |
| **Recordatorio** | Un aviso dentro de la app, con su propia fecha/hora y sus etiquetas                     |
| **Ocurrencia**   | El día concreto de una tarea o hábito repetitivo; se «materializa» solo si se toca (D3) |
| **Racha**        | Días consecutivos con **todas** las tareas de ese día completadas (D8)                  |

En inglés, dentro del código: `task`, `habit`, `tag`, `reminder`, `occurrence`,
`streak`. En la interfaz, en español y su equivalente en cada idioma (§12).

## Decisiones tomadas

- **D1 — Tarea y hábito son dos entidades, no una con un `kind`.** Se parecen
  —título, fecha, hora, etiquetas, recordatorio— pero divergen en lo que
  importa: la tarea tiene tres estados y prioridad, el hábito tiene meta y dos
  estados; la tarea admite intervalo y condición de fin en su repetición, el
  hábito solo frecuencia; y la racha es **solo** de tareas. Forzarlas a una
  tabla común habría dejado columnas nulas para la mitad de las filas y un
  `kind` mirado en cada consulta — la señal exacta de la Regla 1 §5 de que no
  es la misma cosa. Lo que sí se comparte: el catálogo de etiquetas, el patrón
  de recordatorio y, en la interfaz, el mismo componente de tarjeta con una
  variante.
- **D2 — Sin `RRULE`, otra vez.** La RFC 0002 (D2) ya lo decidió para el
  calendario y la razón vale igual aquí: una tarea repetitiva de este proyecto
  es «cada día», «cada semana», «cada mes» o «cada N días», nunca «el tercer
  martes de meses impares». Cuatro columnas (`repeatFreq`, `repeatInterval`,
  `repeatEndType`, `repeatEndDate`/`repeatEndCount`) cubren el caso real sin
  arrastrar una librería de calendario ni `EXDATE`.
- **D3 — Las ocurrencias se materializan al tocarlas**, calcado de «las
  reuniones se materializan al tocarlas» (RFC 0002 D3). Una tarea repetitiva
  no genera una fila por día: el rango visible (la semana de «Hoy», el mes del
  calendario) se calcula **expandiendo la regla al vuelo**, y solo se escribe
  una fila en `task_occurrences` cuando alguien completa, cambia de estado o
  reprograma **ese día concreto**. Sin esto, una tarea diaria sin fin creada
  hoy generaría filas para siempre.
- **D4 — Una tarea no repetitiva es su propia ocurrencia.** No pasa por
  `task_occurrences`: su `status` y su `completedAt` viven en la fila
  `tasks` misma, igual que una reunión puntual (sin patrón) vive entera en
  `meetings`. Evita una fila puente para el caso más frecuente.
- **D5 — El estado del hábito es de dos, no de tres.** «En progreso» no
  significa nada en «leer la Biblia hoy»: o se ha hecho o no. Un hábito
  repetitivo también materializa por ocurrencia (D3), con `pendiente` |
  `completada` únicamente.
- **D6 — Tareas y hábitos son de la cuenta, dentro de la iglesia activa —
  no un tablón compartido por todo el equipo.** El encargo lo dice en primera
  persona todo el tiempo («yo apunto», «mi racha») y el «por iglesia» resuelve
  una pregunta distinta: que cambiar de iglesia (RFC 0008) cambie también la
  lista, igual que cambia el calendario o los creyentes, y no que las tareas
  de un pastor se mezclen con las del que atiende otra sede. Por eso cada fila
  lleva `churchId` **y** `ownerId`, y por eso el permiso es uno solo (D7):
  no hay «lo ajeno» que gestionar en esta entrega. Un modo de **tareas de
  equipo**, visibles para todos los que tengan acceso a la iglesia, es la
  ampliación natural del día que alguien la pida — no antes (Regla 1 §5, y ver
  «Alternativas descartadas»).
- **D7 — Un permiso, `tasks.view`, no el par `view`/`manage` de siempre.**
  El par existe en el resto del proyecto porque `manage` casi siempre significa
  «tocar lo de otro» (asignar una fase, mover a alguien de iglesia). Aquí,
  con D6, gestionar es siempre gestionar lo propio: separar los dos permisos
  añadiría una distinción que nunca se usaría. Se concede a todos los roles
  con acceso al panel —igual que `dashboard.view`—, y queda fuera solo
  `creyente`, que no tiene ninguno (CLAUDE.md).
- **D8 — «Día cumplido», para la racha: todas las tareas cuya fecha cae ese
  día están completadas, y hubo al menos una.** Un día sin ninguna tarea no
  rompe la racha ni la alarga: se salta, igual que Duolingo no exige lección en
  un día sin plan de estudio activo. Obligar a crear una tarea de relleno cada
  día para no perder la racha sería lo contrario de lo que la racha debería
  premiar. Ver §7 para el cálculo.
- **D9 — La racha no se guarda como contador mutable; se calcula.** Mantener
  un contador que sube y baja con cada cambio de estado exige resolver bien el
  caso «se reabre una tarea de hace tres días», que rompe la racha desde ese
  punto en adelante. Es más simple y más difícil de desincronizar recorrer
  hacia atrás desde hoy y parar en el primer día incompleto (§7), acotado a un
  máximo razonable de días. Lo único que se guarda es la **racha más larga**
  (`longestStreak`), que solo puede crecer y por tanto no tiene ese problema.
- **D10 — El recordatorio es 1:1, no una lista.** El encargo pide «un
  recordatorio», en singular, activado por defecto con la fecha y hora de la
  tarea. `TaskReminder`/`HabitReminder` son una fila por tarea/hábito, no una
  tabla de recordatorios múltiples — que sería la ampliación natural si algún
  día se pide «avísame también un día antes».
- **D11 — El recordatorio lleva sus propias etiquetas, aparte de las de la
  tarea.** Así lo pidió el encargo, y aunque parezca redundante tiene un uso
  real: una tarea puede llevar la etiqueta «sermón» y su recordatorio la
  etiqueta «urgente», porque lo que urge no es la tarea en sí, es no
  olvidarla. Se modela como una tabla puente propia
  (`task_reminder_tags`), igual que `dream_emotions` (RFC 0005).
- **D12 — Las etiquetas son del vocabulario de cada cuenta, no de la
  iglesia entera.** Mismo razonamiento que D6: es un espacio personal. Se
  crean, se editan y se listan igual que las emociones de sueños
  (`EmotionsManager`, RFC 0005 D6), que es el patrón que ya existe en el
  repositorio para «un catálogo pequeño que cada cuenta arma a su gusto».
- **D13 — El color de una etiqueta reutiliza `accentSchema`.** No se inventa
  una paleta nueva: `packages/shared/src/schemas/congregations.ts` ya define
  seis tokens de tema (`primary`, `accent`, `success`, `warning`,
  `destructive`, `brand`) más `ACCENT_PALETTE`, dieciséis hexadecimales
  separados en el círculo — 22 en total, por encima de los «15 o 20» pedidos—,
  y el propio `ColorPicker` de `components/ui` ya ofrece esos 22 más la rueda
  del sistema para cualquier otro. Es exactamente el mismo componente que hoy
  usan sedes y dones (Regla 1 §1: búscalo antes de escribirlo).
- **D14 — El icono es una clave, no un componente.** `Tag.icon` guarda un
  identificador de texto (`'book-open'`, `'compass'`…) de un catálogo fijo en
  `packages/shared`; quien lo pinta es cada plataforma, con su propia librería
  —lucide en web, Ionicons el día que exista móvil (Regla 7 §6: lucide e
  Ionicons no son el mismo catálogo)—. El patrón ya existe:
  `lib/prophecies/state-icons.ts` y `lib/believers/note-kinds.ts` son mapas de
  `clave → { Icon, accent }` en un fichero propio, y este catálogo sigue la
  misma forma a mayor escala. Ver §6.
- **D15 — Ningún icono del catálogo se lee como una cruz** (Regla 7): se
  revisa uno a uno al curarlo, y quedan fuera los que son una cruz, un signo
  «+» grande o dos barras cruzadas que a distancia se leen igual.
- **D16 — `date` + `time`, no `timestamptz`**, igual que el calendario
  (RFC 0002 D5) y por la misma razón: «la tarea del viernes» es del viernes
  aunque el servidor esté en otro huso. La hora es nula cuando la tarea no
  tiene una franja concreta («todo el día»).
- **D17 — Los tramos del día son fijos**: mañana 05:00–11:59, tarde
  12:00–18:59, noche 19:00–04:59. Son los que pide el filtro rápido de «Hoy»
  (§10.3) y se calculan sobre `time`, no sobre nada que dependa del huso del
  servidor.
- **D18 — Borrar una tarea repetitiva no borra su historial.** El borrado es
  lógico (`BaseEntity.deletedAt`) sobre la fila `tasks`; las ocurrencias ya
  materializadas —las que cuentan para la racha— se quedan intactas. Lo que
  desaparece es la propuesta hacia adelante, exactamente como una reunión
  borrada en el calendario deja de proponerse pero no borra lo ya sucedido.
- **D19 — El elemento firma no es la llama de Duolingo.** Copiarla sería
  precisamente lo que la Regla 9 prohíbe: la pantalla de otro producto con el
  logo cambiado. El vocabulario de Navis es náutico (Regla 9 §3), así que la
  racha se pinta como **El Faro** (§10.1): un haz de luz en bucle continuo
  detrás del número de días, más una tira de los últimos días —reutilizando
  la técnica ya validada de `NightsStrip` (sueños) y de la Sonda
  (`scaleX()`, RFC 0003)— en vez de inventar una animación desde cero.
- **D20 — Una sola auditoría por pantalla** (Regla 9 §4): el Faro es la
  audacia de «Hoy»; la cinta de fases del calendario ya es la de RFC 0002 y
  esta propuesta no compite con ella en la vista de calendario del listado
  (§10.5), que reutiliza esa misma cinta en vez de inventar la suya.
- **D21 — «Ocultar completadas» empieza activado**, tal y como lo pidió el
  encargo, en el listado y en «Hoy». Es el mismo criterio que ya usa
  `EmotionPicker`/`DreamsFilters`: lo normal es mirar hacia adelante.

### Preguntas abiertas

- **P1 — Tareas de equipo.** D6 deja fuera el reparto y la vista compartida.
  ¿Hace falta antes de la primera entrega, o se espera a que alguien lo pida
  usando ya la versión personal?
- **P2 — Racha con margen (freeze), como Duolingo.** La investigación (§16)
  confirma que perdonar un día ocasional mejora la retención sin vaciar de
  sentido la racha. No entra en esta versión (D9 ya es bastante para la
  primera entrega) pero el diseño de `TaskStreakCache` (§5.6) lo admite sin
  romper nada: una columna `freezesAvailable` el día que se decida.
- **P3 — Meta cuantificada en el hábito** («leer 3 capítulos», con progreso
  numérico) frente a la meta como texto libre que propone esta RFC. El
  encargo solo pidió «una meta»; se implementa como texto y se amplía si hace
  falta un contador.

## Modelo de datos

Diez entidades nuevas, todas heredando de `BaseEntity` (`id`, `createdAt`,
`updatedAt`, `deletedAt`) y **añadidas a mano** al `DataSource` (CLAUDE.md: sin
globs).

### 5.1 Etiquetas

```
Tag                                   — el vocabulario de una cuenta, por iglesia (D12)
├── churchId → churches(id)           — cascade
├── ownerId → user(id)                — cascade
├── name: text
├── icon: text                        — clave del catálogo (D14), p. ej. 'book-open'
├── accent: text                      — token o hexadecimal (accentSchema, D13)
├── position: int
└── único (churchId, ownerId, name)
```

### 5.2 Tareas

```
Task
├── churchId → churches(id)           — cascade
├── ownerId → user(id)                — cascade (D6)
├── title: text
├── description: text | null
├── date: date                        — el día, o el primero si es repetitiva
├── time: time | null                 — null = todo el día
├── priority: text                    — 'baja' | 'media' | 'alta'
├── status: text                      — solo si NO es repetitiva (D4)
├── completedAt: timestamptz | null   — solo si NO es repetitiva
├── isRecurring: boolean
├── repeatFreq: text | null           — 'diaria' | 'semanal' | 'mensual' (D2)
├── repeatInterval: int               — default 1: «cada 2 días»
├── repeatEndType: text | null        — 'nunca' | 'fecha' | 'cantidad'
├── repeatEndDate: date | null
├── repeatEndCount: int | null
├── ← TaskTag[]  ← TaskOccurrence[]  ← TaskReminder (1:1)

TaskTag (taskId, tagId)               — único
TaskOccurrence                        — solo tareas repetitivas, solo el día tocado (D3)
├── taskId → tasks(id)                — cascade
├── date: date
├── status: text                      — 'pendiente' | 'en_progreso' | 'completada'
├── completedAt: timestamptz | null
└── único (taskId, date)

TaskReminder                          — 1:1 (D10)
├── taskId → tasks(id)                — cascade, único
├── enabled: boolean                  — default true
├── remindAt: timestamptz             — por defecto, date+time de la tarea
└── ← TaskReminderTag[]

TaskReminderTag (reminderId, tagId)   — único (D11)
```

### 5.3 Hábitos

Misma forma, con las diferencias de D1 y D5:

```
Habit
├── churchId → churches(id)           — cascade
├── ownerId → user(id)                — cascade
├── title: text
├── goal: text | null
├── description: text | null
├── date: date
├── time: time | null
├── repeatFreq: text                  — 'ninguna' | 'diaria' | 'semanal' | 'mensual'
├── ← HabitTag[]  ← HabitOccurrence[]  ← HabitReminder (1:1)

HabitTag (habitId, tagId)             — único
HabitOccurrence
├── habitId → habits(id)              — cascade
├── date: date
├── status: text                      — 'pendiente' | 'completada' (D5)
├── completedAt: timestamptz | null
└── único (habitId, date)

HabitReminder                         — mismo patrón que TaskReminder
├── habitId → habits(id) — cascade, único
├── enabled: boolean — default true
├── remindAt: timestamptz
└── ← HabitReminderTag[]

HabitReminderTag (reminderId, tagId)  — único
```

### 5.4 Sin tarea repetitiva no materializada, ¿de dónde sale «hoy tiene una

    tarea» en la portada?

De la **expansión**, no de la base de datos: el servidor calcula, para el
rango pedido, qué tareas y hábitos repetitivos caen en cada día según su
regla (D2) y los combina con lo ya materializado en `task_occurrences` /
`habit_occurrences` y con las no repetitivas (D4). Es la misma operación que
ya hace `GET /calendar` con los patrones (RFC 0002 §7.1); aquí vive en
`TasksExpansionService`/`HabitsExpansionService`, con un tope de rango de 92
días por la misma razón que allí (sin tope, una tarea diaria sin fin se
expande al infinito).

### 5.5 Índices que importan

| Tabla               | Índice                                            | Por qué                                                                 |
| ------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| `tasks`             | `(church_id, owner_id, date)`                     | La expansión y el listado son siempre por rango de fechas de una cuenta |
| `tasks`             | `(owner_id, date)` (parcial: solo no repetitivas) | El cálculo de la racha (§7) lee por aquí                                |
| `task_occurrences`  | único `(task_id, date)`                           | Que un doble clic no materialice dos veces                              |
| `habit_occurrences` | único `(habit_id, date)`                          | Igual que arriba                                                        |
| `tags`              | único `(church_id, owner_id, name)`               | El vocabulario no repite nombre                                         |

### 5.6 La racha, guardada

```
TaskStreakCache                       — una fila por cuenta y por iglesia (D9)
├── churchId → churches(id)           — cascade
├── ownerId → user(id)                — cascade
├── longestStreak: int                — solo puede crecer
└── único (churchId, ownerId)
```

No guarda la racha **actual**: esa se calcula en cada lectura (§7). Guardar
solo el máximo evita el problema de sincronizar un contador mutable (D9) sin
perder el dato que sí merece persistirse — «tu mejor racha fueron 46 días» no
debería desaparecer si la racha actual se rompe.

## Rachas

### 6.1 «Día cumplido» (D8)

Un día `D` cuenta si, expandiendo tareas repetitivas y no repetitivas de la
cuenta para ese día (§5.4), **todas** las que resultan están en estado
`completada` y hay **al menos una**. Un día sin ninguna tarea prevista no
rompe la racha: se salta al calcular.

### 6.2 Cómo se calcula

`GET /tasks/streak` recorre hacia atrás desde **ayer** (hoy cuenta aparte,
como día «en curso», y solo se suma a la racha si se completa antes de que
acabe) día a día:

1. Expande las tareas de ese día.
2. Si no hay ninguna, se salta (D8) y se sigue al día anterior.
3. Si las hay y **todas** están completadas, `currentStreak += 1` y se sigue.
4. Si las hay y **falta alguna**, se para: esa es la racha actual.

Con un tope de 400 días hacia atrás (más de un año, de sobra para cualquier
racha real) para no escanear el historial entero de una cuenta vieja. Cada vez
que se calcula y `currentStreak > longestStreak`, se actualiza
`TaskStreakCache.longestStreak` — una escritura barata, siempre monótona, sin
el problema de D9.

El resultado se cachea en el cliente con TanStack Query y se invalida al
completar o reabrir cualquier tarea del día de hoy o de ayer (los únicos dos
días que pueden mover la racha en una sesión normal).

## Catálogo de iconos y colores

### 7.1 Iconos

Vive en `packages/shared/src/constants/task-icons.ts`: una lista
`TASK_ICON_CATALOG` de `{ key, category }`, sin componente ni SVG (D14) — eso
lo resuelve cada plataforma con su propio mapa (`lib/tasks/icon-map.ts` en
web, calcado de `lib/believers/note-kinds.ts`).

Objetivo: **entre 100 y 120 iconos**, en doce categorías, curados uno a uno
contra la Regla 7 (D15). Muestra representativa (la lista completa se decide
al implementar, no aquí):

| Categoría                   | Ejemplos                                                   |
| --------------------------- | ---------------------------------------------------------- |
| Trabajo y oficina           | maletín, documento, impresora, clip, calculadora, correo   |
| Estudio y lectura           | libro abierto, birrete, cuaderno, lápiz, lupa              |
| Vida espiritual y comunidad | biblia, personas, corazón con manos, micrófono, música     |
| Hogar y tareas domésticas   | casa, sofá, cubiertos, papelera, bombilla, llave inglesa   |
| Salud y bienestar           | pulso, mancuerna, ensalada, pastilla, cama, gota de agua   |
| Finanzas                    | cartera, hucha, tarjeta, recibo, gráfico ascendente        |
| Familia y social            | personas, bebé, tarta, regalo, globo de confeti            |
| Naturaleza y aire libre     | árboles, montaña, sol, lluvia, bicicleta, huella           |
| Tecnología                  | portátil, móvil, wifi, cámara, auriculares                 |
| Viaje y desplazamiento      | coche, avión, tren, mapa, maleta, brújula, barco, ancla    |
| Comida y cocina             | gorro de cocinero, café, manzana, cubiertos cruzados       |
| Tiempo y organización       | reloj, calendario, alarma, temporizador, bandera, estrella |

El buscador filtra por `key` y por la clave de traducción de la categoría, no
por texto libre sin traducir: cada icono lleva una etiqueta accesible en los
seis idiomas (Regla 2).

### 7.2 Colores

No hay nada que construir: `accentSchema`, `ACCENT_PALETTE` y
`CONGREGATION_ACCENTS` (`packages/shared/src/schemas/congregations.ts`) y el
componente `ColorPicker` (`apps/web/src/components/ui/color-picker.tsx`) ya
resuelven exactamente lo pedido —22 muestras más la rueda del sistema— y ya
los usan sedes, patrones y dones (D13). `Tag.accent` es del mismo tipo.

## API

Todo bajo `/api/v1`, con la iglesia puesta por el servidor
(`@CurrentChurch()`, RFC 0008 §7) y la cuenta por la sesión: nunca se manda
`ownerId` desde el cliente.

| Método | Ruta                                           | Permiso      | Descripción                                                     |
| ------ | ---------------------------------------------- | ------------ | --------------------------------------------------------------- |
| GET    | `/tasks?from=&to=&…`                           | `tasks.view` | Tareas del rango, expandidas (§5.4); filtros de §10.5           |
| POST   | `/tasks`                                       | `tasks.view` | Crear, con etiquetas y recordatorio anidados                    |
| PATCH  | `/tasks/:id`                                   | `tasks.view` | Editar la plantilla (D18: no toca lo ya materializado)          |
| DELETE | `/tasks/:id`                                   | `tasks.view` | Borrado lógico (D18)                                            |
| PUT    | `/tasks/:id/occurrences/:date`                 | `tasks.view` | Cambia el estado de ese día; materializa si hace falta (D3)     |
| GET    | `/tasks/streak`                                | `tasks.view` | Racha actual y más larga (§6)                                   |
| GET    | `/tasks/stats?from=&to=`                       | `tasks.view` | Series para los gráficos de «Estadísticas» (§10.4)              |
| GET    | `/habits`, `POST`, `PATCH`, `DELETE`           | `tasks.view` | Igual que tareas, sin racha                                     |
| PUT    | `/habits/:id/occurrences/:date`                | `tasks.view` | Igual que tareas, con los dos estados de D5                     |
| GET    | `/habits/stats?from=&to=`                      | `tasks.view` | Series de cumplimiento de hábitos                               |
| GET    | `/tags`                                        | `tasks.view` | El vocabulario de la cuenta en la iglesia activa                |
| POST   | `/tags`, `PATCH /tags/:id`, `DELETE /tags/:id` | `tasks.view` | Crear/editar/borrar una etiqueta (borra en cascada de sus usos) |

El catálogo de iconos **no tiene endpoint**: es estático, va en el bundle
(igual que `NOTE_KINDS`), sin ida y vuelta al servidor.

### 8.1 `PUT /tasks/:id/occurrences/:date`, con detalle

Cuerpo: `{ status }`. En una transacción: si la tarea no es repetitiva, escribe
`status`/`completedAt` en la fila `tasks`; si lo es, busca la fila de
`task_occurrences` para `(taskId, date)` y la crea si no existe (D3),
heredando `title` y el resto de la plantilla al vuelo — la fila solo guarda lo
que puede cambiar por día: estado y fecha de cumplimiento. Idempotente, mismo
criterio que `PUT /calendar/slots` (RFC 0002 §7.2).

### 8.2 Errores

`400` rango de fechas ausente, invertido o mayor de 92 días. `403` sin
`tasks.view`, o el recurso es de otra cuenta o de otra iglesia (RFC 0008
§7.1: 403, no 404). `404` la tarea, el hábito o la etiqueta no existen para
esa cuenta en la iglesia activa. `409` al crear una etiqueta que repite
nombre. `422` `repeatEndType: 'cantidad'` sin `repeatEndCount`, o
`repeatEndType: 'fecha'` sin `repeatEndDate`, o `time` fuera de `00:00`–`23:59`.

## Interfaz

### 9.1 Dirección de diseño

**El Faro.** El elemento firma de la sección (D19) es un haz de luz que gira
despacio y sin parar detrás del número de la racha —`conic-gradient` girando
con `transform: rotate()`, en bucle mientras la pantalla está abierta,
congelado en una posición fija si `prefers-reduced-motion` está activo (Regla
9 §5)—. No es la llama de Duolingo: es un guiño náutico —un faro guía con
constancia, que es justo lo que una racha premia— y reutiliza la técnica ya
validada del proyecto en vez de inventar una nueva (Regla 1). Debajo del
faro, la **tira de los últimos catorce días**, calcada de `NightsStrip`
(sueños): un punto por día, lleno si se cumplió, hueco si no, con el mismo
tipo de entrada escalonada que ya usa esa franja.

**Una sola audacia por pantalla** (Regla 9 §4): en «Hoy» es el Faro; en la
vista de calendario del Listado (§10.5) es la cinta de fases que ya trajo la
RFC 0002 (D20), sin competir con una segunda animación de racha ahí.

**Colorido, sin caer en relleno** (Regla 9 §2): el color que se ve en cada
tarjeta es el de sus propias etiquetas —de ahí que el catálogo importe tanto—,
no un degradado de fondo. Es la misma idea que ya demuestra `EmotionChip`: el
color informa, no decora.

### 9.2 Navegación (web)

Entrada nueva en la barra lateral, **«Tareas»**, con tres subentradas —mismo
patrón que «Calendario» (RFC 0002 D15)—:

| Ruta           | Qué es                                                 |
| -------------- | ------------------------------------------------------ |
| `/tasks`       | **Hoy**: la portada, con la racha. Ruta por defecto    |
| `/tasks/stats` | **Estadísticas**                                       |
| `/tasks/list`  | **Listado**: calendario o lista, con filtros avanzados |

### 9.3 «Hoy»

```
┌──────────────────────────────────────────────┐
│  ‹  Vie 15 de agosto  ›              [Hoy]    │
│                                                │
│        ╭───────────╮                          │
│        │  ☼ 12      │   ●●●●●○●●●●●●●●        │
│        │  días       │   L  M  X  J  V  S  D    │
│        ╰───────────╯                          │
│                                                │
│  [ Hábitos ]  [ Tareas ]                      │
│                                                │
│  Pendientes · Hechas · Mañana · Tarde · Noche │
│                                                │
│  ☐ 📖 Leer Hechos 2           09:00  alta     │
│  ☑ ✉️ Escribir a la familia    —     media     │
│  ...                                          │
└──────────────────────────────────────────────┘
```

- **Navegación entre días**: flechas y «Hoy» en la cabecera, con `←`/`→` de
  teclado (mismo criterio que el calendario, RFC 0002 §8.3); en móvil se
  desliza con el dedo. El día elegido viaja en la URL (`?date=2026-08-15`).
- El Faro y la tira solo se ven en la pestaña **Tareas** (D19: la racha es
  solo de tareas) y solo cuando el día elegido es hoy o antes; en un día
  futuro, la tira sigue pero el faro se atenúa —no hay nada que celebrar
  todavía—.
- Las **pestañas** «Hábitos»/«Tareas» cambian la lista de abajo sin recargar
  la cabecera (viven en la URL: `?tab=habitos`).
- **Filtros rápidos** por defecto: pendientes, hechas, mañana/tarde/noche
  (D17) — pastillas, con «pendientes» activo al entrar (D21 lo deja para el
  listado; aquí «pendientes» es lo que se viene a mirar cada mañana).
- Cada fila es una tarjeta compacta: icono y color de su primera etiqueta,
  título, hora si la tiene, prioridad como una franja lateral fina de color
  (nunca solo color: la palabra «alta» va escrita, Regla 3 §7). Tocarla abre
  el detalle (§9.6).
- Al completar una tarea desde la fila, un check se anima con `opacity` y
  `scale` cortos y la fila se atenúa; si era la última pendiente del día, el
  Faro y la tira reaccionan con un pulso único (no en bucle: es la
  celebración de un momento, no el ambiente de la pantalla).

### 9.4 «Estadísticas»

Gráficos con el mismo patrón que ya usa el módulo de sueños/profecías —
`components/charts`, cargado con `React.lazy` para no meter recharts en el
paquete inicial (CLAUDE.md, «recharts vive detrás de una sola puerta»)—:

| Gráfico                                      | Tipo                                                               |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Completadas frente a pendientes, por semana  | Barras apiladas                                                    |
| Racha: tira de los últimos 90 días           | Igual que `NightsStrip`, a escala                                  |
| Por prioridad                                | Anillo (`RateRing`, ya existe)                                     |
| Por etiqueta                                 | Barras horizontales, coloreadas con `accentColor` de cada etiqueta |
| Tendencia de cumplimiento (tareas y hábitos) | Línea, con `Sparkline` para el resumen de la cabecera              |
| Racha actual y racha más larga               | Dos cifras grandes, con el Faro en miniatura junto a la actual     |

Rango seleccionable (semana, mes, trimestre, año), con el mismo selector que
ya usan las estadísticas de sueños.

### 9.5 «Listado»

**Dos vistas**, con el mismo conmutador que ya usa `dream-view-switch.tsx`:

- **Calendario**: reutiliza la cinta de fases del mes (RFC 0002, D20), con un
  punto por tarea/hábito en vez de una fase, coloreado por su primera
  etiqueta.
- **Lista**: `DataTable` responsive de siempre —tabla en `md` y superior,
  fichas por debajo (Regla 5, `components/ui/data-table.tsx`)—.

**Filtros avanzados**, en una barra igual que `useCalendarParams` (todo en la
URL, un solo sitio de verdad):

| Filtro       | Opciones                                                                     |
| ------------ | ---------------------------------------------------------------------------- |
| Tipo         | Tareas · Hábitos · Ambos                                                     |
| Búsqueda     | Texto libre, sobre título y descripción                                      |
| Fecha        | Personalizada · Hoy · Mañana · Esta semana · Este mes · Atrasado · Sin fecha |
| Etiqueta     | Multiselección, con icono y color                                            |
| Recordatorio | Con recordatorio · sin recordatorio                                          |
| Completadas  | Ocultar (por defecto, D21) · Mostrar                                         |
| Orden        | Fecha próxima · fecha lejana · prioridad · creación reciente · alfabético    |
| Agrupar por  | Estado · fecha · etiqueta · prioridad · sin agrupar                          |

**Accesos rápidos**, como pastillas encima de la barra: Tareas/Hábitos, Hoy,
Semana, Atrasadas, Prioritarias, por Estado, Ver completadas — cada una ajusta
los filtros de arriba sin abrir el panel completo, mismo criterio que las
pastillas de sede del calendario.

### 9.6 El detalle

Título, descripción, fecha/hora, etiquetas (con su icono y color), estado y
prioridad si es una tarea, meta si es un hábito, y el bloque de recordatorio
si está activo. Botones **Completar**, **Editar**, **Eliminar** — este último
con confirmación (borrado lógico, D18). Diseño en tarjeta, con la franja de
color de la primera etiqueta como acento del encabezado; nada de fondo
degradado ni icono decorativo sin función (Regla 9 §2).

### 9.7 Integración en la página de inicio

`DashboardSummary` (RFC 0001) gana un campo `todayTasks`: hasta cinco tareas
de hoy, ordenadas por hora y prioridad, y `taskStreak: number`. Una tarjeta
nueva, `TodayTasksCard`, se coloca en la rejilla de `dashboard.tsx` junto a
`EventsCard` y `NotesCard` —incluida en la misma llamada al servidor, sin una
segunda petición—, con el número de la racha en una esquina (una versión
pequeña del Faro, sin el bucle: en la portada general acompaña, no compite
con el calendario semanal que ya es lo que se viene a mirar ahí). Tocar la
tarjeta lleva a `/tasks`.

### 9.8 Los tres anchos (Regla 5)

| Ancho             | Qué cambia                                                                   |
| ----------------- | ---------------------------------------------------------------------------- |
| **< `md`** (375)  | «Hoy» a una columna, Faro centrado arriba; el listado en fichas, no en tabla |
| **`md`** (768)    | Barra lateral con subentradas; filtros avanzados en un `Drawer`              |
| **≥ `lg`** (1280) | Filtros avanzados fijos en un panel lateral, sin `Drawer`                    |

La acción de completar una tarea desde la fila tiene 44 px de objetivo táctil
como mínimo (Regla 5 §4); crear una tarea nueva es un botón `lg` (48 px), fijo
abajo y centrado en móvil.

### 9.9 Animación

- El Faro gira en bucle mientras la pantalla «Hoy» está abierta —solo
  `transform`, nunca `filter` ni `width` (Regla 9 §5)—; `prefers-reduced-motion`
  lo deja fijo en una posición, sin girar.
- La tira de días entra escalonada, igual que `NightsStrip`.
- Completar una tarea anima el check con `opacity`/`scale` (150 ms); si cierra
  el día, el pulso único del Faro y de la tira (D9.3), no en bucle.
- Cambiar de día en «Hoy» desplaza el contenido en el sentido de la flecha,
  con `transform`, igual que el calendario al cambiar de mes (RFC 0002 §8.8).

## Textos

Sección nueva `tasks.*` en los seis idiomas (Regla 2). Lista de claves (sin el
valor, que se escribe primero en `es.ts`):

```
tasks.title              tasks.today             tasks.habitsTab
tasks.tasksTab           tasks.add                tasks.addHabit
tasks.edit                tasks.delete             tasks.complete
tasks.reopen               tasks.deleteConfirm      tasks.titleLabel
tasks.description          tasks.date               tasks.time
tasks.allDay                tasks.priority           tasks.priorityLow
tasks.priorityMedium        tasks.priorityHigh       tasks.status
tasks.statusPending          tasks.statusInProgress   tasks.statusDone
tasks.goal                   tasks.repeat             tasks.repeatNone
tasks.repeatDaily             tasks.repeatWeekly       tasks.repeatMonthly
tasks.repeatEveryNDays        tasks.repeatEndNever     tasks.repeatEndDate
tasks.repeatEndCount          tasks.reminder           tasks.reminderEnabled
tasks.reminderAt               tasks.tags               tasks.addTag
tasks.tagName                   tasks.tagIcon            tasks.tagColor
tasks.searchIcons                tasks.customColor        tasks.emptyToday
tasks.emptyTodayHint              tasks.streak              tasks.streakBest
tasks.streakDays                   tasks.filterPending      tasks.filterDone
tasks.filterMorning                 tasks.filterAfternoon    tasks.filterEvening
tasks.viewCalendar                   tasks.viewList            tasks.filterType
tasks.filterBoth                      tasks.filterSearch        tasks.filterDateCustom
tasks.filterToday                      tasks.filterTomorrow      tasks.filterThisWeek
tasks.filterThisMonth                   tasks.filterOverdue       tasks.filterNoDate
tasks.filterTag                          tasks.filterReminder      tasks.hideCompleted
tasks.showCompleted                       tasks.sortBy               tasks.sortNearest
tasks.sortFarthest                         tasks.sortPriority         tasks.sortRecent
tasks.sortAlphabetical                      tasks.groupBy              tasks.groupStatus
tasks.groupDate                              tasks.groupTag             tasks.groupPriority
tasks.groupNone                               tasks.stats                tasks.statsCompletedVsPending
tasks.statsByPriority                          tasks.statsByTag           tasks.statsTrend
tasks.noTasks                                   tasks.noHabits             tasks.saveFailed
```

`tasks.priorityLow/Medium/High`, `tasks.statusPending/InProgress/Done` y las
etiquetas de icono (`tasks.icons.bookOpen`, …, una por cada clave del
catálogo, §7.1) llevan además su etiqueta accesible: son lo que lee un lector
de pantalla al enfocar cada icono en el selector.

Y `nav.tasks` (nueva) para la entrada de la barra lateral.

## Migraciones

Cuatro, en este orden, probadas en los dos motores (Regla 4):

1. **`CreateTaskTags`** — tabla `tags`.
2. **`CreateTasks`** — `tasks`, `task_tags`, `task_occurrences`,
   `task_reminders`, `task_reminder_tags`, con el índice único parcial de
   `tasks` (D5.5) y los demás de §5.5.
3. **`CreateHabits`** — mismas seis tablas, con `habits` en vez de `tasks`.
4. **`CreateTaskStreakCache`** — `task_streak_cache`.

Sin semilla: cada cuenta empieza sin tareas ni hábitos, y la pantalla vacía de
«Hoy» invita a crear el primero (Regla 9 §6).

## Investigación

- **Todoist** ha migrado su repetición hacia un selector visual sobre lenguaje
  natural en vez de exponer `RRULE` en la interfaz: confirma que un usuario
  final piensa en «cada día», «cada 10 días a la 1 de la tarde», no en la
  sintaxis de iCalendar — lo que ya defendía D2 sin necesidad de esta
  referencia, y esta la confirma.
- **Habitica** separa explícitamente el contador de un _Habit_ (con su propia
  frecuencia de reinicio: diaria, semanal, mensual) de la racha de un
  _Daily_ (días consecutivos, con recompensa creciente). Es la misma
  separación que D1 hace entre hábito y tarea, llegada por un camino
  distinto: dos mecánicas de constancia no son la misma mecánica solo porque
  ambas repitan.
- **Duolingo** basa su racha en aversión a la pérdida (no querer romper lo ya
  construido) y la refuerza con animación de celebración en los hitos, no en
  cada día — información que sostiene D-«pulso único, no en bucle» en la
  celebración de §9.3, y también el «freeze» que perdona un día ocasional sin
  vaciar la racha de sentido, dejado como P2 para no cargar la primera
  entrega.
- **TickTick** confirma el patrón de filtros combinables con reglas AND/OR
  sobre fecha, etiqueta, prioridad y estado — la base de §10.5 — y también
  una limitación real que conviene evitar aquí: sus listas inteligentes no se
  pueden fijar en la navegación principal, lo que esta propuesta sortea
  dejando los accesos rápidos como pastillas siempre visibles, no como listas
  guardadas que hay que ir a buscar.

## Alternativas descartadas

- **Tareas de equipo desde el principio** (compartidas, con asignación):
  más completo, pero nadie lo ha pedido y multiplica el modelo (¿quién ve qué,
  quién puede completar la tarea de otro, notificación al asignar…) sin un
  caso real sobre la mesa. Ver P1.
- **`RRULE` con una librería** (`rrule.js` o similar): más potente, pero el
  propio proyecto ya rechazó esa vía para el calendario (RFC 0002 D2) con el
  mismo argumento — el caso real no lo necesita, y el código y el aprendizaje
  que exige no se pagan solos.
- **Contador de racha mutable**, actualizado en cada cambio de estado: más
  rápido de leer, pero exige resolver correctamente «se reabre una tarea de
  hace tres días» sin desincronizarse; se prefiere calcular (D9).
- **Un solo icono por tarea directamente en `tasks.icon`**, sin pasar por
  etiquetas: más simple, pero el encargo pidió explícitamente que el
  icono y el color vivan en la **etiqueta**, reutilizable entre varias
  tareas — y es además lo que permite agrupar y filtrar por etiqueta en el
  listado (§10.5).

## Criterios de aceptación

- [ ] Una tarea repetitiva («cada 2 días, hasta el 31 de diciembre») se
      completa un día concreto sin afectar a los demás días.
- [ ] La racha sube al completar todas las tareas de hoy y de ayer seguidos, y
      no baja por un día sin ninguna tarea.
- [ ] Reabrir una tarea de hoy recalcula la racha correctamente en la
      siguiente lectura.
- [ ] Un hábito nunca aparece en el cálculo de la racha.
- [ ] Crear una etiqueta con icono y color, y verla en una tarea, en su
      recordatorio y en el filtro del listado.
- [ ] El listado filtra y agrupa por cualquier combinación de §10.5 sin perder
      el estado al recargar la página (todo en la URL).
- [ ] La tarjeta de la página de inicio muestra las tareas de hoy sin una
      petición adicional al servidor.
- [ ] `creyente` no ve «Tareas» en la navegación.
- [ ] Los textos están en los seis idiomas, incluida cada etiqueta accesible
      del catálogo de iconos.
- [ ] Funciona a 375 px, en los dos temas y con `prefers-reduced-motion`
      activo (el Faro deja de girar, la racha se sigue leyendo).
