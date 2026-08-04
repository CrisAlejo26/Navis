# RFC 0002: Calendario de programaciones del púlpito

- **Estado**: **Implementado en API y web** (fases 1 a 5; ver «Fases» para lo
  que queda suelto). Reescrito el 2026-08-04 sobre la primera versión
- **Fecha**: 2026-08-03 · reescrito 2026-08-04
- **Apps afectadas**: **api y web** (escritorio la hereda: es la misma web
  dentro de Tauri). La app móvil queda fuera de esta versión — §8.7
- **Depende de**: [0008](./0008-iglesias-como-espacios-de-trabajo.md) (iglesias
  y permisos, ya implementado en web) y del **núcleo mínimo** de
  [0003](./0003-creyentes-y-notas.md) (§6), que este documento adelanta.

## Problema

Cada reunión de la iglesia se reparte por **fases** —introducción, enseñanza,
testimonios, cierre— y cada fase la ocupa una persona distinta. Hoy eso se
prepara descargando un calendario en Excel y escribiendo a mano, día por día:

```
Viernes 15    Introducción   Juan Carlos
              Enseñanza      Luis Fernando
              Testimonios    Cristian Alejandro

Sábado 16     Introducción   Luis Fernando
              Finalización   Cristian Alejandro
```

Hay reunión **todos los días de la semana**, ninguna se parece a la anterior y
además **no todas son en el mismo sitio**: la misma persona programa Benidorm,
Alicante y Elda, con frecuencia el mismo día. Cuando el mes está montado, se
manda por WhatsApp una **captura de pantalla** —del mes entero, de dos semanas,
de una semana o de un solo día, según a quién se le mande—.

El resultado es un fichero que:

- lo edita una sola persona y el resto lo recibe como foto de una hoja de
  cálculo, recortada a mano y distinta cada vez;
- no avisa de nada: ni de una fase sin nadie, ni de que el mismo hermano
  predica tres días seguidos, ni de quién lleva dos meses sin subir;
- no guarda historial: el mes que viene se empieza otra vez en blanco;
- se lee fatal en un móvil, que es donde lo mira quien tiene que predicar;
- y obliga a llevar **una pestaña por sede**, con lo que eso tiene de
  equivocarse de columna.

Esta propuesta convierte ese Excel en la pantalla de calendario de Navis: **una
rejilla del mes a pantalla completa donde cada día enseña sus fases, su sede y
quién ocupa cada una**, editable en dos toques, y con un botón que genera la
imagen del tramo que se quiera para mandarla al grupo.

> Los turnos de sonido, biblias o alabanza se programan igual. La primera
> versión se centra en el púlpito porque es el caso real que hay hoy sobre la
> mesa, pero el modelo no lo da por supuesto: una fase apunta a una persona, no
> a «un predicador» (§5.5).

## Alcance

**Entra:**

- **Reuniones** con su fecha, su hora, su nombre y su **sede**.
- **Fases** dentro de cada reunión, ordenadas, cada una con **una persona
  asignada** o vacía.
- **Sedes** dentro de la misma iglesia (Benidorm, Alicante, Elda): varias
  programaciones el mismo día, en el mismo calendario, **sin crear otro espacio
  de trabajo** (§4 D11 y §5.1).
- **Patrones semanales** («los viernes en Elda a las 20:00, con estas fases»),
  que rellenan el mes sin crear una fila por ocurrencia.
- **Calendario del mes a pantalla completa** como vista predeterminada, con
  vistas de semana, agenda y personas, **navegación y filtros por fechas** y
  filtro por sede (§8.3).
- **Asignar en dos toques**, con un selector que dice cuándo predicó cada uno
  por última vez y cuántas veces lleva este mes.
- **Avisos de reparto**: fase sin asignar, la misma persona repetida el mismo
  día, en días seguidos o en dos sedes a la vez.
- **Compartir como imagen** (§9): día, semana, dos, tres o cuatro semanas, mes
  o un rango elegido a mano; de todas las sedes o de una sola; lista para
  mandar por WhatsApp desde el propio móvil.
- El **núcleo mínimo de creyentes** (§6), sin el cual no hay a quién asignar.

**No entra:**

- **Notas, familias y ficha completa del creyente**: son de la RFC 0003, que
  sigue viva y se apoya en lo que se crea aquí.
- **Notificaciones** («te toca el viernes»): dependen de la RFC 0006. La
  columna que las hará posibles se crea aquí (§6.3), el envío no.
- **Exportación iCal** y suscripción desde el móvil. Ver «Alternativas
  descartadas».
- **Arrastrar y soltar** asignaciones entre días. Ver «Alternativas
  descartadas».
- **Agenda genérica** —visitas pastorales, ensayos, reuniones de liderazgo—.
  Este calendario es de **reuniones y programaciones**; una visita pastoral es
  una nota fechada de la RFC 0003, no un evento del púlpito.
- Sincronización con Google Calendar, invitaciones por correo y confirmación de
  asistencia.

## Vocabulario

Se usa el mismo en el código, en la interfaz y en las traducciones:

| Término        | Qué es                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| **Iglesia**    | El espacio de trabajo de la RFC 0008: cuentas, permisos y datos propios |
| **Sede**       | Un lugar de reunión de esa iglesia: Benidorm, Alicante, Elda            |
| **Reunión**    | Lo que pasa un día concreto en una sede: «culto del viernes 15»         |
| **Fase**       | Un tramo de esa reunión: «introducción», «enseñanza»                    |
| **Asignación** | La persona que ocupa una fase                                           |
| **Patrón**     | La reunión fija de un día de la semana en una sede, con sus fases       |
| **Programar**  | Rellenar las fases de un tramo del calendario                           |
| **Reparto**    | Cómo quedan distribuidas las asignaciones entre las personas            |

En inglés, dentro del código: `congregation`, `meeting`, `slot`, `pattern`,
`assign`. En la interfaz, «sede» en español y su equivalente en cada idioma
(§10).

## Decisiones tomadas

- **D1 — La fase es la unidad, no el evento.** Un día no es «un evento con
  responsables»: es una reunión con **fases ordenadas**, y la fila que de
  verdad se edita es la fase. Toda la interfaz y la API giran alrededor de eso.
- **D2 — El patrón semanal sustituye a la RRULE.** Aquí las reuniones son «los
  viernes a las 20:00», no «el tercer martes de meses impares». Un día de la
  semana y una hora cubren el caso real con una fracción del código. Ver
  «Alternativas descartadas».
- **D3 — Las reuniones se materializan al tocarlas.** El mes se pinta
  expandiendo los patrones al vuelo; en la base solo hay fila cuando alguien
  asigna, cambia la hora o cancela ese día. Ni filas por ocurrencia ni un
  proceso nocturno que las genere.
- **D4 — Asignar es la primitiva.** Un solo endpoint —`PUT /calendar/slots`—
  pone a alguien en una fase y, si la reunión de ese día todavía no existía, la
  crea a partir del patrón. Un clic, una llamada, una transacción.
- **D5 — Fecha y hora locales, no `timestamptz`.** La reunión del viernes es
  del viernes aunque el servidor esté en otro huso. Se guardan `date` y `time`,
  y la zona (`churches.timezone`) solo entra al comparar con «ahora».
- **D6 — Las fases son texto de cada iglesia**, no un enum ni un catálogo
  global. Cada congregación llama a las cosas como las llama. El patrón dice
  cuáles son y en qué orden, y la reunión hereda esa lista.
- **D7 — Editar un patrón no reescribe lo ya tocado.** Una reunión
  materializada es una decisión que alguien tomó; el patrón nuevo se aplica de
  ahí en adelante a lo que siga siendo propuesta.
- **D8 — Se asigna a un creyente, no a una cuenta.** Quien predica no tiene por
  qué tener usuario en Navis. La persona vive en `believers`; el enlace con una
  cuenta es una columna nulable que aquí solo se reserva (§6.3).
- **D9 — La programación no es dato sensible**: se lee con `calendar.view`, que
  tienen los seis roles con acceso al panel. Programar exige `calendar.manage`
  (pastor, recepción y superadministrador, según la semilla de la RFC 0008).
- **D10 — El selector de personas no depende de `believers.view`.** Vive en
  `GET /calendar/preachers` y lo protege `calendar.manage`: devuelve nombre y
  datos de reparto, nada más. Así programar no obliga a abrir la ficha pastoral
  de nadie.
- **D11 — Varias sedes dentro de una iglesia, no una iglesia por sede.** Una
  `Church` es un espacio de trabajo entero —cuentas, permisos, creyentes,
  métricas, comunicaciones— y montar uno por cada lugar de reunión obliga a
  cambiar de contexto para programar el mismo viernes tres veces, y a dar de
  alta al mismo predicador tres veces. Una **sede** es dos campos, vive dentro
  de la iglesia y comparte con ella personas, cuentas y permisos. Cuándo hace
  falta cada cosa, en §5.2.
- **D12 — Siempre hay una sede, aunque no se note.** Cada iglesia nace con la
  suya y `meetings.congregation_id` es obligatorio: así no hay dos caminos en
  las consultas ni `NULL` en un índice único. Con **una sola sede la interfaz
  no la menciona en ningún sitio** —igual que el selector de iglesia de la RFC
  0008 no es un botón cuando solo hay una—; aparece en cuanto se crea la
  segunda.
- **D13 — La imagen se compone, no se captura.** El botón de compartir no
  fotografía la pantalla: dibuja una lámina propia, pensada para leerse en un
  móvil ajeno, con el rango y la sede que se pidan. Es lo que permite mandar
  «solo el viernes de Elda» sin recortar nada. Ver §9.
- **D14 — Los colores de la lámina salen de `themeColorsHex`**, no de los
  tokens CSS: la paleta de la aplicación está en `oklch` y el rasterizado de
  HTML a imagen no lo digiere de forma fiable. Es la misma paleta, en
  hexadecimal, que ya usan la barra de estado y el splash (Regla 3 §5).

- **D15 — Varios calendarios, uno por ministerio.** Púlpito, recepción, sonido y
  biblias no comparten cuadrícula: quien programa el sonido no quiere ver las
  fases de la predicación, y una sola rejilla con todo mezclado deja de leerse.
  Cada **calendario** es un espacio propio con sus reuniones fijas y sus
  programaciones, y en la barra lateral son **subentradas** de «Calendario»,
  como los apartados de contabilidad en Cuentify. Se crean, se renombran y se
  borran; los cuatro de serie los siembra una migración. Responde a P3.
- **D16 — El calendario dice a quién proponer.** Cada uno lleva su ministerio
  (`pulpito`, `recepcion`, `sonido`, `biblias`), y es lo que filtra el selector
  de personas: en el de sonido salen primero los de sonido. Sigue estando el
  interruptor «todos», porque una lista cerrada acaba en «mejor lo apunto
  aparte» (§6.2).
- **D17 — Las sedes son de la iglesia, no del calendario.** Elda es Elda para el
  púlpito y para el sonido. Por eso viven en `/congregations`, fuera del
  calendario, y sus colores valen en todos.

### Preguntas abiertas

- **P1** — ¿Una fase puede llevar **dos personas** (predica uno, traduce otro)?
  Hoy no: una fase, una persona. La salida barata es una fase más; la cara, una
  tabla de asignaciones. Se decide cuando aparezca el caso.
- **P2** — ¿Las fases llevan **duración**? El Excel de hoy no la tiene. La
  columna se deja fuera hasta que alguien la pida; añadirla no rompe nada.
- **P3** — ~~¿Los turnos de sonido y biblias entran en el mismo calendario?~~
  Resuelto en D15: cada ministerio tiene el suyo.
- **P4** — ¿Una sede llega a tener **su propia zona horaria**? Hoy hereda la de
  la iglesia. Mientras las sedes estén en la misma provincia no hace falta; la
  columna se añadiría sin romper nada.

## Modelo de datos

Cinco entidades nuevas para el calendario, todas de TypeORM, todas heredando de
`BaseEntity` (`id`, `created_at`, `updated_at`, `deleted_at`) y todas
**añadidas a mano** a la lista del `DataSource`: aquí no hay globs
(`CLAUDE.md`).

### 5.0 Calendarios

```
Calendar                            — «Púlpito», «Recepción», «Sonido», «Biblias»
├── churchId → churches(id)         — cascade
├── name: text
├── slug: text                      — derivado del nombre; va en la URL
├── ministry: text | null           — a quién propone el selector (D16)
├── position: int                   — el orden en la barra lateral
└── único (churchId, slug)
```

Un calendario es **un espacio de programación completo**: sus reuniones fijas,
sus reuniones y sus fases. Lo que comparten todos es la iglesia, sus sedes y sus
personas.

Los cuatro de serie se siembran por migración con el ministerio que les
corresponde. Se pueden renombrar, reordenar y borrar; **nunca el último**, por lo
mismo que la última sede: dejaría la sección sin nada que enseñar.

### 5.1 Sedes

```
Congregation                        — «Benidorm», «Alicante», «Elda»
├── churchId → churches(id)         — cascade
├── name: text
├── city: text | null
├── accent: text                    — token de color del carril y de la etiqueta
├── position: int                   — el orden en que se listan
├── isDefault: boolean              — la que se propone al crear algo
├── isActive: boolean               — se apaga sin perder el historial
└── único (churchId, name)
```

Una sede es **un nombre y un color**. No tiene cuentas, ni permisos, ni
creyentes propios: todo eso es de la iglesia y se comparte, que es justo lo que
hace posible que el mismo predicador esté el viernes en Elda y el sábado en
Alicante sin darlo de alta dos veces.

### 5.2 Sede o iglesia: cuál de las dos

| Lo que necesitas                                                 | Sede | Iglesia (RFC 0008)      |
| ---------------------------------------------------------------- | ---- | ----------------------- |
| Programar sus reuniones en el mismo calendario y el mismo mes    | ✅   | ❌ (cambiar de espacio) |
| Compartir predicadores, creyentes y cuentas                      | ✅   | ❌ (cada una los suyos) |
| Mandar la programación de ese sitio por separado                 | ✅   | ✅                      |
| Que su equipo entre con sus cuentas y **no vea** lo de las demás | ❌   | ✅                      |
| Métricas, comunicaciones y notas pastorales separadas            | ❌   | ✅                      |

Regla práctica: **si la programación la lleva la misma persona, es una sede.**
El día que un sitio tenga su propio equipo con sus cuentas, se convierte en
iglesia; los datos de calendario se pueden reasignar entonces, y eso es una
migración de una tabla, no un rediseño.

### 5.3 Patrones

```
MeetingPattern                      — «los viernes en Elda a las 20:00, Culto»
├── churchId → churches(id)         — cascade
├── calendarId → calendars(id)      — de qué calendario es (D15)
├── congregationId → congregations(id)   — cascade
├── name: text                      — «Culto», «Oración», «Jóvenes»
├── weekday: int                    — 0 domingo … 6 sábado
├── startTime: time                 — hora local
├── accent: text                    — por defecto, el de su sede
├── isActive: boolean
├── validFrom: date | null          — desde cuándo se propone
├── validTo: date | null            — hasta cuándo
└── ← PatternPhase[]

PatternPhase                        — las fases por defecto de ese patrón
├── patternId → meeting_patterns(id) — cascade
├── name: text                      — «Introducción», «Enseñanza»
└── position: int                   — orden dentro de la reunión
```

### 5.4 Reuniones y fases

```
Meeting                             — una reunión concreta, ya materializada
├── churchId → churches(id)         — cascade
├── calendarId → calendars(id)      — de qué calendario es (D15)
├── congregationId → congregations(id)        — obligatorio (D12)
├── patternId → meeting_patterns(id) | null   — null si es puntual
├── date: date                      — día local
├── startTime: time
├── name: text                      — heredado del patrón, editable
├── accent: text
├── status: text                    — 'programada' | 'cancelada'
├── notes: text | null
└── ← MeetingSlot[]

MeetingSlot                         — la fase y quién la ocupa
├── meetingId → meetings(id)        — cascade
├── name: text                      — copiado del patrón al materializar (D6)
├── position: int
├── believerId → believers(id) | null  — null = sin asignar
└── note: text | null               — «tema: Hechos 2»
```

Índices que importan:

| Tabla           | Índice                                                           | Por qué                                                  |
| --------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| `meetings`      | `(church_id, date)`                                              | La consulta del mes es siempre por rango de fechas       |
| `meetings`      | `(congregation_id, date)`                                        | El filtro por sede y la lámina de una sola sede          |
| `meetings`      | único `(pattern_id, date)` con `pattern_id` no nulo y sin borrar | Que una carrera no materialice dos veces el mismo día    |
| `meeting_slots` | `(meeting_id, position)`                                         | Se leen y se reordenan siempre juntas                    |
| `meeting_slots` | `(believer_id)`                                                  | El reparto y «cuándo predicó por última vez» van por ahí |

El índice único es **parcial** —`WHERE pattern_id IS NOT NULL AND deleted_at IS
NULL`— y se escribe a mano en la migración. Sin la primera condición, dos
reuniones puntuales del mismo día chocarían en Postgres… o no, según cómo trate
los nulos cada motor: mejor no depender de eso.

### 5.7 La semana con la que se arranca

Un calendario vacío no dice nada, y escribir siete reuniones desde cero antes de
poder programar la primera es la clase de trámite que devuelve a la gente a la
hoja de cálculo. Así que **cada sede nace con su semana** en cada calendario:

| Día       | Reunión         | Hora  | Fases                                    |
| --------- | --------------- | ----- | ---------------------------------------- |
| Lunes     | Alabanza        | 19:00 | Introducción · Final                     |
| Martes    | Estudio bíblico | 19:00 | Introducción · Final                     |
| Miércoles | Enseñanza       | 19:00 | Introducción · Predicación · Testimonios |
| Jueves    | Alabanza        | 19:00 | Introducción · Final                     |
| Viernes   | Alabanza        | 19:00 | Introducción · Final                     |
| Sábado    | Estudio bíblico | 18:00 | Introducción · Final                     |
| Domingo   | Enseñanza       | 10:00 | Introducción · Predicación · Testimonios |

Vive en `packages/shared/src/schemas/default-week.ts` porque la usan la
migración, la API y los tests. Tres cosas que importan:

- **Es por sede, no por iglesia.** En Elda la alabanza puede caer otro día que
  en Benidorm, así que la semana se siembra en cada una y se ajusta allí.
- **Es un punto de partida, no una ley**: se edita entera desde la
  configuración del calendario, que es donde se ve agrupada por sede.
- **No pisa nada.** La siembra comprueba antes si esa pareja calendario–sede ya
  tiene alguna reunión fija: quien ya ajustó su semana no se la encuentra llena
  otra vez.

Se siembra al crear un calendario —en todas sus sedes—, al crear una sede —en
todos sus calendarios— y, para lo que ya existía, en la migración
`SeedDefaultWeek`.

### 5.5 Por qué `date` y `time` y no `timestamptz`

Guardar la reunión del viernes como un instante UTC obliga a convertir en cada
lectura y regala el clásico «la reunión de las 00:30 aparece el jueves». Una
programación es un **día del calendario y una hora de reloj de pared**: eso es
`date` + `time`, que ambos motores admiten y que TypeORM devuelve como texto
(`'2026-08-15'`, `'20:00'`) en los dos. Sin objetos `Date` por medio no hay
huso que se cuele.

### 5.6 Lo que el modelo admite y la interfaz todavía no

Una fase es «un nombre, un orden y una persona». Nada en el modelo dice
«predicador»: el día que se quieran programar sonido o biblias (P3), basta con
patrones distintos —o fases distintas dentro del mismo— y la misma pantalla
sirve. No se construye ahora (Regla 1), pero la salida está abierta.

## El núcleo mínimo de creyentes

Sin personas no hay a quién asignar, y la RFC 0003 completa —notas, familias,
etiquetas, privacidad— es bastante más de lo que este calendario necesita. Se
adelanta **solo el hueso**:

```
Believer
├── churchId → churches(id)         — cascade
├── congregationId → congregations(id) | null  — su sede habitual, solo informativa
├── firstName / lastName: text
├── phone: text | null              — para avisar de un cambio de última hora
├── isActive: boolean               — quien ya no está deja de proponerse
├── userId → user(id) | null        — único; reservado, ver §6.3
└── ← BelieverMinistry[]

BelieverMinistry                    — para qué está disponible esta persona
├── believerId → believers(id)      — cascade
├── ministry: text                  — 'pulpito' de momento (§6.2)
└── único (believerId, ministry)
```

`congregationId` es **nulable y no acota nada**: cualquiera puede predicar en
cualquier sede. Sirve para que el selector ponga primero a los de esa sede y
para escribir «Elda» al lado del nombre cuando hay varias.

### 6.1 Qué se queda para la RFC 0003

`email`, `birthDate`, `address`, `status` completo, `joinedAt`, `photoUrl`,
`householdId`, `lastContactAt`, las notas y las etiquetas. Todo eso son
columnas y tablas **añadidas** después: la RFC 0003 no tendrá que rehacer nada,
solo continuar. Ese es el criterio para decidir qué entra aquí — lo que se crea
ahora tiene que ser exactamente lo que 0003 habría creado igualmente.

### 6.2 Ministerio, y no etiqueta ni rol

- No es un **rol** de la tabla `roles`: eso son permisos de una cuenta (RFC 0008) y quien predica puede no tener cuenta (D8).
- No es todavía una **etiqueta** de la RFC 0003: las etiquetas son libres y
  descriptivas («jóvenes», «nuevo»); esto responde a una pregunta operativa,
  _¿a quién puedo poner en el púlpito?_.

Una tabla de dos columnas, con `'pulpito'` como único valor sembrado. Cuando la
RFC 0003 traiga las etiquetas se decidirá si conviven o si una absorbe a la
otra; mientras tanto, esto no estorba a nadie.

El selector ofrece por defecto a quien tiene el ministerio y, detrás de un
interruptor, **a cualquier creyente activo**: asignar a alguien que no estaba en
la lista lo marca en el momento, sin salir de la pantalla. Una lista cerrada que
obliga a irse a otra sección a dar de alta es la forma segura de que la gente
vuelva al Excel.

### 6.3 `believers.user_id`

La RFC 0008 §5.4 ya la reservó. Se **crea ahora** (nulable, única) y no se usa:
es lo que permitirá «solo lo mío» en el calendario y el aviso «te toca el
viernes» de la RFC 0006. Crear una columna nulable no es abstraer por si acaso;
es no tener que volver a migrar la tabla dentro de dos semanas.

## API

Todo bajo `/api/v1`, con la iglesia puesta por el servidor (`@CurrentChurch()`,
RFC 0008 §7): el cliente nunca dice de qué iglesia son los datos. La **sede** sí
la dice el cliente, porque es una decisión suya dentro de la iglesia, y el
servidor comprueba que pertenece a la activa.

| Método | Ruta                                | Permiso           | Descripción                                               |
| ------ | ----------------------------------- | ----------------- | --------------------------------------------------------- |
| GET    | `/calendar?from=&to=&congregation=` | `calendar.view`   | El tramo, con patrones ya expandidos (§7.1)               |
| PUT    | `/calendar/slots`                   | `calendar.manage` | **Asignar o vaciar una fase**; materializa si hace falta  |
| POST   | `/calendar/meetings`                | `calendar.manage` | Reunión puntual (la que no nace de un patrón)             |
| PATCH  | `/calendar/meetings/:id`            | `calendar.manage` | Hora, nombre, notas, sede o `status: cancelada`           |
| PUT    | `/calendar/meetings/:id/slots`      | `calendar.manage` | Reemplaza la lista de fases (añadir, quitar, reordenar)   |
| DELETE | `/calendar/meetings/:id`            | `calendar.manage` | Borrado lógico; si nació de un patrón, vuelve a propuesta |
| GET    | `/calendar/congregations`           | `calendar.view`   | Las sedes de la iglesia, en su orden                      |
| POST   | `/calendar/congregations`           | `calendar.manage` | Crear una sede (nombre y color)                           |
| PATCH  | `/calendar/congregations/:id`       | `calendar.manage` | Editar o desactivar                                       |
| DELETE | `/calendar/congregations/:id`       | `calendar.manage` | Borrado lógico; nunca la última                           |
| GET    | `/calendar/preachers?q=&all=`       | `calendar.manage` | Candidatos con sus datos de reparto (D10)                 |
| GET    | `/calendar/summary?from=&to=`       | `calendar.view`   | Reparto del tramo y avisos (§7.3)                         |
| GET    | `/calendar/patterns`                | `calendar.view`   | Los patrones de la iglesia, por sede                      |
| POST   | `/calendar/patterns`                | `calendar.manage` | Crear, con su sede y sus fases                            |
| PATCH  | `/calendar/patterns/:id`            | `calendar.manage` | Editar (D7: no reescribe lo materializado)                |
| DELETE | `/calendar/patterns/:id`            | `calendar.manage` | Borrado lógico; las reuniones ya creadas se quedan        |

`from` y `to` son obligatorios y el rango máximo es de **92 días**: es el mes
visible más el anterior y el siguiente, que es lo que la interfaz precarga. Sin
tope, una petición sin filtros expande patrones hasta el infinito.

`congregation` admite varias separadas por coma (`congregation=a,b`) y, si
falta, devuelve **todas**: el calendario se ve entero por defecto y filtrar es
una decisión consciente.

### 7.1 La respuesta del mes

Cada día trae sus reuniones, reales o propuestas, con la misma forma:

```jsonc
{
  "from": "2026-08-01",
  "to": "2026-08-31",
  "congregations": [
    { "id": "c1…", "name": "Benidorm", "accent": "primary" },
    { "id": "c2…", "name": "Alicante", "accent": "accent" },
    { "id": "c3…", "name": "Elda", "accent": "success" },
  ],
  "days": [
    {
      "date": "2026-08-15",
      "meetings": [
        {
          "id": "3f1c…", // null si todavía es una propuesta
          "congregationId": "c3…",
          "patternId": "9ab2…",
          "name": "Culto",
          "startTime": "20:00",
          "status": "programada",
          "slots": [
            {
              "id": "aa1…",
              "name": "Introducción",
              "position": 0,
              "believer": { "id": "77c…", "name": "Juan Carlos Ruiz" },
            },
            {
              "id": null,
              "name": "Enseñanza",
              "position": 1,
              "believer": null,
            },
          ],
        },
      ],
    },
  ],
}
```

Una propuesta se distingue por `id: null`, y sus fases también. El cliente no
tiene que saber nada más: para asignar manda `patternId`, `date` y `position`, y
el servidor decide si materializa. Las sedes vienen en la cabecera de la
respuesta para no repetir nombre y color en cada reunión.

### 7.2 `PUT /calendar/slots`, con detalle

Cuerpo: `{ date, patternId?, meetingId?, position, believerId | null, note? }`.

En una transacción:

1. Busca la reunión por `meetingId`, o por `(pattern_id, date)`.
2. Si no existe, la crea desde el patrón —heredando su sede, su hora y **todas
   sus fases** en su orden—.
3. Escribe la asignación en la fase de esa posición.
4. Devuelve la reunión entera, ya materializada.

Idempotente: repetir la misma llamada deja el mismo estado. La unicidad de
`(pattern_id, date)` es la que impide que dos clics simultáneos creen dos
reuniones; ante el conflicto, se reintenta leyendo la que ganó.

### 7.3 El resumen

`GET /calendar/summary` devuelve, para el tramo pedido:

- por persona: veces asignada, última fecha, en qué fases y en qué sedes;
- los **avisos**: fases sin asignar, la misma persona dos veces el mismo día,
  en días consecutivos, o **en dos sedes el mismo día**.

Los avisos se calculan en el servidor y no en la pantalla: los quiere también el
panel de la RFC 0001 y, más adelante, el recordatorio de la RFC 0006.

### 7.4 Errores

- `400` si el rango falta, está del revés o pasa de 92 días.
- `403` si el permiso falta, o si el recurso es de otra iglesia (RFC 0008 §7.1:
  403 y no 404, a propósito).
- `404` si la reunión, el patrón, la sede o el creyente no existen en la iglesia
  activa.
- `409` al materializar una reunión que otro acaba de crear —se resuelve solo,
  §7.2—, al crear un patrón que repite sede, día de la semana y hora, y al
  repetir el nombre de una sede.
- `422` si se asigna a alguien inactivo, y al borrar la última sede.

## Interfaz

### 8.1 La dirección

Un calendario es la pantalla que más fácil se queda en plantilla: rejilla gris,
puntitos de colores y un modal. Aquí no puede pasar (Regla 9), y el material
para evitarlo lo da el propio contenido: **el mes de una iglesia es su cuaderno
de bitácora**, y lo que se quiere leer de un vistazo no es «hay un evento», es
**quién lleva qué tramo y dónde**.

- La pantalla **ocupa el alto entero** (`h-dvh`), sin tarjeta flotante ni fondo
  decorado. El calendario es la página, no un widget dentro de la página.
- **Elemento firma: la cinta de fases.** Cada reunión se pinta como un carril
  vertical del color de su sede y, colgando de él, una línea por fase:

  ```
  │ ELDA · 20:00
  │ INTRODUCCIÓN   Juan Carlos
  │ ENSEÑANZA      Luis Fernando
  │ TESTIMONIOS    ·············
  ```

  La sede y la hora en la cabecera del carril, la fase en versalitas pequeñas
  con `tracking` abierto y color `muted`, el nombre en peso medio. **Los huecos
  no se esconden**: una fase sin asignar es una línea de puntos que pide que la
  rellenen, y es justo la información que hoy se pierde en el Excel.

- **Con una sola sede, la cabecera del carril solo lleva la hora** (D12).
- **Tipografía con saltos de verdad** (Regla 9): el número del día grande y
  ligero con `tabular-nums`, la fase a 11 px, el nombre a 13. Nada de todo al
  mismo peso.
- **Hoy** no es un círculo azul genérico: es el carril de la columna teñido de
  `bg-brand` y el número en `text-brand`. Una sola marca, y se ve desde lejos.
- Una audacia por pantalla: la cinta. El resto —espaciados, bordes, estados— en
  voz baja y con los tokens de siempre (Regla 3).

### 8.2 Web y escritorio (`apps/web`)

| Ruta                 | Qué es                                         |
| -------------------- | ---------------------------------------------- |
| `/calendar`          | El mes. Es la pantalla principal de la sección |
| `/calendar/week`     | La semana, para sentarse a programar           |
| `/calendar/settings` | Sedes y patrones semanales (`calendar.manage`) |

El día no tiene ruta propia en escritorio: se abre en un panel lateral
(`Drawer`, que ya existe) sobre el mes, para no perder el contexto del que se
viene.

Cabecera de la pantalla, en una línea: mes y año, flechas de anterior y
siguiente, «Hoy», el conmutador **Mes / Semana**, las **pastillas de sede**, el
conmutador de densidad **Compacta / Cómoda** —persistido en
`navis.calendarDensity`— y **«Compartir»** (§9). Programar no es un botón de la
cabecera: se programa tocando la fase.

Las pastillas de sede son un filtro de varias a la vez, con «Todas» a la
izquierda, y **solo aparecen cuando hay más de una** (D12). El filtro se guarda
en `navis.calendarCongregations`, como el de iglesias del listado de usuarios
(RFC 0008 §11): quien lleva Elda trabaja días enteros sobre Elda.

### 8.3 Vistas y navegación por fechas

La vista **predeterminada es el calendario del mes**, y lo es a propósito: la
pregunta que se hace todos los días quien programa es «¿quién va este día?», y
esa se responde mirando una rejilla, no una lista de filtros. Todo lo demás son
formas de mirar lo mismo.

| Vista        | Para qué                                                         | Atajo |
| ------------ | ---------------------------------------------------------------- | ----- |
| **Mes**      | La predeterminada: el mes entero, cada día con sus fases y quién | `M`   |
| **Semana**   | Sentarse a programar: la semana con las fases desplegadas        | `S`   |
| **Agenda**   | Lista continua por días, la de móvil y la de repasar seguido     | `A`   |
| **Personas** | La misma información girada: una fila por persona y sus días     | `P`   |

La vista **Personas** es la que hoy no existe en ningún sitio y la que evita
cargar siempre a los mismos: cada fila es un predicador, cada columna un día del
tramo, y una marca donde le toca. De un vistazo se ve quién va tres veces esta
semana y quién lleva un mes sin subir. Es el reparto de §7.3, pero para mirarlo,
no para leerlo.

La vista elegida se guarda en `navis.calendarView` y viaja en la URL
(`/calendar?view=week&from=2026-08-10`), para que un enlace lleve exactamente a
lo que se estaba mirando.

**Navegación por fechas**, igual en las cuatro vistas:

- **Anterior / Siguiente** mueven un paso del tamaño de la vista —un mes, una
  semana, el tramo de la agenda—, con las flechas `←` y `→` del teclado.
- **«Hoy»** vuelve al presente, y solo se puede pulsar cuando no se está en él.
- **Salto a una fecha**: se toca el título («Agosto 2026») y se abre un
  selector de mes y año; escribir una fecha también vale.
- **Rango a mano**: se arrastra sobre el calendario de día a día y la selección
  queda marcada. Con un rango activo, las vistas se acotan a él, la cabecera
  dice «Del 10 al 23 de agosto» y aparece una `×` para soltarlo. Es lo mismo que
  alimenta la lámina (§9.1): se elige mirando, no rellenando un formulario.
- **Filtros combinables**, todos en la misma barra y todos reflejados en la URL:
  sedes (pastillas), persona (para ver «solo lo de Luis Fernando»), estado
  («solo lo que falta por asignar») y texto (busca por nombre de persona, de
  fase o de reunión).
- **Los filtros no esconden el calendario**: lo atenúan. Filtrar por «sin
  asignar» deja los días completos en gris claro y resalta los huecos, en vez de
  vaciar la rejilla y perder el contexto de la semana.

El estado de la barra vive en un solo sitio (`useCalendarParams`, sobre los
parámetros de la URL) y de ahí lo leen las cuatro vistas: no hay cuatro copias
del mismo filtro que se desincronicen al cambiar de pestaña.

### 8.4 El día con varias sedes

Es el caso que hoy obliga a llevar tres pestañas del Excel, así que el panel del
día está pensado para él:

- Una **sección por sede**, en el orden de `position`, cada una con su color y
  su cinta completa. Las sedes sin nada ese día no ocupan sitio: aparecen al
  final como una línea, «Alicante · sin programación», que al pulsarla crea la
  reunión desde el patrón de esa sede —o, si no hay patrón, pregunta la hora—.
- **«Añadir programación de otra sede»** al pie, siempre visible con
  `calendar.manage`. Si todavía no hay una segunda sede, ese mismo botón la crea
  ahí mismo: nombre y color, dos campos, sin salir del día (D11).
- Duplicar la programación de una sede en otra («la misma de Benidorm en Elda»)
  copia las **fases**, no las personas: los nombres se eligen aparte, que es
  justamente la decisión que se está tomando.

### 8.5 Los tres anchos (Regla 5)

| Ancho             | Qué se ve                                                                       |
| ----------------- | ------------------------------------------------------------------------------- |
| **< `md`** (375)  | Agenda vertical por semanas; cada reunión es una ficha con su cinta completa    |
| **`md`** (768)    | Rejilla del mes, con la fase abreviada y el **nombre de pila**                  |
| **≥ `lg`** (1280) | Rejilla del mes con fase y nombre completos, y la semana como vista alternativa |

Detalles que sostienen eso:

- La rejilla es un `grid` de siete columnas y filas `auto`, con `min-height` por
  celda. Si un día se pasa de alto —tres sedes con cuatro fases cada una—, **la
  celda hace scroll dentro de sí misma**; la página no se desplaza en horizontal
  en ningún ancho.
- Con varias sedes y poco ancho, la celda del mes enseña **una línea por sede**
  con su color y el número de fases sin cubrir, y el detalle se abre al tocar.
  Meter doce nombres en 109 px no es densidad, es ilegibilidad.
- En la agenda de móvil la cabecera del mes es pegajosa, las reuniones se
  agrupan por día y dentro por sede, y la acción principal —«Programar»— va
  abajo y centrada, al alcance del pulgar, con 48 px de alto (`Button` tamaño
  `lg`).
- Los nombres largos se truncan con etiqueta accesible completa; el alemán de
  las fases traducidas se comprueba a 375 px (Regla 2 §9).

### 8.6 Asignar en dos toques

1. Se toca una fase (llena o vacía).
2. Se abre el **selector de personas**: buscador, y debajo la lista con, en cada
   una, «hace 3 semanas · 2 este mes» y su sede si hay varias. Se elige y se
   cierra.

Lo que hace que ese selector sirva para algo:

- Ordena por **quién lleva más tiempo sin subir**, no alfabéticamente. Es la
  pregunta que se está haciendo quien programa.
- Pone primero a los de **esa sede**, sin ocultar al resto.
- Interruptor **«Solo púlpito / Todos»**, y marcar el ministerio desde la misma
  lista (§6.2).
- Avisa en línea si esa persona ya está ese día en otra sede.
- «Quitar asignación» siempre visible, y `Escape` cierra sin guardar.
- **Optimista**: la cinta se actualiza al instante y se revierte con un aviso si
  la API falla. Programar un mes son cincuenta clics; esperar a cada uno es
  perder la tarde.

Teclado y accesibilidad (Regla 9 §5): la rejilla es un `role="grid"` con
_roving tabindex_ —flechas para moverse, `Enter` para abrir el día, `Escape`
para cerrar—, cada celda anuncia su fecha completa y cada fase su sede, su
nombre y a quién tiene. El color de la sede nunca es la única señal: su nombre
está escrito.

### 8.7 La app nativa queda fuera de esta versión

Esta propuesta se implementa **solo en API y web**. La app de escritorio es la
misma web dentro de Tauri, así que la recibe sin trabajo extra; la app móvil
(`apps/mobile`) **no se toca**: su pestaña «Calendario» se queda con la pantalla
puente hasta que exista su propio documento.

Eso **no** rebaja la Regla 5: la web se usa desde el móvil, y el navegador de un
teléfono es el sitio donde se va a mirar la programación y desde donde se va a
mandar la imagen al grupo. La agenda vertical, el objetivo táctil de 44 px y el
comportamiento a 375 px son requisitos de esta versión, no de la siguiente.

Quien no tiene `calendar.manage` ve el calendario en modo lectura: sin selector
y sin fases vacías interactivas.

### 8.8 Animación

- La cinta entra con `opacity` y un desplazamiento corto, escalonado por día;
  nada de rebotes.
- Al asignar, el nombre aparece con un fundido de 150 ms. Al quitar, se va con
  el mismo gesto: es la confirmación de que se ha guardado.
- Cambiar de mes desplaza la rejilla en el sentido de la flecha, con
  `transform`; solo `opacity` y `transform`, y `prefers-reduced-motion` lo apaga
  todo desde `global.css` (Regla 9 §5).

## Compartir el calendario como imagen

Es lo que hoy se hace con una captura de pantalla del Excel y es, en la
práctica, **el producto final del trabajo**: lo que la gente ve no es la
aplicación, es esa imagen. Así que se diseña como una pieza, no como una
exportación.

### 9.1 Qué se puede mandar

Botón **«Compartir»** en la cabecera del calendario, en el panel del día y en la
vista de semana. Abre una hoja con tres decisiones y una vista previa de verdad
—la lámina, a escala, no un icono—:

| Decisión    | Opciones                                                                            |
| ----------- | ----------------------------------------------------------------------------------- |
| **Rango**   | Hoy · Un día · Esta semana · Dos semanas · Tres · Cuatro · El mes · Un rango a mano |
| **Sede**    | Todas · una · varias (las mismas pastillas del filtro)                              |
| **Aspecto** | Claro u oscuro; vertical o apaisada, propuesto según el rango                       |

El **rango a mano** se elige arrastrando sobre el propio calendario —de día a
día— o con dos fechas. Si al abrir la hoja hay un tramo seleccionado o un día
abierto, viene ya elegido: el caso normal es «esto que estoy mirando».

Por defecto: un día y una semana salen **verticales** (se leen de un vistazo en
un móvil); tres semanas y el mes salen **apaisadas** en rejilla. Se puede
cambiar, y la elección se recuerda.

### 9.2 Cómo es la lámina

No es una foto de la pantalla: es una composición pensada para un móvil ajeno,
con el mismo carácter que la aplicación (§8.1) y sin sus controles.

- **Cabecera**: el logo de Navis —el barco, en blanco sobre `brand` (Regla 7)—,
  el nombre de la iglesia y, debajo, el rango escrito en palabras: «Del 10 al 16
  de agosto» o «Viernes 15 de agosto». Si la lámina es de una sola sede, el
  nombre de la sede va grande; si son varias, cada bloque lleva el suyo.
- **Cuerpo**: en vertical, un bloque por día con su cinta de fases; en
  apaisada, la rejilla de siete columnas. Las fases sin asignar salen como línea
  de puntos, **igual que en pantalla**: si falta alguien, que se vea en el
  grupo.
- **Pie**: una línea discreta con la fecha de generación. Sin marca de agua
  encima del contenido.
- **Contraste alto y tipografía grande**: WhatsApp recomprime; la lámina se
  genera al **doble de escala** (2×) y con cuerpos generosos, y se comprueba
  mirándola en un móvil de verdad, no en el monitor.
- **Nada sensible**: solo nombres y fases. Ni teléfonos, ni notas, ni nada de la
  ficha pastoral.

### 9.3 Cómo se genera

En web y escritorio: la lámina se pinta en un árbol de React **propio y aparte**
del calendario, fuera de la vista, con **colores hexadecimales de
`themeColorsHex`** y la pila de fuentes del sistema (D14); después se rasteriza
a PNG y se comparte. La pantalla y la lámina no comparten componentes: comparten
el modelo de datos y las decisiones de diseño, que es lo que hay que mantener a
la par.

El reparto de la salida, en este orden:

1. `navigator.share({ files })` si existe —Android y iOS—: abre el selector del
   sistema y de ahí a WhatsApp. Es el camino real en un móvil.
2. `navigator.clipboard.write()` con `image/png`: «copiada, pégala donde
   quieras». Es el camino en un escritorio.
3. Descargar el fichero, con un nombre que se entienda:
   `navis-elda-2026-08-15.png`, `navis-programacion-2026-08.png`.

Y si el rasterizado falla (navegador viejo, permiso denegado), no se deja a
nadie tirado: **imprimir** abre el diálogo del navegador con la misma lámina en
A4 —apaisado para el mes, vertical para lo demás— vía `@media print`, y sale un
PDF sin librerías. También queda **«copiar como texto»**, que es lo mínimo que
siempre funciona:

```
Viernes 15 de agosto · Elda
  Culto (20:00)
  Introducción · Juan Carlos
  Enseñanza · Luis Fernando
  Testimonios · Cristian Alejandro
```

En el **navegador de un móvil** —que es desde donde se va a mandar— el primer
camino es el bueno: `navigator.share` con el PNG abre la hoja del sistema y de
ahí a WhatsApp, sin pasar por la galería.

### 9.4 El panel de reparto

Junto a la lámina, y compartible igual: quién ha subido cuántas veces, cuándo
fue la última y en qué sedes, con los avisos de §7.3. Es lo que hoy no existe en
ninguna parte y lo que evita cargar siempre a los mismos tres.

## Textos

Sección nueva `calendar.*` en los seis idiomas (Regla 2):

```
calendar.title             calendar.month            calendar.week
calendar.day               calendar.today            calendar.previous
calendar.next              calendar.density          calendar.densityCompact
calendar.densityCosy       calendar.meeting          calendar.meetings
calendar.phase             calendar.phases           calendar.unassigned
calendar.assign            calendar.reassign         calendar.clear
calendar.assignedTo        calendar.searchPerson     calendar.onlyPulpit
calendar.everyone          calendar.lastTime         calendar.timesThisMonth
calendar.never             calendar.markAsPulpit     calendar.noMeetings
calendar.emptyMonth        calendar.cancelMeeting    calendar.cancelled
calendar.addMeeting        calendar.meetingName      calendar.startTime
calendar.notes             calendar.patterns         calendar.patternWeekday
calendar.addPattern        calendar.addPhase         calendar.copyPhasesFrom
calendar.congregation      calendar.congregations    calendar.allCongregations
calendar.addCongregation   calendar.congregationName calendar.congregationColor
calendar.noProgramme       calendar.addForAnother    calendar.lastCongregation
calendar.balance           calendar.warnings         calendar.warnUnassigned
calendar.warnTwiceSameDay  calendar.warnBackToBack   calendar.warnTwoVenues
calendar.share             calendar.shareRange       calendar.shareOneDay
calendar.shareWeek         calendar.shareTwoWeeks    calendar.shareThreeWeeks
calendar.shareFourWeeks    calendar.shareMonth       calendar.shareCustom
calendar.shareAspect       calendar.sharePreview     calendar.shareSend
calendar.shareCopyImage    calendar.shareCopied      calendar.shareDownload
calendar.sharePrint        calendar.shareCopyText    calendar.shareFailed
calendar.generatedOn       calendar.saveFailed       calendar.viewMonth
calendar.viewWeek          calendar.viewAgenda       calendar.viewPeople
calendar.jumpToDate        calendar.range            calendar.clearRange
calendar.filterPerson      calendar.filterPending    calendar.filterSearch
calendar.filtersActive     calendar.clearFilters
```

**«Sede»** en cada idioma: `es` sede · `en` campus · `fr` site · `pt` sede ·
`de` Standort · `it` sede. Es el término que usan las iglesias con varios
lugares de reunión, no una traducción literal de «sucursal».

Y `believers.*` estrena las cuatro que hacen falta aquí —`believers.title`,
`believers.firstName`, `believers.lastName`, `believers.active`—; el resto llega
con la RFC 0003.

Lo que **no** se traduce: los nombres de las fases, de los patrones y de las
sedes son datos de cada iglesia y se guardan tal como los escriben (D6). Los
nombres de meses y días salen de `Intl` con el idioma activo, también en la
lámina. Al crear el primer patrón se **proponen** unas fases por defecto en el
idioma de quien lo crea, y a partir de ahí son suyas.

## Migraciones

Tres, en este orden, y probadas en **los dos motores** (Regla 4):

1. **`CreateCongregations`** — tabla `congregations` y **una sede por iglesia
   existente**, con el nombre de la iglesia y `isDefault: true`. Idempotente:
   si ya la tiene, no la duplica.
2. **`CreateBelievers`** — `believers` (con `congregation_id` y `user_id`
   nulables, §6) y `believer_ministries`.
3. **`CreateMeetings`** — `meeting_patterns`, `pattern_phases`, `meetings` y
   `meeting_slots`, con los índices de §5.4, incluido el único parcial.

Sin más semilla: una iglesia empieza con su sede y sin patrones, y la pantalla
vacía invita a crear el primero (Regla 9 §6). Los tipos que cambian de motor
salen de `database/column-types.ts`, como siempre; `date` y `time` se llaman
igual en los dos, pero **hay que comprobar en SQLite** que TypeORM los devuelve
como texto y no los convierte («Riesgos y trampas»).

## Fases

### Fase 1 — Sedes y el hueso de creyentes · **implementada**

- [x] Entidades `Congregation`, `Believer` y `BelieverMinistry`, a mano en el
      `DataSource`.
- [x] Migraciones `CreateCongregations` y `CreateBelievers`, probadas en SQLite.
- [x] Esquemas zod en `packages/shared/src/schemas/` y servicios acotados por
      iglesia, con sus tests.
- [x] `GET/POST/PATCH/DELETE /calendar/congregations` y los `/believers`
      mínimos.

**Lo que apareció al implementarla**: una iglesia creada **después** de la
migración nacía sin sede. Se resuelve en `CongregationsService.ensureFor`, que
la crea al primer listado con el nombre de la iglesia; hacerlo desde
`ChurchesService` habría invertido la dependencia entre módulos —el calendario
conoce a las iglesias, no al revés—.

### Fase 2 — Patrones y reuniones en la API · **implementada**

- [x] Las cuatro entidades del calendario y `CreateMeetings`, con su índice
      único parcial escrito a mano.
- [x] `PatternsService`, `MeetingsService` y `AssignmentsService`, con la
      expansión del tramo (§7.1) y la materialización (§7.2).
- [x] `CalendarController` con los endpoints de §7 y sus DTO.
- [x] `GET /calendar/summary`: reparto y avisos, incluido el de dos sedes.
- [x] Hooks en `api-client` y `queryKeys.calendar`.

**Cambio sobre §7.2**: la transacción envuelve la **creación** de la reunión con
sus fases, y el reintento ante una carrera se hace fuera. En Postgres, un
choque contra el índice único aborta la transacción entera: releer dentro de
ella fallaría igualmente.

### Fase 3 — El mes en web · **implementada**

- [x] `/calendar`: rejilla a pantalla completa, cinta de fases, hoy marcado.
- [x] Panel del día con secciones por sede y alta de sede en línea (§8.4).
- [x] Selector de personas con actualización optimista y alta rápida.
- [x] Agenda vertical por debajo de `md`.
- [x] Pastillas de sede, con su filtro en la URL.
- [x] Los textos, en los seis idiomas.

### Fase 4 — Vistas, fechas y filtros (§8.3) · **implementada**

- [x] `useCalendarParams`: vista, tramo y filtros en la URL, con su test.
- [x] Vistas de semana, agenda y personas, con sus atajos (`M`, `S`, `A`, `P`).
- [x] Navegación anterior/siguiente/hoy y salto a fecha; flechas en la rejilla.
- [x] Filtros de persona, pendientes y texto, atenuando en vez de vaciar.
- [x] Conmutador de densidad, que además cambia la disposición de la cinta:
      cómoda apila fase y nombre —no corta ninguno—, compacta los pone en línea.
- [ ] Selección de un rango arrastrando sobre el calendario: queda pendiente; el
      rango a mano se elige hoy desde la hoja de compartir.

### Fase 5 — Programar de verdad y compartir · **implementada**

- [x] `/calendar/settings`: sedes y reuniones fijas con sus fases.
- [x] Reunión puntual y alta de sede desde el propio día.
- [x] Panel de reparto y avisos.
- [x] Lámina propia (vertical y apaisada) con `themeColorsHex`.
- [x] Hoja de compartir: rango, formato y vista previa.
- [x] Reparto de la salida: compartir, portapapeles, descarga, imprimir y copiar
      como texto.
- [ ] Cancelar una ocurrencia, mover de sede y copiar las fases de otra: la API
      lo admite (`PATCH /calendar/meetings/:id`), la interfaz todavía no.
- [ ] e2e de Playwright: los de web corren **sin API** y el calendario está tras
      la sesión; hace falta antes montar el arranque de la API en ese proyecto.

**Cambio sobre §9.3**: la vista previa **es** el PNG que se manda. Se rasteriza
la lámina, se enseña esa imagen —que además escala sola a cualquier ancho— y esa
misma es la que sale por compartir, portapapeles o descarga. Así lo que se ve es
literalmente lo que se manda, y un navegador que no sepa rasterizar se descubre
al abrir la hoja y no al pulsar «Enviar».

### Fase 6 — Varios calendarios · **implementada**

- [x] Entidad `Calendar` y migración `CreateCalendars`, que siembra los cuatro
      de serie en cada iglesia y lleva al de púlpito lo que ya estuviera
      programado.
- [x] Todo lo del calendario acotado por `calendar_id`; las rutas pasan a
      `/calendars/:calendarId/…` y las sedes salen del calendario a
      `/congregations` (D17).
- [x] El selector de personas propone el ministerio del calendario (D16), y
      quien se da de alta desde ahí nace ya con él.
- [x] Barra lateral con subentradas —el patrón de Cuentify—: abierta cuando se
      está dentro, y plegada la barra, un enlace al primero.
- [x] Crear, renombrar y borrar calendarios; nunca el último.
- [x] Sedes editables (nombre, ciudad y color) y borrables desde la
      configuración del calendario.

**Cambio sobre §5.0**: renombrar un calendario **no cambia su `slug`**. El slug
es lo que hay en la URL y en los enlaces que alguien haya guardado; el nombre es
lo que se lee.

## Pruebas

- **Unitarias (API)**: expansión de un patrón sobre un tramo —incluyendo
  `validFrom`/`validTo` y un patrón apagado—; materialización idempotente; que
  editar un patrón no toque lo ya materializado (D7); el cálculo de los avisos,
  con el de dos sedes el mismo día; el rango máximo de 92 días; y que no se
  pueda borrar la última sede.
- **Unitarias (web)**: la cinta pinta las fases en orden y marca las vacías; el
  día con tres sedes las agrupa y las ordena por `position`; el selector ordena
  por tiempo sin subir; la actualización optimista se revierte si la API falla;
  el cálculo del rango de la lámina («cuatro semanas desde hoy» cae donde debe).
- **e2e de la API** (contra Postgres): dos iglesias, y la programación de una no
  se ve desde la otra; un rol con `calendar.view` recibe 403 al asignar; dos
  asignaciones simultáneas al mismo día crean **una** reunión; una sede de otra
  iglesia da 404.
- **e2e de web** (Chromium y Pixel 7): programar una fase y verla en la rejilla;
  crear una segunda sede desde el panel del día y programar las dos el mismo
  día; generar la lámina de esa semana y comprobar que el PNG sale con el tamaño
  esperado; la agenda en el perfil móvil; que no haya scroll horizontal a
  375 px.
- **Migraciones**: en SQLite y en Postgres, comprobando que cada iglesia
  existente sale con su sede y que `date` y `time` vuelven como texto.
- Y lo de siempre: `pnpm check`, en los dos temas, a 375 px y con el alemán.

## Riesgos y trampas

- **Regla 6.** Una rejilla de mes y una lámina son los dos sitios naturales
  donde nace un fichero de 400 líneas. Se parten desde el minuto uno:
  `calendar-month.tsx`, `day-cell.tsx`, `meeting-ribbon.tsx`, `slot-line.tsx`,
  `preacher-picker.tsx`, `calendar-agenda.tsx`, `month-header.tsx` y
  `use-calendar-month.ts`; y aparte, `share/poster-portrait.tsx`,
  `share/poster-landscape.tsx`, `share/rasterize.ts` y `share/range.ts`.
- **`oklch` no se rasteriza bien.** Toda la paleta de la aplicación está en
  `oklch` y varios rasterizadores de HTML a imagen lo pierden o lo pintan negro.
  Por eso la lámina usa `themeColorsHex` y estilos en línea (D14), y por eso
  **no reutiliza los componentes del calendario**: en cuanto uno herede una
  clase de Tailwind con `oklch`, vuelve el problema.
- **Fuentes en la lámina**: pila del sistema, que es la que ya usa la
  aplicación. Si algún día entra una fuente web, habrá que incrustarla o la
  imagen saldrá con otra tipografía.
- **La descarga dentro de Tauri** no es la del navegador: hay que comprobar que
  el PNG llega al disco —o resolverlo por el portapapeles— antes de dar la
  Fase 5 por buena en escritorio.
- **`navigator.share` con ficheros no está en todas partes** (falta en varios
  escritorios y en Firefox). Los tres caminos de §9.3 no son adorno: son el
  motivo de que la función sirva en el aparato de cada cual.
- **`date` y `time` en SQLite.** El driver los acepta, pero conviene fijar por
  test que lo que vuelve es `'2026-08-15'` y no un `Date` con hora: si alguna
  vez se convierte, vuelve el error de husos que §5.5 evita.
- **El índice único parcial** hay que escribirlo a mano en la migración; sin él,
  cancelar y volver a programar un día choca con la fila borrada lógicamente.
- **Sede no es iglesia, y se va a confundir.** En la interfaz, en los textos y
  en las revisiones: la sede **no aísla nada**. Quien entra a la iglesia ve
  todas sus sedes. Si alguien pide «que el de Elda no vea Benidorm», eso es una
  iglesia aparte (§5.2), no una sede.
- **Un creyente dado de baja con asignaciones pasadas** no se borra de la
  historia: el nombre se sigue viendo en los meses anteriores y solo desaparece
  del selector.
- **La respuesta del mes crece**: 31 días × varias sedes × varias fases. Se
  devuelve el nombre ya compuesto de la persona y las sedes una sola vez en la
  cabecera; se mide con un mes de tres sedes lleno antes de dar la Fase 2 por
  buena.
- **El cambio de iglesia** invalida `queryKeys.calendar` entero (RFC 0008): un
  mes de otra congregación en pantalla sería un fallo grave de confianza.
- **La hora del patrón y el cambio de horario de verano**: al guardar hora de
  pared, no hay nada que ajustar. Es justamente el motivo de D5, y conviene no
  «arreglarlo» convirtiendo a UTC más adelante.

## Alternativas descartadas

- **Una iglesia (tenant) por cada sede.** Es lo que la RFC 0008 ya permite y es
  demasiado para esto: obliga a cambiar de espacio de trabajo para programar el
  mismo viernes tres veces, a duplicar creyentes y cuentas, y a mandar tres
  capturas de tres calendarios distintos. Queda como el camino correcto para el
  día en que un sitio tenga su propio equipo (§5.2).
- **Una sede «suelta» sin tabla** (un texto en la reunión). Barato hoy y roto
  mañana: sin fila no hay color estable, ni orden, ni filtro, ni patrón por
  sede, y «Elda» y «elda» acaban siendo dos sitios distintos.
- **Capturar la pantalla con un rasterizador genérico del DOM.** Es la solución
  obvia y la peor: arrastra los controles de la interfaz, depende de lo que haya
  visible, se rompe con `oklch` y da una imagen distinta según el ancho de la
  ventana. La lámina se compone (D13).
- **Generar la imagen en el servidor** con un navegador sin cabeza. Calidad
  perfecta y +300 MB en la imagen de Docker de la API, más un proceso pesado por
  cada compartición. No para esto.
- **`RRULE` de la RFC 5545** (lo que proponía la primera versión). Es el modelo
  correcto para un calendario de propósito general y aquí sobra entero: la
  necesidad real es «los viernes a las 20:00». Si algún día hace falta, el
  patrón se sustituye por una regla sin tocar `meetings` ni `meeting_slots`.
- **Una fila por ocurrencia**, generada por adelantado. Simplifica la consulta y
  convierte cualquier cambio del patrón en una migración de datos.
- **Un evento genérico con responsables** (también de la primera versión). Es lo
  que dio origen al problema: mete visitas, ensayos y cultos en la misma tabla y
  deja la fase —que es la unidad real de trabajo— como un `role: text` suelto
  dentro de una asignación.
- **Catálogo global de fases.** Cada iglesia las llama distinto y traducirlas a
  seis idiomas sería inventar un vocabulario que nadie usa. Texto por iglesia
  (D6).
- **Arrastrar y soltar como forma de programar.** Se ve muy bien en una demo y
  es inservible en un móvil y con teclado. Puede añadirse después como atajo de
  escritorio, encima de la asignación por selector, nunca en su lugar.
- **Exportación iCal en la primera versión.** Exige `UID` estables, `VTIMEZONE`
  y decidir qué pasa cuando se cancela una ocurrencia ya suscrita. Se hará
  cuando exista el enlace creyente ↔ cuenta (§6.3) y tenga sentido un calendario
  **por persona**, que es lo que la gente querría suscribir.
- **Programar por persona en vez de por día** («dale tres viernes a Luis»).
  Suena cómodo y choca con cómo se decide de verdad: se mira el día y se
  pregunta quién libra.

## Criterios de aceptación

- [ ] Un patrón «viernes 20:00 en Elda, con cuatro fases» llena todos los
      viernes del mes sin crear una sola fila hasta que alguien asigna.
- [ ] Asignar a una persona en un día propuesto crea la reunión con sus fases y
      la asignación, en una sola llamada, y repetirla no duplica nada.
- [ ] El mismo viernes 15 tiene programación de Benidorm, Alicante y Elda, se
      ven las tres en el día y cada una se puede mandar por separado.
- [ ] Crear una sede nueva se hace **desde el día que se está programando**, con
      dos campos, sin salir de la pantalla.
- [ ] Con una sola sede, la palabra «sede» no aparece en ninguna parte.
- [ ] Editar el patrón cambia lo que sigue siendo propuesta y no toca los días
      ya programados.
- [ ] El mes se lee de un vistazo: cada día enseña sus fases con quién las
      ocupa, y las vacías se distinguen sin leer el texto.
- [ ] Desde el navegador del móvil se genera y se manda por WhatsApp la imagen
      de un día, de una semana, de cuatro semanas y del mes, y se lee sin
      ampliar.
- [ ] La vista predeterminada al entrar es el mes, y las cuatro vistas comparten
      tramo y filtros al cambiar de una a otra.
- [ ] Un enlace a `/calendar?view=week&from=…` abre exactamente lo que se estaba
      mirando.
- [ ] La imagen sale igual con el calendario en claro o en oscuro, y no incluye
      controles de la aplicación.
- [ ] A 375 px hay agenda vertical, sin scroll horizontal, y con el alemán no se
      rompe ninguna ficha.
- [ ] Se puede recorrer y programar el mes entero **solo con el teclado**.
- [ ] Un rol con `calendar.view` ve la programación y no puede cambiarla, ni por
      la interfaz ni llamando a la API.
- [ ] La programación de una iglesia no se ve desde otra.
- [ ] Los textos están en los seis idiomas y todo se ve bien en claro y oscuro.
- [ ] `pnpm check` y `pnpm test:e2e` en verde, y las migraciones probadas en
      SQLite y Postgres.
