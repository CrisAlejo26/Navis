# RFC 0010: Listas

- **Estado**: **Implementado** (API y web)
- **Fecha**: 2026-08-05 · implementado el mismo día
- **Apps afectadas**: **api y web** (escritorio la hereda). Móvil, no: ver
  «Fuera de alcance». Toca además **nginx**, el **prefijo global de la API** y
  el **service worker**: los tres están en §11, y sin cualquiera de ellos la
  funcionalidad no llega a producción.
- **Depende de**: 0003 (creyentes: la gente que va dentro y la que mira), 0008
  (la iglesia como espacio de trabajo) y **0009 (exportar)**, del que sale
  gratis todo el apartado de formatos.
- **Se parece a**: el RFC 0002 en la forma —subentradas en la barra lateral,
  una lámina que se comparte— y se separa de él en lo importante: **esto sale a
  la calle**. Es la primera funcionalidad del proyecto que alguien sin cuenta
  puede abrir, y eso sube el listón de todo lo demás.

## Problema

En una iglesia hay listas de personas todo el rato, y todas viven fuera de la
aplicación: quién predica este mes, quién está en recepción, quién lleva el
sonido, quién recoge la ofrenda, quién reparte las biblias. Se escriben en un
papel que se pega en la puerta, o en un mensaje de WhatsApp que se pierde en
cuanto llegan diez mensajes más.

Los datos ya están dentro: las personas están en creyentes, con su sede, sus
labores y sus dones. Lo que falta es poder **agrupar**, **ordenar** y —esto es
lo nuevo— **enseñárselo a quien no tiene cuenta**. Porque quien tiene que ver la
lista del púlpito no es el pastor: es la gente de la congregación, que no tiene
usuario de la aplicación ni lo va a tener.

Pero «sin cuenta» no puede querer decir «cualquiera». Hay listas que se cuelgan
en la puerta y hay listas que solo debería ver un grupo concreto —los ancianos,
los responsables de sede—, y hoy la única forma de hacer esa distinción es no
compartir nada. Hace falta poder decidirlo lista a lista, dar una llave a una
persona **para varias listas de una vez**, y quitársela sin tocar las demás.

Y hace falta saber si esto sirve para algo. Un papel en la puerta no dice cuánta
gente lo ha mirado; un enlace, sí. Y si el enlace pide acceso, deja de decir
cuánta gente y pasa a decir **quién**.

## Alcance

Entra:

- Una sección nueva en el bloque de iglesia: **Listas**, con **una subentrada
  por lista**, igual que el calendario (D3).
- Crear listas con su nombre, su descripción y su color. Cinco de serie:
  púlpito, recepción, sonido, biblias y ofrenda.
- Meter personas **desde el listado de creyentes**, marcándolas, con todos sus
  filtros disponibles: por labor, por sede, por don, por estado.
- **Ordenar** a mano dentro de la lista: en una lista de púlpito el orden es el
  dato.
- **Tres modos de visibilidad** por lista (D9): sin publicar, abierta con el
  enlace, o **restringida a unos accesos concretos**.
- Un **directorio de accesos** de la iglesia —usuario y contraseña— donde
  **un mismo acceso abre las listas que se le concedan**, marcándolas con una
  casilla (D19). Sin crear un usuario por lista.
- Un acceso puede estar **enlazado a un creyente** (D20): se elige a la persona,
  se le genera usuario y contraseña, y eso le sirve **solo para ver listas** —no
  es una cuenta de la aplicación (D22)—.
- Alta **en lote** desde una lista, con su hoja de credenciales para repartir
  una sola vez (D29).
- **Publicar** una lista en un enlace que se abre sin cuenta, con su vista
  previa de WhatsApp bien hecha —logo, título y descripción—.
- **Saber quién la ve**: cuántas visitas, cuántas personas distintas, cuándo,
  desde qué aparato y desde dónde llegaron. Y en las restringidas, **con nombre
  y apellidos** (D35).
- Ver, desde creyentes, **en qué listas está cada persona**, **cuáles puede
  ver**, y filtrar por lista.
- Estadísticas de cada lista: cómo está compuesta y quién la mira.
- Exportarla en los cinco formatos del RFC 0009, sin escribir un escritor más.
- Los textos, en los seis idiomas.

### Fuera de alcance

- **La app móvil.** Como en las cinco RFC anteriores. Con un matiz que sí
  importa: la **página pública** tiene que verse perfecta en un teléfono,
  porque ahí es donde se va a abrir el noventa por ciento de las veces. Eso no
  es la app móvil, es la web a 375 px, y es requisito (Regla 5).
- **Que un acceso sea una cuenta de la aplicación.** D22. Ni entra en el panel,
  ni tiene rol, ni perfil, ni correo, ni recuperación de contraseña.
- **Listas dinámicas por filtro** («todos los que tengan la labor púlpito»). D5:
  no es que cueste, es que está mal para algo que se publica.
- **Que estar en una lista dé acceso a verla.** D21. Son dos cosas distintas y
  fundirlas es el error que más caro saldría.
- **Que alguien de fuera escriba en la lista** —apuntarse, confirmar
  asistencia—. Eso es un formulario público, con correo, verificación,
  moderación y basura. Es un RFC propio y probablemente el siguiente que se
  pida.
- **Notificar a quien entra en una lista.** Es útil y no se puede hacer todavía:
  hoy no hay canal de salida. Va con el RFC 0006.
- **Listas de cosas que no son personas** (materiales, canciones, tareas). Una
  lista **es un conjunto de creyentes**, y el día que haga falta otra cosa será
  otra cosa.
- **Analítica de verdad** (embudos, sesiones, mapas de calor). Aquí se cuenta lo
  que se puede contar de una página que se abre y se lee.

## Vocabulario

| Palabra             | Qué es                                                                    |
| ------------------- | ------------------------------------------------------------------------- |
| **Lista**           | Un conjunto ordenado de creyentes de una iglesia, con nombre y color      |
| **Miembro**         | Un creyente **dentro** de una lista, en una posición                      |
| **Publicar**        | Darle a la lista un enlace que se abre sin cuenta                         |
| **El enlace**       | `https://navis…/l/<token>`. El token es un secreto, no un nombre (D10)    |
| **Abierta**         | Publicada: la ve cualquiera que tenga el enlace                           |
| **Restringida**     | Publicada, pero pide usuario y contraseña de un acceso concedido (D9)     |
| **Acceso**          | Un usuario y una contraseña de la iglesia. **No es una cuenta** (D22)     |
| **Concesión**       | Que un acceso concreto pueda abrir una lista concreta (D19)               |
| **La tarjeta**      | Lo que enseña WhatsApp al pegar el enlace: imagen, título y descripción   |
| **Visita**          | Alguien abrió la página. Una por persona y media hora (D33)               |
| **La estela**       | El dibujo de las visitas de los últimos treinta días (§8.4)               |
| **El solapamiento** | En cuántas listas más está la gente de esta. La métrica que importa (D36) |

Y una distinción que hay que tener clarísima desde la primera línea, porque es
la que se confunde sola (D21):

> **«Estar en una lista» y «poder ver una lista» son dos cosas distintas.**
> Juan puede estar en la lista de púlpito —sale en el cartel— sin poder abrir el
> enlace. Y Ana puede abrir la lista de púlpito sin salir en ella.

## Cómo se llama la sección, y por qué

**«Listas»**, en el bloque de iglesia, entre el calendario y los creyentes.

Se han mirado otros nombres:

- **«Listas compartidas»** —lo que se pidió— es más exacto, pero en la barra
  lateral no cabe: en alemán es _Geteilte Listen_ y a 240 px de barra se corta
  a media palabra (Regla 5 §6). Se queda como **título de la pantalla**: la
  barra dice «Listas» y la portada dice «Listas compartidas».
- **«Equipos»** describe mejor las cinco de serie, y describe mal la sexta que
  alguien cree: «los que van al retiro» no es un equipo.
- **«Rol»** es como se llama de verdad la lista de la tripulación de un barco, y
  encajaría perfecto con la Regla 9… salvo que en esta aplicación un rol es un
  conjunto de permisos. Descartado por colisión, con pena.

«Listas» es lo que la gente va a decir en voz alta cuando hable de esto, y ese
es el criterio.

## Decisiones tomadas

### La lista

- **D1 — Una lista es de la iglesia, no de la sede.** El equipo de sonido de una
  iglesia con tres sedes es uno, y la gente rota entre ellas. Lleva `church_id`,
  `ActiveChurchGuard` y permisos de rol, como el calendario y los creyentes. La
  sede aparece **dentro** de la lista, como un dato de cada persona y como un
  filtro al añadir; no la parte en tres.

- **D2 — Una lista contiene creyentes, no nombres sueltos.** Nada de texto
  libre. Es lo que hace posible el resto: la ficha de la persona sabe en qué
  listas está, el solapamiento se puede contar, y cambiar un apellido lo cambia
  en las siete listas donde sale. Quien todavía no esté en creyentes se da de
  alta ahí —desde el mismo diálogo, como ya hace el selector de predicadores del
  calendario—, no se escribe a mano en la lista.

- **D3 — Subentradas en la barra lateral, reutilizando lo del calendario.**
  `NavGroup` ya hace exactamente esto (RFC 0002 D15). Se le pasa la lista de
  listas activas, ordenadas por `position`, y no se toca ni una línea de ese
  componente. En `AppNav`, el `item.to === '/calendar'` que hoy decide qué
  entrada es un grupo pasa a ser una propiedad del propio `NavItem`
  (`children?: 'calendars' | 'lists'`): dos casos ya no son un caso especial.

- **D4 — Cinco listas de serie, sembradas literalmente.** Púlpito, recepción,
  sonido, biblias y ofrenda, vacías, `private`, y con su color. La migración las
  escribe **a mano, sin importar ninguna constante**: es la trampa de
  `CreateRoles` documentada en `CLAUDE.md`. Y `ChurchesService` las siembra al
  crear una iglesia, igual que ya hace con dones y labores.

  Su color **es el de su labor** en el catálogo de la iglesia, cuando existe:
  así «Púlpito» es del mismo color en el calendario, en la etiqueta de un
  creyente y en su lista. Como eso se lee de la base de datos dentro de la
  migración, lo que devuelva `queryRunner.query` **se comprueba antes de
  usarlo** —devuelve `any` y no acepta genérico (Regla 10, `CLAUDE.md`)—, y si
  la labor no está, se cae a un color de `ACCENT_PALETTE` por posición.

- **D5 — La pertenencia es manual y explícita. No hay listas dinámicas.** La
  tentación es evidente: una lista es «los que tienen la labor púlpito» y se
  actualiza sola. Y es justo lo que no se quiere en algo **publicado**: alguien
  edita la ficha de un hermano un martes y desaparece de un cartel que lleva
  circulando por WhatsApp desde el domingo, sin que nadie lo haya decidido.

  Lo que sí se hace es **llenarla con los filtros**: desde creyentes, se filtra
  por labor, sede, don o estado, se marcan los que interesan y se añaden. El
  filtro es la herramienta; la pertenencia es la decisión.

- **D6 — El orden es una columna, y se toca a mano.** `position`, entero. En una
  lista de púlpito el orden es el mes; en una de recepción, el turno. Se arrastra
  para reordenar, y hay botones de subir y bajar por teclado —arrastrar no es
  accesible por sí solo—.

- **D7 — El `slug` se genera una vez y no cambia al renombrar.** Igual que en las
  labores. Renombrar «Púlpito» a «Predicación» no puede romper el enlace interno
  que alguien tenga guardado ni el que esté abierto en otra pestaña. El nombre es
  lo que se lee; el slug es una dirección.

### Publicar

- **D8 — Publicar es un acto aparte, con su permiso y su botón.** Editar una
  lista y **echarla a internet** no son la misma acción. Tres permisos:
  `lists.view`, `lists.manage` y `lists.share`. De serie: el pastor los tres;
  recepción, ver y gestionar; los demás, ver. Gestionar accesos va con
  `lists.share`: repartir llaves es parte de abrir la puerta.

  La interfaz lo trata como lo que es: publicar abre una confirmación que dice
  **qué campos van a salir y quién va a poder verlos**. Mientras está publicada,
  la ficha lleva una banda permanente —no un aviso que se va— con el enlace, el
  modo y el botón de dejar de compartir.

- **D9 — Tres modos de visibilidad, no un interruptor.** Una columna
  `visibility` con tres valores:

  | Valor        | En la interfaz   | Qué significa                                 |
  | ------------ | ---------------- | --------------------------------------------- |
  | `private`    | **Sin publicar** | Solo se ve dentro. No hay enlace              |
  | `link`       | **Abierta**      | Cualquiera con el enlace la ve                |
  | `restricted` | **Con acceso**   | El enlace lleva a una puerta; hay que abrirla |

  Tres estados y no un booleano «pública sí/no» más otro «pide contraseña
  sí/no»: dos banderas dan cuatro combinaciones y una de ellas —«no pública
  pero con contraseña»— no significa nada. Un estado con tres valores no puede
  quedarse en una combinación imposible.

  `visibility` es **la** fuente de verdad del estado; `share_token` es el
  secreto, no el estado. Los dos se escriben en el mismo servicio y en la misma
  transacción. Los valores van en inglés porque son internos y la interfaz los
  traduce, a diferencia de los estados de un sueño o una profecía, que son
  vocabulario del oficio.

- **D10 — El enlace es un secreto, no un nombre.** `/l/<token>`, con 16 bytes de
  `randomBytes` en base64url (22 caracteres). **No**
  `/l/iglesia-el-faro/pulpito`: un enlace adivinable no es un enlace privado, y
  aquí hay nombres de personas detrás.

  Y por eso mismo: `<meta name="robots" content="noindex, nofollow">` y una
  `robots.txt` que excluye `/l/`. **Un enlace público no es un sitio web
  público**: se comparte con quien se comparte, y no se busca en Google.

- **D11 — Dejar de compartir mata el enlace de verdad, y rotarlo es otra acción.**
  Al despublicar, el token se borra, las sesiones abiertas se invalidan (D28) y
  la URL pasa a dar 404 —no un «esta lista ya no está disponible», que también
  cuenta algo—. Volver a publicar da un token **nuevo**.

  Y aparte, **«Cambiar el enlace»**: mantiene la lista publicada y el modo, y
  solo tira el token viejo. Es lo que hace falta cuando un enlace se filtra y no
  se quiere cerrar la lista a quien la usa bien.

- **D12 — Pasar de abierta a restringida cambia el enlace, obligatoriamente.**
  Es un fallo que se cuela solo. WhatsApp **cachea la tarjeta** —imagen, título
  y descripción— en sus servidores durante semanas, y no hay forma de decirle
  que la olvide. Una lista publicada como abierta, compartida en un grupo de
  cincuenta personas, y cambiada después a restringida seguiría enseñando en ese
  chat la imagen con los nombres dentro.

  Como el caché va por URL, la única defensa real es **que la URL deje de ser la
  misma**: al pasar a `restricted` se rota el token (D11) y se dice en el
  diálogo, porque significa volver a repartir el enlace. Al revés —de
  restringida a abierta— no hace falta.

- **D13 — Caducidad opcional.** `share_expires_at`, nulo por defecto. Una lista
  de un retiro concreto caduca; la del sonido, no. Caducada se comporta igual
  que despublicada: 404, mismo cuerpo. Se avisa en la ficha siete días antes.
  Los accesos tienen su propia caducidad, aparte, y **manda la primera de las
  dos que llegue**.

- **D14 — La vista previa de WhatsApp obliga a que conteste el servidor.** Es el
  punto técnico que decide la arquitectura de esta funcionalidad:

  La web es una SPA de Vite servida como ficheros estáticos por nginx, con un
  `index.html` fijo. **Los rastreadores de WhatsApp, Telegram, Twitter o Slack
  no ejecutan JavaScript**: leen el HTML que llega y se van. Una etiqueta `og:`
  puesta por React no la ve nadie. Sin esto, el enlace se pega y sale el título
  genérico de Navis para las cinco listas.

  Así que **`/l/<token>` lo sirve la API**:

  1. nginx gana un `location /l/` que apunta al contenedor de la API, **antes**
     del `location /` que lo manda todo a la web.
  2. En `main.ts`, `/l` se añade al `exclude` de `setGlobalPrefix` —donde hoy
     solo está `health`— y la ruta va **`VERSION_NEUTRAL`**: con el prefijo y el
     versionado por URI quedaría en `/api/v1/l/…` y el enlace dejaría de ser el
     enlace. Es la misma decisión que ya está tomada para `/health`
     (`CLAUDE.md`).
  3. La API devuelve un documento pequeño con las `og:` de esa lista, el
     `noindex` de D10, un `<noscript>` con lo que corresponda según el modo, y
     una redirección a `/lists/s/<token>`, que es la ruta bonita de la SPA.
  4. La SPA la pinta como Dios manda y pide el JSON a `/api/v1/public/lists/…`.

  Y un efecto secundario que sale gratis y que es justo lo que hace falta: **el
  rastreador se queda en el documento y no llega al JSON**, así que las vistas
  previas de WhatsApp **no cuentan como visitas** (D31).

- **D15 — El service worker se come el enlace si no se le dice que no.** El
  `vite.config.ts` de hoy tiene `navigateFallback: '/index.html'` **sin
  `navigateFallbackDenylist`**. En la primera carga no pasa nada, pero una vez
  instalado el service worker, cualquier navegación —incluida `/l/<token>`— la
  contesta él con `index.html` y **nunca llega a nginx ni a la API**. El enlace
  funcionaría en un teléfono cualquiera y fallaría justo en el de quien tiene la
  aplicación instalada, que es quien la comparte.

  Se añade `navigateFallbackDenylist: [/^\/l\//, /^\/api\//]`. Es primo de la
  trampa de Playwright que ya está en `CLAUDE.md` —«un service worker activo se
  come los `page.route`»— y merece su propio spec.

- **D16 — Lo que sale en público está en una lista blanca cerrada.** El mapeador
  público construye la respuesta **campo a campo**, no filtrando el creyente
  entero. Con una lista negra, la columna que alguien añada mañana saldría
  publicada por omisión.

  | Puede salir                        | No sale nunca, y no hay opción para activarlo |
  | ---------------------------------- | --------------------------------------------- |
  | Nombre (entero o con inicial)      | Teléfono y correo                             |
  | Posición en la lista               | Cumpleaños                                    |
  | Nota de la lista («solo domingos») | Estado, dones, alertas                        |
  | Sede _(opcional, apagado)_         | Las notas de la bitácora                      |
  | Labor _(opcional, apagado)_        | Cualquier identificador interno               |
  | Foto _(opcional, apagado)_         | Si esa persona tiene acceso, y a qué          |

  Por defecto sale **el nombre y la posición**, y nada más. La foto viene
  apagada a propósito: publicar la cara de alguien —que puede ser menor— en una
  URL abierta se decide a conciencia, no en una casilla que ya estaba marcada.

  Y **un creyente con `deleted_at` no sale nunca**, aunque su fila siga en
  `list_members`. El borrado lógico tiene que llegar hasta el cartel; si no,
  alguien a quien se dio de baja sigue publicado.

- **D17 — Las fotos públicas necesitan su propia puerta.** Es un fallo que el
  plan tenía y que solo se ve mirando el código: hoy la foto se sirve en
  `GET /believer-photos/:id`, con `ActiveChurchGuard` y `believers.view`. Desde
  la página pública **eso devuelve 401 y la foto no carga**.

  Hace falta una ruta propia, `GET /l/:token/photos/:believerId`, que compruebe
  en este orden: que el token vale, que la lista está publicada y no caducada,
  que en modo restringido hay cookie con concesión, que la foto está activada en
  `public_fields`, y que ese creyente **está en esa lista**. Cinco condiciones,
  y la última es la que impide usar el token de una lista para sacar la foto de
  cualquiera.

  Y para la lámina que se rasteriza hay otra consecuencia: `rasterize.ts` exige
  que el nodo sea autocontenido —«imágenes en `data:`»—, así que la portada
  incrusta las fotos como `data:` y no como `src` remotos.

- **D18 — La imagen de la tarjeta la hace el navegador de quien comparte.** Para
  que WhatsApp enseñe una tarjeta bonita hace falta un PNG, y generarlo en el
  servidor pediría un navegador dentro del contenedor de la API. Pero el
  rasterizador del RFC 0002 ya existe y ya está en la web: al publicar, el
  navegador compone la lámina, la rasteriza con `nodeToPng` y la sube a
  `POST /lists/:id/cover`. Se guarda con `ImageStorageService` en
  `churches/<churchId>/`, donde ya viven las fotos, y se sirve en
  `/l/<token>/card.png`.

  Sin portada todavía, la tarjeta cae al `/og-image.png` de siempre: se degrada,
  no se rompe.

  **En modo restringido la portada es otra**: el color de la lista, el nombre de
  la iglesia, el nombre de la lista y una línea diciendo que hace falta acceso.
  Ni un nombre, ni el número de personas. El `<noscript>` de D14, igual: el
  formulario, no la lista. Y la descripción de la tarjeta es la que escribió su
  dueño o una genérica —**nunca una generada a partir del contenido**—.

### Quién puede verla

Este bloque es el que responde a «que unas listas las vea todo el mundo y otras
solo quien yo diga, sin crear un usuario por lista». Es la parte con más
superficie de ataque del proyecto, así que las decisiones van con su porqué
entero.

- **D19 — Los accesos son de la iglesia, y un mismo acceso abre las listas que se
  le concedan.** Es la decisión central. Dos tablas:

  - `list_viewers` — el **directorio** de la iglesia: usuario, contraseña
    cifrada, nombre para reconocerlo, caducidad, activo.
  - `list_grants` — **qué acceso abre qué lista**: `(viewer_id, list_id)`.

  Con esto, dar a los ancianos las cuatro listas que les tocan es **marcar
  cuatro casillas**, no crear cuatro usuarios con cuatro contraseñas. Y quitarles
  una es desmarcar una: las otras tres siguen igual, sin cambiar ninguna
  contraseña ni avisar a nadie.

  La alternativa era guardar usuario y contraseña dentro de cada lista. Se
  descarta por dos motivos, y el segundo es el que manda:

  1. Los mismos ancianos van a ver cuatro listas, y con credenciales por lista
     habría cuatro contraseñas que repartir y que cambiar cuatro veces.
  2. **Es lo que hace posible la regla que se pidió.** Con un directorio, «este
     usuario y contraseña son válidos, pero no para esta lista» es una consulta
     de una línea a `list_grants`. Con credenciales por lista, la misma pareja
     escrita en dos listas serían dos secretos distintos que casualmente
     coinciden, y comprobar que uno no vale en la otra sería comprobar que no
     coinciden: funcionaría por accidente hasta el día en que alguien reutilizara
     la contraseña.

  El usuario es único por iglesia. Y no hay directorio entre iglesias: un acceso
  pertenece a una y no existe fuera de ella (D1).

- **D20 — Un acceso puede ser de un creyente, o no serlo.** `believer_id`,
  nulo permitido:

  - **Enlazado a un creyente**: se elige a la persona en el buscador de siempre,
    y el acceso hereda su nombre y su foto. El usuario se propone a partir del
    nombre (`juan.perez`, con sufijo si ya existe) y se puede cambiar. Es lo que
    convierte «alguien entró ayer a las 21:14» en «**Juan Pérez** entró ayer a
    las 21:14», con su cara al lado (D35).
  - **Sin creyente**: un acceso de grupo —«Ancianos», «Responsables de sede»—,
    que es lo que hace falta cuando la llave la comparten varios y no interesa
    saber cuál de ellos abrió.

  Los dos conviven en el mismo directorio porque son la misma cosa —una llave— y
  se usan igual. Un creyente tiene **como mucho un acceso**; el índice único va
  sobre `(church_id, believer_id)`, y como los nulos no chocan entre sí en
  ninguno de los dos motores, eso permite a la vez «uno por creyente» y «tantos
  sin creyente como haga falta».

  El creyente tiene que ser **de la iglesia activa**: se comprueba en el
  servicio, no solo en la interfaz.

- **D21 — Estar en una lista y poder verla son cosas distintas, y no se enlazan
  solas.** Añadir a Juan a la lista de púlpito **no** le da acceso a abrirla, y
  darle acceso **no** lo mete en la lista. Son dos tablas, dos gestos y dos
  pantallas.

  Es la decisión más fácil de romper «por comodidad» y la que más caro saldría:
  quien está en una lista de personas a las que hay que llamar no debería poder
  leerla, y quien la lee —una secretaria, un anciano— casi nunca sale en ella.
  Enlazarlas convertiría cada alta de miembro en un alta de credenciales sin
  que nadie lo hubiera pedido.

  Lo que sí hay es **un atajo explícito**, que es distinto de un automatismo:
  desde la lista, «Dar acceso a los de esta lista» (D29). Se pulsa, se ve a
  quién va a afectar y se confirma.

- **D22 — Un acceso no es una cuenta.** No entra en `user`, no es Better Auth,
  no tiene rol, ni perfil, ni sesión de aplicación, ni correo, ni recuperación
  de contraseña. Es **una llave de una puerta concreta**, y lo único que puede
  hacer en todo el sistema es leer las listas que se le hayan concedido.

  Se dice aquí porque es la confusión que va a llegar sola: en cuanto exista un
  campo «usuario» y otro «contraseña» —y más aún estando enlazado a un
  creyente—, alguien va a querer que esa persona «entre en la aplicación». La
  respuesta es no: para eso se le crea una cuenta de verdad, con su rol, que es
  otra pantalla y ya existe.

  Consecuencia práctica y no negociable: **las dos autenticaciones no comparten
  nada**. Ni tabla, ni cookie, ni guard, ni servicio, ni clave de firma. Un
  fallo en una no puede abrir la otra. Y si un creyente tiene además cuenta de
  la aplicación, son dos identidades distintas que da la casualidad de que son
  la misma persona.

- **D23 — La cookie dice quién eres, nunca qué puedes ver.** Al acertar la
  contraseña se devuelve una cookie `HttpOnly`, `Secure`, `SameSite=Lax`,
  firmada, que contiene **el identificador del acceso y una caducidad**, y nada
  más. En **cada** petición a una lista restringida se vuelve a consultar
  `list_grants`.

  No es un detalle de implementación, es lo que hace que se cumpla lo que se
  pidió. Si la cookie llevara dentro «puede ver A y B», quitarle el permiso a
  alguien no tendría efecto hasta que caducara, y una cookie manipulada valdría
  para lo que dijera ella. La autorización se comprueba **al servir**, contra la
  base de datos, siempre.

  De aquí sale, gratis, la otra mitad de lo que se pidió: **una sola entrada
  abre todas sus listas**. Quien ya entró en púlpito abre el enlace de sonido y
  no le pide nada, porque la cookie ya dice quién es y la concesión existe. Si
  no existe, ve el mensaje de D26 sin escribir nada.

  Se firma con HMAC sobre una clave derivada de `BETTER_AUTH_SECRET` con una
  etiqueta propia (`'list-access'`): sin variable de entorno nueva y sin que las
  dos claves sean la misma. Dura **12 horas**, sin renovación automática: es una
  puerta que se abre para una consulta, no una sesión de trabajo.

- **D24 — La contraseña se guarda con `scrypt` y se enseña una sola vez.**
  `crypto.scrypt` está en la biblioteca estándar de Node —sin dependencia nueva,
  sin compilar nada—, con `N = 2^14, r = 8, p = 1`, 32 bytes de clave y 16 de
  sal **por acceso**. Se guarda `scrypt$N$r$p$sal$clave`, con los parámetros
  dentro, para poder subirlos dentro de unos años sin invalidar lo que ya hay.

  `2^14` y no `2^15` a propósito: son unos 50 ms, el bucle de eventos de Node
  reparte `scrypt` en un pool de **cuatro** hilos por defecto, y esto cuelga de
  un endpoint público. Con `2^15` bastarían diez intentos simultáneos para dejar
  la API sorda un segundo. Se usa siempre la versión **asíncrona**, nunca
  `scryptSync`, y el freno de D27 acota el resto.

  Se enseña **una sola vez**, al crearla o al regenerarla, con su botón de copiar
  y el aviso de que no va a volver a verse. Es lo que se hace con una clave de
  API, y por el mismo motivo: una contraseña que se puede volver a leer desde
  una pantalla es una contraseña que está en claro en alguna parte. Perderla no
  es un problema: se regenera.

  La comparación es en **tiempo constante** (`timingSafeEqual`), y cuando el
  usuario no existe **se compara igual contra un hash de mentira**, para que
  tardar menos no delate que ese usuario no está.

- **D25 — La contraseña se genera sola, y se genera para escribirla en un
  teléfono.** El campo nace **ya relleno** con una generada: es la opción por
  defecto, no un botón escondido. Y se genera pensando en que alguien la va a
  leer en voz alta y otro la va a teclear con el pulgar:

  - Alfabeto sin caracteres que se confunden: fuera `0 O o`, `1 l I`, `5 S`,
    `2 Z`.
  - Doce caracteres en **tres grupos de cuatro separados por guiones**:
    `k7fr-m3np-t9wx`. Se lee, se dicta y se comprueba a simple vista.
  - De `crypto.getRandomValues`, nunca de `Math.random`.
  - Los guiones **no cuentan al comprobarla**: quien la escriba sin ellos entra
    igual. La normalización vive en `packages/shared` y la usan los dos lados.

  Quien prefiera escribirla a mano puede, con un mínimo de ocho caracteres. El
  botón de volver a tirarla está siempre al lado.

- **D26 — Autenticar y autorizar son dos pasos, y dan dos mensajes distintos.**
  Primero quién eres, después si esta lista es tuya:

  | Situación                                  | Respuesta | Mensaje                             |
  | ------------------------------------------ | --------- | ----------------------------------- |
  | Usuario que no existe, o clave incorrecta  | 401       | «Usuario o contraseña incorrectos»  |
  | Acceso caducado o desactivado              | 401       | El mismo mensaje                    |
  | Correctos, pero sin concesión a esta lista | 403       | «Este acceso no incluye esta lista» |

  Los dos primeros dan **el mismo texto** a propósito: distinguirlos convierte el
  formulario en una máquina de averiguar qué usuarios existen.

  El tercero sí se distingue, y es un compromiso deliberado que conviene tener
  escrito. Lo que se filtra es: **quien ya tiene credenciales válidas** puede
  averiguar si le alcanzan para otra lista. No es un atacante anónimo, es
  alguien a quien ya se le dio una llave. A cambio, quien tiene acceso legítimo
  y se equivoca de enlace lee «este acceso no incluye esta lista» en vez de
  «contraseña incorrecta», que le haría teclear la buena diez veces y acabar
  llamando por teléfono. El intercambio compensa; si algún día no compensara, se
  cambia a 401 y una línea.

- **D27 — Contra la fuerza bruta se frena el origen, no la cuenta.** Bloquear un
  acceso tras cinco fallos suena prudente y es un regalo: cualquiera con el
  enlace podría dejar fuera a los ancianos fallando cinco veces a propósito. Lo
  que se frena es **de dónde vienen los intentos**:

  - Diez intentos por prefijo de IP y lista cada quince minutos; pasado eso,
    `429` con el tiempo que falta.
  - Un retardo pequeño y creciente a partir del tercer fallo, del lado del
    servidor.
  - Cada intento —bueno o malo— se apunta con su resultado (§6.7), y la ficha lo
    enseña: veinte fallos seguidos desde un sitio son una noticia.

  El acceso solo se desactiva si lo desactiva una persona. Y esto **depende de
  que la IP sea la de verdad**: ver D32 y §11.

- **D28 — Revocar revoca de verdad.** Cada acceso lleva un
  `sessions_valid_from`. Al regenerar la contraseña, desactivar el acceso,
  borrarlo, quitarle una concesión o despublicar la lista, se pone a la hora
  actual y **todas las cookies emitidas antes dejan de valer al instante**.

  Quitar **una** concesión no necesitaría tocar la marca —la comprobación
  contra `list_grants` de D23 ya lo cubre en la petición siguiente— y aun así se
  toca, porque el coste es cero y así «revocar» significa lo mismo en los cinco
  casos. Lo que nadie espera al pulsar «Revocar» es que tarde doce horas.

- **D29 — Alta en lote, con la hoja de credenciales de una vez.** Desde una
  lista: **«Dar acceso a los de esta lista»**. Enseña a quién va a afectar
  —solo a los miembros que **no** tienen ya acceso—, crea un acceso por persona
  con su contraseña, y les concede **esa** lista.

  Y como esas contraseñas se enseñan una sola vez (D24), lo que se genera es una
  **hoja de credenciales**: una tabla de nombre, usuario y contraseña que se
  copia o se exporta con el juego del RFC 0009, para repartir. Se dice claro lo
  que es: un fichero con contraseñas en claro, que se manda y se borra. Es el
  único sitio de todo el proyecto donde sale una contraseña a un fichero, y es
  la alternativa a teclear treinta a mano.

  El atajo es explícito y confirmado, no automático (D21).

- **D30 — Borrar un acceso es borrado lógico, y libera el nombre.** Se borra
  lógicamente para que las visitas antiguas sigan diciendo quién entró (§6.6). Y
  como el índice único de `(church_id, username)` es plano —igual que el de
  `gifts`, que es el patrón del repositorio—, al borrar se **renombra la fila
  borrada** (`ancianos` → `ancianos#a1b2`). Así el nombre queda libre otra vez y
  nadie se encuentra con un «ese usuario ya existe» señalando a algo que no ve.
  El registro se sigue leyendo por su etiqueta, que no se toca.

### Quién la ve

- **D31 — La visita se apunta al servir el JSON, no el documento.** Un `GET` al
  documento lo hace el rastreador de WhatsApp cada vez que alguien pega el
  enlace en un chat, y contar eso convertiría la métrica en ruido. El JSON lo
  pide el navegador de una persona.

  El coste es honesto y se dice: **quien lea la lista con JavaScript desactivado
  (el `<noscript>`) no se cuenta**. Son cuatro personas en el mundo y es mejor
  eso que contar bots.

- **D32 — No se guarda la dirección IP entera.** De cada visita se guardan:

  - `visitor_hash` = sha256(sal del día + IP + user-agent), truncado. Sirve para
    **contar personas distintas** y deja de servir para identificar a nadie en
    cuanto la sal rota, a medianoche.
  - `ip_prefix`, el /24 en IPv4 y el /48 en IPv6: `81.34.12.0`. Dice el operador
    y la zona aproximada, que es lo que de verdad se mira.
  - Lo derivado del user-agent: **móvil / tablet / escritorio**, el sistema, y el
    dominio de procedencia (`wa.me`, `t.co`, «directo»).

  La razón no es solo legal —una IP identifica a una persona y esto es Europa—:
  es que **la IP entera no contesta ninguna pregunta que el prefijo y el hash no
  contesten ya**. Y en las restringidas hay algo mejor que una IP, que es el
  nombre de quien entró (D35). Si algún día hiciera falta la completa, es una
  columna y una decisión suya, escrita en un ADR y con su aviso en la página.

  **De dónde se saca la IP, que es donde estaba el error.** Detrás de nginx
  llega `X-Forwarded-For`, y hay que coger **el último elemento, no el primero**:
  nginx usa `proxy_add_x_forwarded_for`, que **añade** el `remote_addr` real al
  final de lo que venga. El primero es lo que mandó el cliente —es decir, lo que
  cualquiera puede inventarse— y usarlo dejaría el freno de D27 y el recuento de
  visitantes al alcance de una cabecera falsa. Con `trust proxy` a 1, que ya se
  aplica en `main.ts` cuando `TRUST_PROXY` está puesto, `request.ip` de Express
  ya hace exactamente eso, así que se usa **`request.ip`** y no se lee la
  cabecera a mano. Y en producción `TRUST_PROXY` **tiene que estar** (§11).

- **D33 — Una visita por visitante y media hora.** Si no, recargar cinco veces
  son cinco visitas y el número deja de significar nada. Dentro de la ventana se
  actualiza la fila que ya hay en vez de crear otra. De paso, es el freno natural
  de una ruta pública que escribe en la base de datos.

  «Visitante» es `viewer_id` cuando lo hay y `visitor_hash` cuando no: en una
  lista restringida, dos personas detrás del mismo router son dos visitantes si
  entraron con accesos distintos.

- **D34 — Las visitas y los intentos se podan a los 180 días.** Medio año da para
  ver el año litúrgico entero y no convierte la tabla en un archivo. La poda
  corre al pedir las estadísticas, como mucho una vez al día, guardada por una
  marca: la API no tiene programador de tareas y meter `@nestjs/schedule` para
  esto sería una dependencia por un `DELETE`.

- **D35 — Con accesos, «cuánta gente» pasa a ser «quién».** Cuando la lista es
  restringida, cada visita queda unida al acceso que la abrió: la ficha deja de
  decir «14 visitas de 9 personas» y pasa a decir «**Juan Pérez**, ayer a las
  21:14 · 12 entradas», con su foto si el acceso está enlazado a un creyente
  (D20). Es la respuesta buena a la pregunta del principio, y llega sin guardar
  una sola IP entera.

- **D36 — El solapamiento es la métrica que justifica todo esto.** Es fácil
  llenar una pantalla de contadores. La cuenta que no se puede hacer sin esta
  funcionalidad y que un pastor necesita de verdad es **en cuántas listas está
  la misma gente**. Quien sale en cinco se está quemando, y hoy eso no lo sabe
  nadie hasta que se cae.

  Sale en las estadísticas de cada lista y, en la portada, como una línea
  directa: «7 personas están en 4 listas o más», que **es un enlace** al listado
  de creyentes filtrado.

### La forma

- **D37 — El color de cada lista es el dato, y es lo que quita el blanco.** Cada
  lista tiene su acento de `ACCENT_PALETTE` (los dieciséis tonos del RFC 0002,
  ya reutilizados por sedes, dones, labores y emociones). Toda la sección se tiñe
  con él: el panel de la portada, la cabecera de la ficha, la estela, el cartel
  público, la propia puerta de acceso y el punto que sale junto al nombre en
  creyentes.

  Esto es lo contrario de un degradado de relleno: **el color dice de qué lista
  estás hablando** (Regla 9 §2, RFC 0005 §7.1.1). Y por eso los paneles de la
  portada van **rellenos**, no en `bg-card` con un tinte al 8 % que sobre fondo
  claro es blanco. Al crear una lista se propone un color que no esté usado.

- **D38 — Cuatro pantallas, tres firmas** (Regla 9 §4):

  | Pantalla       | Firma                                                    |
  | -------------- | -------------------------------------------------------- |
  | `/lists`       | **El tablón**: paneles rellenos, uno por lista (§8.2)    |
  | `/lists/:slug` | **La estela**: las visitas como el rastro de un barco    |
  | `/l/<token>`   | **El pase de lista**: ordinales y nombres, en cascada    |
  | La puerta      | Ninguna propia: **es el cartel con los nombres tapados** |

  Que la puerta no tenga firma propia es deliberado, y es lo que la salva de ser
  «la tarjeta centrada y sola sobre un fondo vacío», que la Regla 9 §2 nombra
  como el formulario de acceso de todo el mundo (§8.6).

  Ninguna se parece a la franja de sueños ni a la travesía de profecías: la
  aplicación tiene que tener voz, no un tic.

- **D39 — La página pública se ve y se descarga igual.** Como la lámina del
  calendario: lo que se lee en pantalla y lo que sale en el PNG son la misma
  composición, pintada dos veces —una que se adapta al ancho, otra a tamaño fijo
  para fotografiarla—. Es lo que hace que el botón de descargar no mienta.

- **D40 — La página pública no lleva el chrome de la aplicación.** Ni barra
  lateral, ni selector de iglesia, ni «iniciar sesión» arriba a la derecha. Quien
  abre ese enlace no es un usuario: es alguien de la congregación mirando quién
  predica el domingo. Al pie, el barco y «Hecho con Navis», discreto, que es la
  única invitación que corresponde.

- **D41 — Se exporta con el RFC 0009, sin escribir nada.** Una lista declara sus
  columnas (`lib/lists/export-columns.ts`) y los cinco formatos salen solos. Es
  la prueba de que aquel juego estaba bien puesto: si esto hubiera necesitado un
  sexto escritor, el de allí estaba mal. La página pública lleva además su propio
  botón de descarga —PDF e imagen—, y en una restringida solo después de entrar.

### Preguntas abiertas

- **¿Segundo factor, o enlaces de un solo uso?** Con contraseña, cookie corta y
  revocación instantánea, el riesgo que queda es «alguien reenvía sus
  credenciales». Contra eso, un código por SMS o un enlace por correo, y no hay
  ni una cosa ni la otra en el proyecto.
- **¿Y si a alguien se le olvida la contraseña?** Hoy: se regenera y se le manda.
  Correcto para diez accesos, molesto para cien. Si llega a cien, hará falta
  autoservicio, y eso pide correo.
- **¿Y si alguien pide que le borren de una lista pública?** Hoy la respuesta es
  quitarlo, que es inmediata. Si esto crece, habrá que decirlo en la página.
- **¿Se avisa a quien entra en una lista?** Sí debería, y no se puede todavía
  (RFC 0006). Cuando haya canal, este es su primer caso de uso.
- **¿Listas entre iglesias?** Alguien con dos iglesias querrá una que cruce las
  dos. Rompe `church_id`, el guard y el directorio, y no lo ha pedido nadie.

## Modelo de datos

### 6.1 `lists`

| Columna            | Tipo                | Notas                                         |
| ------------------ | ------------------- | --------------------------------------------- |
| `id`               | uuid                | `BaseEntity`                                  |
| `church_id`        | uuid, índice        | → `churches(id)` (D1)                         |
| `name`             | text                | «Púlpito». Dato de la iglesia: no se traduce  |
| `slug`             | text                | La ruta privada, fija desde el alta (D7)      |
| `description`      | text, nullable      | Sale en la tarjeta de WhatsApp                |
| `accent`           | text                | Token o `#rrggbb`, con `accentSchema` (D37)   |
| `position`         | int                 | El orden en la barra lateral                  |
| `is_active`        | bool                | Apagada sale de la barra, no se borra         |
| `visibility`       | text                | `private` \| `link` \| `restricted` (D9)      |
| `share_token`      | text, único, índice | El secreto. Nulo si `private` (D10)           |
| `shared_at`        | timestamp, nullable | Cuándo se publicó                             |
| `share_expires_at` | timestamp, nullable | Nulo ⇒ sin caducidad (D13)                    |
| `public_fields`    | text (json)         | Qué campos opcionales salen (D16)             |
| `allow_download`   | bool                | Si la página pública deja descargar el cartel |
| `cover_key`        | text, nullable      | La portada de la tarjeta (D18)                |
| `created_by`       | uuid                | → `user(id)`                                  |
|                    |                     | `created_at`, `updated_at`, `deleted_at`      |

Únicos: `(church_id, slug)` y `(church_id, name)`, planos —el patrón de `gifts`—,
con la misma salida de D30 al borrar.

### 6.2 `list_members`

| Columna       | Tipo           | Notas                                               |
| ------------- | -------------- | --------------------------------------------------- |
| `list_id`     | uuid           | Clave primaria compuesta, `ON DELETE CASCADE`       |
| `believer_id` | uuid           | Idem. → `believers(id)` (D2)                        |
| `position`    | int            | El orden dentro de la lista (D6)                    |
| `note`        | text, nullable | «Solo primer domingo». Sale en público si se activa |
| `added_at`    | timestamp      |                                                     |
| `added_by`    | uuid           |                                                     |

Índice `(believer_id)` aparte: es por donde se pregunta «¿en qué listas está
esta persona?».

Dos trampas de `CLAUDE.md` que aquí muerden seguro:

- **Una relación sin `ORDER BY` no vuelve ordenada en Postgres.** Los miembros se
  piden siempre con `order: { members: { position: 'ASC' } }`, o el cartel sale
  desordenado en producción y bien en local, que es la peor forma de
  descubrirlo.
- **Padre e hijo no se importan el uno al otro.** En `ListMember` la relación se
  declara por nombre y con el tipo envuelto —`@ManyToOne('List', 'members')` y
  `list: Relation<List>` con `import type`—, o se acaba en «Cannot access 'X'
  before initialization» al arrancar.

### 6.3 `list_viewers` — el directorio de accesos (D19, D20)

| Columna               | Tipo                | Notas                                                 |
| --------------------- | ------------------- | ----------------------------------------------------- |
| `id`                  | uuid                | `BaseEntity`                                          |
| `church_id`           | uuid, índice        | Un acceso es de una iglesia y no existe fuera         |
| `believer_id`         | uuid, nullable      | El creyente al que pertenece, si lo hay (D20)         |
| `username`            | text                | Único por iglesia, minúsculas, 3–40                   |
| `password_hash`       | text                | `scrypt$N$r$p$sal$clave` (D24). **Nunca en claro**    |
| `label`               | text                | «Ancianos» o el nombre del creyente. Para reconocerlo |
| `is_active`           | bool                | Apagado no entra, y se conserva el historial          |
| `expires_at`          | timestamp, nullable | Caducidad propia, aparte de la de la lista            |
| `sessions_valid_from` | timestamp           | Corta las cookies emitidas antes (D28)                |
| `last_seen_at`        | timestamp, nullable | Última entrada correcta                               |
| `created_by`          | uuid                |                                                       |
|                       |                     | `created_at`, `updated_at`, `deleted_at`              |

Únicos, los dos planos: `(church_id, username)` y `(church_id, believer_id)`.
El segundo da «como mucho un acceso por creyente» sin impedir «tantos accesos de
grupo como haga falta», porque en los dos motores **varios nulos no chocan entre
sí en un índice único**.

### 6.4 `list_grants` — qué acceso abre qué lista (D19)

`(viewer_id, list_id)`, clave primaria compuesta, `ON DELETE CASCADE` por los dos
lados, más `granted_at` y `granted_by`. Es el mismo patrón que `believer_gifts`
y `dream_emotions`.

**Es la única tabla que decide si alguien puede leer una lista restringida**, y
se consulta en cada petición (D23). Por eso es de dos columnas y sin lógica: lo
que se pregunta mil veces al día tiene que ser una búsqueda por clave primaria.

Ojo con el borrado: **las listas y los accesos se borran lógicamente**, así que
el `ON DELETE CASCADE` no se dispara. Al borrar cualquiera de los dos, el
servicio **quita sus concesiones a mano**, en la misma transacción. Una concesión
huérfana a una lista borrada no abriría nada —la lista ya no se sirve—, pero
saldría contada en «a cuántas listas llega este acceso», que es justo el número
que se mira para decidir.

### 6.5 `list_views`

| Columna         | Tipo              | Notas                                            |
| --------------- | ----------------- | ------------------------------------------------ |
| `id`            | uuid              |                                                  |
| `list_id`       | uuid, índice      |                                                  |
| `viewer_id`     | uuid, nullable    | El acceso que la abrió. Nulo si es abierta (D35) |
| `viewed_at`     | timestamp, índice | Cuándo                                           |
| `visitor_hash`  | text, índice      | Personas distintas, sin identificar (D32)        |
| `ip_prefix`     | text              | `81.34.12.0` / `2a02:9000::`                     |
| `device`        | text              | `mobile` \| `tablet` \| `desktop`                |
| `platform`      | text, nullable    | `Android`, `iOS`, `Windows`…                     |
| `referrer_host` | text, nullable    | `wa.me`, `t.co`, nulo ⇒ directo                  |
| `views`         | int               | Recargas dentro de la ventana de 30 min (D33)    |

Índice compuesto `(list_id, viewed_at DESC)`: es la consulta de la estela.

### 6.6 `list_access_log` — los intentos (D27)

| Columna     | Tipo              | Notas                                                  |
| ----------- | ----------------- | ------------------------------------------------------ |
| `id`        | uuid              |                                                        |
| `list_id`   | uuid, índice      |                                                        |
| `viewer_id` | uuid, nullable    | Nulo cuando el usuario ni existe                       |
| `username`  | text              | Lo que se tecleó, para poder leer el registro          |
| `outcome`   | text              | `ok` \| `bad_credentials` \| `no_grant` \| `throttled` |
| `ip_prefix` | text              | Nunca la IP entera (D32)                               |
| `at`        | timestamp, índice |                                                        |

Se poda a los 180 días con la misma pasada que `list_views` (D34). **Aquí no se
guarda la contraseña tecleada**, ni acertada ni fallada, ni su longitud: lo único
que se apunta es que hubo un intento y cómo acabó.

### 6.7 Lo que se comparte

En `packages/shared/src/schemas/lists.ts`: `listSchema`, `listSummarySchema`,
`listMemberSchema`, `publicListSchema` —**la forma de lo que sale a la calle,
escrita aparte a propósito** (D16)—, `listStatsSchema`, `listViewerSchema` —sin
contraseña ni hash, nunca— y los esquemas de creación y edición.

En `list-share.ts`, el generador y el validador del token. Y en
`list-password.ts`, el generador de D25 y su normalizador —el que quita los
guiones—, con sus tests: es lógica compartida —la web la genera, la API la
valida— y no depende de ninguna de las dos.

## API

### 7.1 Lo privado — bajo `/api/v1`, con sesión y `ActiveChurchGuard`

| Método | Ruta                             | Permiso                         | Descripción                             |
| ------ | -------------------------------- | ------------------------------- | --------------------------------------- |
| GET    | `/lists`                         | `lists.view`                    | Las listas de la iglesia, con cuentas   |
| POST   | `/lists`                         | `lists.manage`                  | Crear                                   |
| GET    | `/lists/:id`                     | `lists.view`                    | La ficha, con sus miembros ordenados    |
| PATCH  | `/lists/:id`                     | `lists.manage`                  | Nombre, descripción, color, activa      |
| DELETE | `/lists/:id`                     | `lists.manage`                  | Borrado lógico. Despublica primero      |
| GET    | `/lists/:id/stats`               | `lists.view`                    | Composición, audiencia y solapamiento   |
| GET    | `/lists/:id/export`              | `lists.view`                    | Las filas, según el RFC 0009            |
| POST   | `/lists/:id/members`             | `lists.manage`                  | Añadir varios de golpe                  |
| DELETE | `/lists/:id/members/:believerId` | `lists.manage`                  | Quitar uno                              |
| PATCH  | `/lists/:id/members/:believerId` | `lists.manage`                  | La nota                                 |
| PUT    | `/lists/:id/order`               | `lists.manage`                  | El orden entero, de una vez (D6)        |
| POST   | `/lists/:id/share`               | `lists.share`                   | Publicar: modo, token y enlace          |
| POST   | `/lists/:id/share/rotate`        | `lists.share`                   | Cambiar el enlace sin despublicar (D11) |
| DELETE | `/lists/:id/share`               | `lists.share`                   | Dejar de compartir. Borra el token      |
| POST   | `/lists/:id/cover`               | `lists.share`                   | La portada de la tarjeta (D18)          |
| GET    | `/lists/:id/access-log`          | `lists.share`                   | Los últimos cincuenta intentos          |
| GET    | `/lists/memberships`             | `lists.view` + `believers.view` | `{ believerId: [listId] }` (§8.7)       |

`PUT /lists/:id/order` recibe **el orden completo**, no «sube uno». Movimientos
relativos desde varios sitios a la vez acaban en un orden que no es el de nadie.

`POST /lists/:id/share` lleva `{ visibility, expiresAt?, publicFields? }`.
Publicar en `restricted` **sin ninguna concesión** se rechaza con un 400 que lo
dice: una lista que no puede abrir nadie no es una lista restringida, es una
lista rota. Y pasar de `link` a `restricted` **rota el token** (D12) y lo avisa
en la respuesta, para que la interfaz pueda decir que hay que repartir el enlace
otra vez.

`GET /lists/memberships` exige **los dos permisos**: sin `lists.view` no se
enseñan los puntos en creyentes, porque los nombres de las listas también son
información.

### 7.2 Los accesos — `/api/v1/list-viewers`, con `lists.share`

| Método | Ruta                         | Descripción                                         |
| ------ | ---------------------------- | --------------------------------------------------- |
| GET    | `/list-viewers`              | El directorio, con a cuántas listas llega cada uno  |
| POST   | `/list-viewers`              | Crear. **Devuelve la contraseña en claro, una vez** |
| PATCH  | `/list-viewers/:id`          | Etiqueta, activo, caducidad, creyente enlazado      |
| POST   | `/list-viewers/:id/password` | Regenerar. Devuelve la nueva y revoca las sesiones  |
| DELETE | `/list-viewers/:id`          | Borrado lógico. Revoca sesiones y quita concesiones |
| PUT    | `/list-viewers/:id/lists`    | **Las listas que abre, de una vez** (D19)           |
| PUT    | `/lists/:id/viewers`         | Lo mismo del otro lado: quién entra en esta lista   |
| POST   | `/lists/:id/viewers/bulk`    | Alta en lote desde la lista (D29)                   |

Las dos `PUT` escriben la misma tabla desde los dos lados, que es como se mira de
verdad: unas veces «a qué llega este acceso» y otras «quién entra aquí».

**La contraseña en claro sale exactamente en tres respuestas** —crear, regenerar
y el lote de D29— y en ninguna más (D24). No hay ningún `GET` que la devuelva, y
`listViewerSchema` no tiene el campo.

`POST /list-viewers` con `believerId` comprueba que ese creyente **es de la
iglesia activa** y que no tiene ya un acceso; si lo tiene, devuelve 409 con un
mensaje que lleva al que existe, en vez de un choque de índice único.

### 7.3 Lo público — sin sesión, con `@Public()`

| Método | Ruta                                 | Descripción                                         |
| ------ | ------------------------------------ | --------------------------------------------------- |
| GET    | `/l/:token`                          | El documento con las `og:` (D14). `VERSION_NEUTRAL` |
| GET    | `/l/:token/card.png`                 | La portada, o la cerrada si es restringida (D18)    |
| GET    | `/l/:token/photos/:believerId`       | La foto de un miembro, con sus cinco cierres (D17)  |
| GET    | `/api/v1/public/lists/:token`        | El JSON. **Apunta la visita** (D31)                 |
| POST   | `/api/v1/public/lists/:token/access` | Usuario y contraseña. Devuelve la cookie (D23)      |
| POST   | `/api/v1/public/lists/:token/exit`   | Cerrar: borra la cookie                             |

En modo `restricted`, el `GET` del JSON con cookie válida y concesión devuelve la
lista; sin ella devuelve **`401` con lo mínimo para pintar la puerta**: el nombre
de la iglesia, el de la lista y su color, y nada más —ni el número de personas,
ni una sola inicial— (§8.6).

Todos van con un `@Throttle` propio, más estrecho que el general; el de `/access`
además con el suyo por prefijo de IP (D27). El JSON va con `Cache-Control:
no-store`, y en restringida además con `Vary: Cookie`.

Errores: **404 siempre y el mismo cuerpo** cuando el token no existe, la lista
está sin publicar, caducada, borrada, inactiva o es de una iglesia borrada. Decir
«esto existía» ya es contar algo. El `401` y el `403` de D26 son la única
excepción, y solo aparecen cuando el token **sí** vale.

### 7.4 `GET /lists/:id/stats`

```
members
├── total
├── byCongregation[]   { id, name, accent, count }
├── byMinistry[]       { slug, name, accent, count }
├── byGift[]           { id, name, accent, count }
├── byStatus[]         { status, count }
└── withoutCongregation

overlap                                                    (D36)
├── inOtherLists[]     { believerId, name, listCount }    de más a menos, 20
└── sharedWith[]       { listId, name, accent, count }    con qué lista se cruza más

audience
├── views, visitors, firstViewAt, lastViewAt
├── days[]             { day, views, visitors }   — 30 días: la estela
├── byDevice[], byPlatform[], byReferrer[], byHour[]
└── byViewer[]         { viewerId, label, believerId, views, lastAt }   solo restringida

access                                                     solo restringida
├── granted            cuántos accesos la abren
├── neverEntered       cuántos de ellos no han entrado nunca
├── failedLast7Days
└── recent[]           { username, outcome, at, ipPrefix }
```

`days[]` viene **relleno con ceros**, incluidos los días sin visitas: si el
cliente tuviera que rellenar huecos con fechas, ahí es donde se cuelan los
errores de huso (RFC 0005 §6.2). El día se calcula en JS sobre el ISO de
`iso-day.ts`, no con `EXTRACT(DOW)` ni `strftime`, que no se escriben igual en
los dos motores (RFC 0005 D14).

`neverEntered` no es relleno: es lo que dice que a alguien se le dio una llave y
nunca la usó, que casi siempre significa que el mensaje no le llegó.

## Casos límite

La tabla que evita las sorpresas. Cada fila es un test.

| Qué pasa si…                                               | Qué tiene que pasar                                                                                                                                                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Se borra un **creyente** que está en listas                | Desaparece del cartel **y de la ficha de la lista**: la consulta filtra `deleted_at` por los dos lados. Su fila de `list_members` se queda, y si se recupera al creyente, vuelve donde estaba (D16) |
| Se borra un creyente que **tiene acceso**                  | Su acceso se desactiva y sus sesiones se cortan (D28)                                                                                                                                               |
| Se borra una **lista**                                     | Se despublica, se cortan las sesiones y se quitan sus concesiones (§6.4)                                                                                                                            |
| Se borra un **acceso**                                     | Borrado lógico, se renombra el usuario, se quitan concesiones, se cortan sesiones (D30)                                                                                                             |
| Se **desmarca una lista** de un acceso                     | Deja de abrirla en la petición siguiente, sin tocar las demás (D23, D28)                                                                                                                            |
| Alguien con cookie válida abre **otra lista suya**         | Entra sin escribir nada (D23)                                                                                                                                                                       |
| Alguien con cookie válida abre **una que no es suya**      | 403 con «Este acceso no incluye esta lista» (D26). No se le pide la contraseña otra vez                                                                                                             |
| Una lista pasa de **abierta a restringida**                | Se rota el token y se avisa de que hay que repartir el enlace (D12)                                                                                                                                 |
| Una lista pasa de **restringida a abierta**                | La cookie deja de hacer falta; no se rota nada                                                                                                                                                      |
| Una lista **caduca** mientras alguien la está mirando      | La siguiente petición da 404, igual que si estuviera despublicada (D13)                                                                                                                             |
| El **acceso** caduca antes que la lista                    | Manda el primero de los dos (D13)                                                                                                                                                                   |
| Se publica una lista **vacía**                             | Se avisa, y si se confirma, el cartel dice «Todavía no hay nadie en esta lista»                                                                                                                     |
| Se publica en **restringida sin conceder a nadie**         | 400: no es una lista restringida, es una lista rota (§7.1)                                                                                                                                          |
| Se intenta dar acceso a un creyente **que ya lo tiene**    | 409 con un enlace al que existe, no un choque de índice (§7.2)                                                                                                                                      |
| Se intenta dar acceso a un creyente **de otra iglesia**    | 400. Se comprueba en el servicio, no solo en la pantalla (D20)                                                                                                                                      |
| Un usuario se repite al **generarlo desde el nombre**      | Se le pone sufijo (`juan.perez2`) y se avisa antes de guardar                                                                                                                                       |
| Se **añade a alguien a una lista**                         | **No** gana acceso a verla (D21)                                                                                                                                                                    |
| Se le **da acceso** a alguien                              | **No** entra en la lista (D21)                                                                                                                                                                      |
| Se pide la **foto de un creyente que no está en la lista** | 404, aunque el token sea válido (D17)                                                                                                                                                               |
| Se pide la foto de una lista **con la foto apagada**       | 404                                                                                                                                                                                                 |
| Llega un `X-Forwarded-For` **inventado**                   | Se ignora: se usa `request.ip` con `trust proxy` (D32)                                                                                                                                              |
| **`TRUST_PROXY` está apagado** en producción               | Todo el mundo comparte prefijo, el freno de D27 bloquea a todos: por eso está en §11                                                                                                                |
| Alguien **recarga cinco veces**                            | Una visita (D33)                                                                                                                                                                                    |
| El **rastreador de WhatsApp** pide el enlace               | No cuenta como visita: se queda en el documento (D14, D31)                                                                                                                                          |
| Se abre desde el **navegador interno de WhatsApp**         | Funciona; si luego se abre en Chrome, la cookie no está y se vuelve a pedir la contraseña                                                                                                           |
| Se llama a `/l/<token>` con la **PWA instalada**           | Llega a la API: la ruta está en la denylist del service worker (D15)                                                                                                                                |
| Se renombra una lista                                      | El `slug` no cambia, los enlaces siguen valiendo (D7)                                                                                                                                               |
| Dos listas quieren **el mismo color**                      | Se permite; el selector propone uno libre (D37)                                                                                                                                                     |

## Interfaz

### 8.1 Las rutas

| Ruta               | Qué es                   | Acceso         |
| ------------------ | ------------------------ | -------------- |
| `/lists`           | La portada: el tablón    | `lists.view`   |
| `/lists/:slug`     | La ficha de una lista    | `lists.view`   |
| `/lists/s/:token`  | **La página pública**    | **sin sesión** |
| `/settings/access` | El directorio de accesos | `lists.share`  |

`/lists/s/:token` va **fuera de `ProtectedRoute` y fuera de `AppLayout`** en
`router.tsx`, al lado de `/login`: dentro del layout arrastraría el selector de
iglesia, la barra lateral y una petición de sesión que no hay (D40). Y va
declarada **antes** que `/lists/:slug`, o «s» se lee como el slug de una lista
—es la trampa de `/prophecies/list` y `/dreams/list`, ya anotada en
`router.tsx`—.

Es además la primera ruta que se carga sin sesión y sin iglesia: su trozo de
JavaScript no debe arrastrar el resto de la aplicación. Va con su propio `lazy` y
lo que necesite se importa desde `lib/`, no de componentes del panel. El idioma
sale del aparato —no hay preferencia guardada de nadie— y el tema, del sistema.

El directorio vive en ajustes y no colgando de una lista, porque es de la
iglesia (D19). Desde cada lista se llega a él, y también se puede crear un acceso
sin salir de ahí.

### 8.2 La portada — `/lists` · firma: **el tablón**

La pregunta que responde no es «cuántas listas hay», es **«qué hay puesto en la
puerta ahora mismo»**. De ahí sale la forma.

Una rejilla —`sm:grid-cols-2 xl:grid-cols-3`— donde cada lista es un **panel
relleno de su propio color**, con su `-foreground` (Regla 3 §2). No tarjetas
blancas con un puntito de color: el panel **es** el color. Doce listas son doce
colores, y eso es exactamente lo que la sección debe parecer.

Dentro de cada panel:

- El nombre, grande y con `tracking` cerrado.
- El número de personas, en cifra grande y tabular.
- **Las iniciales de los primeros ocho**, en círculos superpuestos: se reconoce
  la lista por su gente antes de leer el nombre.
- Una pastilla de estado con **icono y texto**, nunca solo color (Regla 3 §7):
  **Sin publicar**, **Abierta** (globo) o **Con acceso** (llave). Los tres modos
  de D9 se distinguen de un vistazo desde la portada, que es donde hace falta.
- Al pie, si está publicada, **una estela en miniatura**: catorce días de visitas
  en una línea de 24 px de alto, en el `-foreground` al 40 %. Es la figura de
  §8.4 en pequeño, y es lo que le da pulso a la portada en vez de ser un menú.

Encima de la rejilla, tres líneas de texto que son las únicas cuentas, sin
tarjetas: «5 listas · 63 personas · 7 están en 4 listas o más» (D36). La tercera
**es un enlace**. Una cifra que no lleva a ninguna parte es un adorno.

Con cero listas no se enseña una rejilla vacía: una invitación con el botón
dentro y las cinco de serie propuestas por su nombre (Regla 9 §6).

Los paneles entran en cascada de 40 ms, solo `opacity` y `transform`, nunca más
de 400 ms en total, y con `prefers-reduced-motion` no entran.

### 8.3 La ficha — `/lists/:slug`

Cabecera **a sangre** en el color de la lista, con el nombre en grande, la
descripción y el estado de publicación. Debajo, tres pestañas (`Tabs`, que ya
existe): **Personas**, **Estadísticas** y **Compartir**.

**Personas** — la lista ordenada, con el ordinal a la izquierda, la foto o la
inicial, el nombre, la sede y las labores en sus colores, y la nota. Se arrastra
para reordenar, y cada fila lleva sus botones de subir y bajar, que es como se
reordena con el teclado (D6). Quien además tiene acceso lleva una **llave
pequeña** al lado del nombre: es la forma de ver de un vistazo la distinción de
D21 sin tener que ir a la otra pestaña. Arriba, «Añadir personas» —el buscador de
creyentes con los filtros de siempre— y «Exportar» (RFC 0009).

**Estadísticas** — en una restringida, lo primero es **quién ha entrado** (D35):
nombre del acceso, su foto si está enlazado a un creyente, cuántas veces y
cuándo. Después la estela (§8.4), el reparto por sede y por labor en barras
apiladas con el color de cada una, la hora del día en que se mira, de dónde
llegan las visitas y **el solapamiento** (D36). Al final, si los hay, los
intentos fallidos, en `warning` con su icono, y los accesos que nunca han
entrado.

**Compartir** — §8.5.

### 8.4 La estela (D38)

Las visitas de los últimos treinta días, dibujadas como el rastro que deja un
barco: una banda simétrica alrededor de una línea central, **ancha a la derecha
—hoy— y estrechándose hacia la izquierda**, con el grosor de cada día
proporcional a sus visitas y el color de la lista.

Es un SVG propio de unas cuarenta líneas —dos polígonos espejados y una línea—,
no recharts: es una figura de forma fija sin ejes ni leyenda, y meter 370 kB para
dibujar un polígono sería justo lo contrario de lo que dice el RFC 0005 D18.

Y el suelo de calidad, que en un gráfico es donde más se descuida:

- Cada día es un objetivo con su `aria-label` completo: «Martes 3 de junio, 4
  visitas de 3 personas».
- Debajo, un desplegable **«Ver los datos»** con la tabla de treinta filas. El
  gráfico no puede ser la única forma de leer el dato.
- El grosor no informa solo: el día de más visitas va marcado y rotulado.
- Entra dibujándose de izquierda a derecha en 500 ms con `transform: scaleX()`
  desde el origen izquierdo —no con `width`, que el compositor no sabe resolver
  (Regla 9 §5)—, y con `prefers-reduced-motion` aparece hecha.
- Con menos de cuatro días de datos no se dibuja una estela de tres puntos: se
  enseña la cifra y «Todavía hay pocas visitas para dibujar nada».

### 8.5 Compartir, y repartir llaves

La pestaña se lee de arriba abajo como una decisión, no como un panel de ajustes.

1. **El modo**, tres opciones con su explicación en una línea (D9). No un
   interruptor con letra pequeña: tres opciones que se leen enteras antes de
   elegir.

   ```
   ○ Sin publicar   Solo se ve desde dentro.
   ○ Abierta        Cualquiera con el enlace la ve.
   ● Con acceso     Hay que entrar con usuario y contraseña.
   ```

   Al pasar de abierta a con acceso, la confirmación dice que **el enlace va a
   cambiar** y por qué (D12).

2. **El enlace**, con su botón de copiar y el de «Cambiar el enlace» (D11), y **la
   tarjeta tal y como la va a enseñar WhatsApp**: la imagen real, el título y la
   descripción. En modo restringido se enseña **la cerrada** (D18) y debajo, una
   línea: «En la vista previa no salen los nombres».

3. **Quién puede verla** —solo en modo restringido—. La lista de accesos de la
   iglesia con su casilla: marcado, ese acceso abre esta lista. Cada fila lleva
   su etiqueta, su usuario, **a cuántas listas más llega** y cuándo entró por
   última vez; si está enlazado a un creyente, su foto. Y al pie, dos botones:
   **«Crear un acceso»**, que lo crea y lo concede de una vez, y **«Dar acceso a
   los de esta lista»** (D29).

4. **Qué se ve de cada persona** (D16), con la foto apagada y su aviso.

5. **La caducidad** (D13) y **«Dejar de compartir»** en `destructive`, con su
   confirmación diciendo exactamente qué pasa: el enlace deja de funcionar, las
   sesiones abiertas se cierran, y volver a publicar dará un enlace nuevo (D11).

**El diálogo de crear un acceso** es donde se nota si esto está bien hecho:

- **De quién es**: dos opciones, **«De un creyente»** —con el buscador de
  siempre, que enseña foto y sede— o **«De un grupo»**, con su nombre a mano
  (D20). Elegir creyente rellena la etiqueta y propone el usuario.
- **Usuario**: propuesto (`juan.perez`, `ancianos`), editable, comprobado al
  escribir contra los que ya existen en la iglesia.
- **Contraseña**: **nace ya generada** (D25), en un campo de solo lectura con la
  letra monoespaciada y los tres grupos bien separados, con un botón para volver
  a tirarla y otro para copiarla. Un enlace pequeño, «Escribirla yo», la
  convierte en editable con su mínimo de ocho.
- **A qué listas llega**: **las casillas de todas las listas de la iglesia**, con
  la actual ya marcada. Es la pantalla que ahorra el trabajo: se crea un acceso y
  se le dan las cuatro listas de una vez (D19).
- **Caducidad**, opcional.
- Al guardar, **una pantalla que enseña usuario y contraseña juntos**, con un
  botón para copiar los dos en un mensaje ya redactado —«Para ver la lista
  _Púlpito_: <enlace> · Usuario: juan.perez · Contraseña: k7fr-m3np-t9wx»— y el
  aviso de que esa contraseña no se va a volver a ver (D24). Ese botón es la
  diferencia entre que esto se use y que no se use.

**El directorio** (`/settings/access`) es la misma información girada: una fila
por acceso —etiqueta, usuario, creyente si lo hay, última entrada, activo— y una
columna de pastillas con **las listas que abre**, en el color de cada una.
Pulsando una fila se abre el mismo panel de casillas. Es donde se contesta «¿a
qué llega Juan?» sin recorrer siete listas.

### 8.6 La página pública — `/lists/s/:token` · firma: **el pase de lista**

Es la pantalla que ve la gente de la congregación, y la única de todo el proyecto
que ve alguien que no ha iniciado sesión. Tiene que parecer **algo que alguien ha
puesto en la puerta**, no una aplicación a la que te has colado.

De arriba abajo:

1. **Una banda de color a sangre**, del color de la lista, que en un teléfono
   ocupa cerca de media pantalla. Dentro: el nombre de la iglesia arriba, en
   versalitas y muy espaciado; el nombre de la lista **en grande de verdad**
   —`clamp(2.5rem, 9vw, 4.5rem)`, `tracking` cerrado y peso alto, más grande que
   cualquier titular del panel—; y una línea con «12 personas · actualizada el 3
   de agosto». La descripción, si la hay, debajo.

   Esa tipografía es la decisión que hace que la página no parezca la aplicación.
   En el panel todo es informativo y comedido; aquí es un cartel.

2. **El pase de lista.** Ni tabla ni tarjetas: una columna de nombres, cada uno
   con **su ordinal a la izquierda en cifra grande y hueca**, en el color de la
   lista al 35 %, y el nombre al lado a tamaño de lectura. Debajo, en pequeño y
   apagado, lo que se haya activado: la sede, la labor, la nota.

   Los ordinales están porque **el orden es el dato** (D6): en una lista de
   púlpito, el primero predica primero. Es la única razón por la que se numera
   algo en este proyecto; donde el orden no signifique nada, no se numera.

   Los nombres entran **uno a uno, 40 ms de diferencia**, como quien lee una
   lista en voz alta. Es la única animación de la página y dura menos de medio
   segundo en total.

3. **Al pie**: la fecha de actualización, el botón de descargar —PDF e imagen, si
   `allow_download`—, y el barco con «Hecho con Navis», pequeño (D40). En una
   restringida, además, una línea con **quién eres** —«Estás viendo como Juan
   Pérez»— y **«Salir»**, que borra la cookie. Sin eso, en un teléfono prestado
   nadie sabe con qué llave está entrando.

**La puerta** —lo que se ve en una restringida antes de entrar— **es esa misma
página con los nombres tapados**, y esa es toda la idea (D38):

- La banda de color se queda **exactamente igual**: la iglesia, el nombre de la
  lista, su color. Quien tiene el enlace ya sabe a qué lista va.
- Donde iría el pase de lista, van **los ordinales sin nombre**: las cifras
  huecas y, al lado, barras apagadas del ancho de un nombre. Se ve que hay algo y
  no se ve qué. **No dice cuántas personas hay** —las barras son siempre seis, no
  las que haya—, porque el número también es un dato.
- Encima, el formulario: usuario, contraseña y un botón. Nada más. Sin logo
  centrado, sin tarjeta flotando en un fondo vacío, sin «Bienvenido de nuevo»
  (Regla 9 §2).
- Al acertar, las barras **se convierten en los nombres** en la misma cascada de
  40 ms. La animación cuenta lo que acaba de pasar: se ha levantado el telón.

Y los detalles que hacen que se use en un teléfono:

- La contraseña entra **con guiones o sin ellos** (D25), con botón de ver y
  `autocomplete="current-password"` para que el gestor la guarde.
- El usuario, con `autocapitalize="none"` y `autocorrect="off"`: en un móvil,
  «Ancianos» con mayúscula inicial es el fallo número uno.
- Los errores dicen qué pasa y qué hacer, en su sitio, con su icono y anunciados
  con `role="alert"` (D26): «Usuario o contraseña incorrectos», «Este acceso no
  incluye esta lista», «Has probado demasiadas veces. Inténtalo dentro de 12
  minutos.»
- Quien llega con cookie válida y concesión **no ve la puerta**: entra directo
  (D23).

A 375 px con el texto en alemán: una sola columna, el nombre de la lista baja de
tamaño con el `clamp`, y los ordinales pasan a ir en línea con el nombre en vez
de en su columna. Sin scroll horizontal.

Y el tema: la página respeta el del sistema como toda la aplicación, pero **la
banda de color es la misma en los dos**, porque es el color de la lista y ese no
cambia (Regla 3 §6, la distinción entre `brand` y `primary`).

### 8.7 En creyentes

- **En la tabla y en las fichas**, junto al nombre, **un punto por cada lista** en
  su color, hasta cuatro y luego «+2». Al pasar por encima, el nombre de la
  lista. Solo para quien tiene `lists.view` (§7.1).
- **Un filtro más**: `?listId=`, en la barra de filtros. Es la vuelta del camino
  de D5.
- **La barra de selección**, que hoy solo asigna sede, gana su segunda acción:
  «Añadir a una lista», con el selector al lado. Y con el RFC 0009, una tercera:
  exportar la selección. Se renombra a `BulkBar` y cada acción se queda en su
  propio componente pequeño (Regla 6).
- **En la ficha del creyente**, dos bloques que no se mezclan, y así es como se
  entiende D21 sin explicarla:
  - **«Está en»** — sus listas, cada una enlazando, con un botón para quitarlo.
    Las publicadas llevan su pastilla: quien mira una ficha tiene que ver de un
    vistazo que ese nombre está hoy en internet.
  - **«Puede ver»** — su acceso, si lo tiene: usuario, última entrada y las
    listas que abre. Y si no lo tiene, el botón de crearlo, que abre el diálogo
    de §8.5 con la persona ya elegida (D20).

Los puntos salen de `GET /lists/memberships`, una sola llamada por iglesia que se
cachea con TanStack Query, y **no de un `join` dentro del listado paginado**: con
relaciones cargadas, `take`/`skip` de TypeORM se van a una subconsulta con
`DISTINCT` y Postgres exige entonces que todo lo ordenado esté en la lista de
selección. Esa trampa ya está en `CLAUDE.md`.

### 8.8 La copia

Sección propia `lists.*` (Regla 2 §4), en los seis idiomas. Lo que más importa es
lo que se lee al publicar y en la puerta, que son los dos sitios donde alguien
decide algo que no se deshace del todo:

| Clave                        | Español                                                                    |
| ---------------------------- | -------------------------------------------------------------------------- |
| `lists.title`                | Listas compartidas                                                         |
| `lists.visibilityLink`       | Abierta                                                                    |
| `lists.visibilityLinkHint`   | Cualquiera con el enlace la ve.                                            |
| `lists.visibilityLocked`     | Con acceso                                                                 |
| `lists.visibilityLockedHint` | Hay que entrar con usuario y contraseña.                                   |
| `lists.publishFields`        | Se verán los nombres y su orden. Ni teléfonos, ni correos, ni cumpleaños.  |
| `lists.rotateWarning`        | El enlace va a cambiar. Tendrás que volver a repartirlo.                   |
| `lists.published`            | Lista publicada                                                            |
| `lists.unpublishExplain`     | El enlace deja de funcionar ahora mismo. Publicar otra vez dará uno nuevo. |
| `lists.copyLink`             | Copiar el enlace                                                           |
| `lists.copyCredentials`      | Copiar el mensaje con el acceso                                            |
| `lists.newViewer`            | Crear un acceso                                                            |
| `lists.forBeliever`          | De un creyente                                                             |
| `lists.forGroup`             | De un grupo                                                                |
| `lists.grantLists`           | A qué listas llega                                                         |
| `lists.grantAllInList`       | Dar acceso a los de esta lista                                             |
| `lists.password`             | Contraseña                                                                 |
| `lists.regenerate`           | Generar otra                                                               |
| `lists.passwordOnce`         | Cópiala ahora: no vas a volver a verla.                                    |
| `lists.writeMyOwn`           | Escribirla yo                                                              |
| `lists.revoke`               | Revocar el acceso                                                          |
| `lists.revokeExplain`        | Quien esté dentro sale al momento.                                         |
| `lists.inLists`              | Está en                                                                    |
| `lists.canSee`               | Puede ver                                                                  |
| `lists.gateHint`             | Entra con el usuario y la contraseña que te hayan dado.                    |
| `lists.badCredentials`       | Usuario o contraseña incorrectos                                           |
| `lists.noGrant`              | Este acceso no incluye esta lista                                          |
| `lists.tooManyTries`         | Has probado demasiadas veces. Inténtalo dentro de {{minutes}} minutos.     |
| `lists.viewingAs`            | Estás viendo como {{name}}                                                 |
| `lists.exit`                 | Salir                                                                      |
| `lists.viewsEmpty`           | Todavía no la ha abierto nadie.                                            |
| `lists.emptyList`            | Todavía no hay nadie en esta lista.                                        |
| `lists.notFound`             | Esta lista ya no está disponible.                                          |

Nada de «Gestiona tus listas en un solo sitio». El botón que dice «Publicar la
lista» produce «Lista publicada», y el mismo nombre se mantiene todo el camino
(Regla 9 §6).

## Ficheros nuevos

```
packages/shared/src/schemas/lists.ts          list, member, viewer, público, stats
packages/shared/src/schemas/list-share.ts     token: generar y validar (+ test)
packages/shared/src/schemas/list-password.ts  generar y normalizar (D25) (+ test)
packages/shared/src/permissions.ts            +lists.view/.manage/.share
packages/shared/src/role-permissions.ts       la semilla de los tres

apps/api/src/lists/list.entity.ts
apps/api/src/lists/list-member.entity.ts
apps/api/src/lists/list-viewer.entity.ts
apps/api/src/lists/list-grant.entity.ts
apps/api/src/lists/list-view.entity.ts
apps/api/src/lists/list-access-log.entity.ts
apps/api/src/lists/lists.controller.ts
apps/api/src/lists/lists.service.ts
apps/api/src/lists/list-members.service.ts
apps/api/src/lists/list-share.service.ts       publicar, rotar, despublicar, portada
apps/api/src/lists/list-viewers.controller.ts
apps/api/src/lists/list-viewers.service.ts     alta, contraseña, lote (D29)
apps/api/src/lists/list-grants.service.ts      conceder y revocar, de los dos lados
apps/api/src/lists/list-password.service.ts    scrypt: cifrar y comparar (D24)
apps/api/src/lists/list-access.service.ts      autenticar, autorizar, frenar (D26, D27)
apps/api/src/lists/list-access.cookie.ts       firmar y verificar (D23)
apps/api/src/lists/list-stats.service.ts
apps/api/src/lists/list-views.service.ts       apuntar, deduplicar, podar
apps/api/src/lists/public-lists.controller.ts
apps/api/src/lists/public-photos.controller.ts los cinco cierres (D17)
apps/api/src/lists/public-list.mapper.ts       la lista blanca de campos (D16)
apps/api/src/lists/share-page.ts               el documento con las og: (D14)
apps/api/src/lists/visitor.ts                  hash, prefijo de IP, user-agent
apps/api/src/lists/lists.module.ts
apps/api/src/database/migrations/…-CreateLists.ts

apps/web/src/routes/lists.tsx                  la portada
apps/web/src/routes/list.tsx                   la ficha
apps/web/src/routes/public-list.tsx            la página pública y su puerta
apps/web/src/routes/list-access.tsx            el directorio, en ajustes
apps/web/src/components/lists/list-panel.tsx          el panel del tablón
apps/web/src/components/lists/wake.tsx                la estela (§8.4)
apps/web/src/components/lists/wake-table.tsx          su tabla accesible
apps/web/src/components/lists/member-rows.tsx
apps/web/src/components/lists/add-members-dialog.tsx
apps/web/src/components/lists/visibility-picker.tsx   los tres modos (D9)
apps/web/src/components/lists/share-panel.tsx
apps/web/src/components/lists/share-preview.tsx       la tarjeta de WhatsApp
apps/web/src/components/lists/viewer-form.tsx         crear un acceso (§8.5)
apps/web/src/components/lists/viewer-rows.tsx         quién puede verla
apps/web/src/components/lists/grant-checkboxes.tsx    a qué listas llega (D19)
apps/web/src/components/lists/bulk-grant-dialog.tsx   el lote (D29)
apps/web/src/components/lists/credentials-panel.tsx   la pantalla de «una vez»
apps/web/src/components/lists/password-field.tsx      generada, dado y copiar
apps/web/src/components/lists/access-gate.tsx         la puerta (§8.6)
apps/web/src/components/lists/access-log-rows.tsx     los intentos (D27)
apps/web/src/components/lists/list-form.tsx
apps/web/src/components/lists/list-stats.tsx
apps/web/src/components/lists/viewer-rows-stats.tsx   quién ha entrado (D35)
apps/web/src/components/lists/overlap-rows.tsx        el solapamiento (D36)
apps/web/src/components/lists/roll-call.tsx           el pase de lista (§8.6)
apps/web/src/components/lists/list-poster.tsx         lo que se rasteriza (D18, D39)
apps/web/src/components/lists/locked-poster.tsx       la portada cerrada (D18)
apps/web/src/components/lists/list-dots.tsx           los puntos en creyentes
apps/web/src/components/believers/believer-access.tsx «Está en» y «Puede ver» (§8.7)
apps/web/src/lib/lists/use-list-screen.ts
apps/web/src/lib/lists/wake-path.ts                   la geometría, con su test
apps/web/src/lib/lists/export-columns.ts              (RFC 0009 D7)
packages/api-client/src/list-hooks.ts
packages/api-client/src/list-mutations.ts
packages/api-client/src/list-viewer-mutations.ts
packages/api-client/src/public-list-hooks.ts          sin sesión, con credenciales
```

## Lo que hay que tocar fuera del código nuevo

Los cinco sitios donde esto se rompe si se olvidan. Van juntos a propósito.

| Dónde                                    | Qué                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `apps/api/src/main.ts`                   | `/l` al `exclude` de `setGlobalPrefix`, y la ruta `VERSION_NEUTRAL` (D14) |
| `docker/nginx/navis.officetools.es.conf` | `location /l/` al contenedor de la API, **antes** de `location /` (D14)   |
| `apps/web/vite.config.ts`                | `navigateFallbackDenylist: [/^\/l\//, /^\/api\//]` (D15)                  |
| `apps/web/public/robots.txt`             | `Disallow: /l/` (D10)                                                     |
| `.env` de producción                     | `TRUST_PROXY=true`, o el freno de D27 bloquea a todo el mundo (D32)       |

Los dos de despliegue —nginx y el `.env`— se anotan en `DESPLIEGUE.md`, y el
primero exige recargar nginx en el servidor.

## Consideraciones

- **Privacidad.** Es la funcionalidad con más superficie del proyecto, porque es
  la única que saca datos de personas fuera. Lo que la sostiene: token secreto
  (D10), lista blanca cerrada de campos (D16), fotos con su propia puerta de
  cinco cierres (D17), foto apagada por defecto, `noindex` (D10), despublicar que
  despublica de verdad (D11), rotación obligatoria al restringir (D12), caducidad
  opcional (D13), sin IP entera (D32), y la puerta con accesos concedidos uno a
  uno (D19 a D30). Y una pantalla de publicación que dice en castellano qué va a
  pasar antes de que pase (D8).
- **Seguridad.** Contraseñas con `scrypt` y sal por acceso (D24), comparación en
  tiempo constante y contra un hash falso cuando el usuario no existe, cookie
  firmada que solo dice quién eres (D23), autorización comprobada en cada
  petición contra `list_grants`, revocación instantánea (D28), freno por origen
  y no por cuenta (D27), IP tomada del último salto y no del primero (D32), y
  registro de intentos sin guardar contraseñas (§6.6). Y una raya que no se
  cruza: **la autenticación de accesos y la de la aplicación no comparten nada**
  (D22).
- **Sin conexión.** El panel, como el resto: la PWA carga y las consultas fallan
  con su mensaje. La página pública **no la toca el service worker** (D15) y no
  debe: quien la abre no tiene la aplicación instalada.
- **IA.** Nada. Ni ahora, ni con los nombres de nadie.
- **Rendimiento.** Una lista son decenas de personas, no miles: se pide entera,
  sin paginar. Se acotan la estela —treinta días—, el solapamiento —veinte— y el
  registro —cincuenta—. `scrypt` va en `2^14`, asíncrono y con el freno delante,
  por el pool de cuatro hilos de Node (D24).

## Alternativas descartadas

- **Servir la página pública entera desde la API**, sin SPA. Una URL, sin
  redirección, sin bundle: tentador. Se descarta porque sería **un tercer sitio
  donde se escribe interfaz**, sin el sistema de diseño, sin los tokens de tema y
  con las traducciones cableadas a mano en el servidor. La Regla 1 §2.3 ya dice
  que la interfaz no se comparte entre runtimes distintos, y un HTML generado en
  Nest es otro runtime.
- **Distinguir al rastreador por su `User-Agent` en nginx** y mandarlo a la API
  solo a él, dejando una URL sin redirección. Es una lista de agentes que hay que
  mantener para siempre, y cuando falla, falla justo en lo único que esta
  funcionalidad tiene que hacer bien: enseñar la tarjeta.
- **Generar la imagen de la tarjeta en el servidor.** Necesita un navegador
  dentro del contenedor de la API: cientos de megas de imagen y un proceso más
  que vigilar, para hacer lo que el navegador de quien comparte ya hace gratis
  (D18).
- **Listas dinámicas por filtro** (D5): un cartel que se reescribe a espaldas de
  quien lo colgó.
- **Reutilizar el catálogo de labores como listas.** Se parecen —y las cinco de
  serie comparten nombre y color con cinco labores—, pero una labor es **un
  atributo de una persona** y una lista es **una selección publicada y
  ordenada**. Fundirlas obligaría a que quien tiene la labor de púlpito saliera
  publicado, que es exactamente lo que no puede pasar.
- **Una contraseña por lista, sin usuario** («la clave del púlpito es 1234»). Lo
  más simple y no cumple lo que se pidió: no se puede quitar el acceso a una
  persona sin cambiársela a todas, y el registro no puede decir quién entró.
- **Guardar las credenciales dentro de cada lista** en vez de un directorio
  (D19). Cuatro contraseñas para los mismos ancianos, y la regla de «vale aquí y
  no allí» funcionando por casualidad.
- **Que entrar en una lista dé acceso a todas las de la iglesia.** Es lo que pasa
  si la autorización se hace solo al iniciar sesión y no al servir (D23).
- **Reutilizar las cuentas de Better Auth para esto** (D22). Convertiría a
  cincuenta personas de la congregación en usuarios del sistema, con su rol, su
  perfil y su sesión, para leer una lista de doce nombres.
- **Enlazar automáticamente pertenencia y acceso** (D21). Cómodo un día y
  peligroso todos los demás.
- **Meter en la cookie lo que se puede ver.** Rápido, y hace imposible revocar
  (D23, D28).
- **Bloquear el acceso tras N fallos.** Cualquiera con el enlace podría dejar
  fuera a quien quisiera (D27).
- **Guardar la IP completa.** No contesta ninguna pregunta que no conteste ya el
  prefijo más el hash, y crea una obligación (D32).

## Criterios de aceptación

### La lista

- [ ] La entrada «Listas» sale en el bloque de iglesia y se despliega con una
      subentrada por lista activa, igual que el calendario.
- [ ] Una iglesia nueva nace con las cinco listas de serie, vacías, sin publicar
      y con el color de su labor.
- [ ] Se marcan personas en creyentes —con filtros de labor, sede, don y estado—
      y se añaden a una lista de una vez.
- [ ] El orden se cambia arrastrando **y con el teclado**, y es el que sale en la
      página pública.
- [ ] Renombrar una lista no cambia su `slug`.
- [ ] Una lista de otra iglesia no se lee ni se edita, y hay un e2e que lo
      intenta.

### Publicar

- [ ] Los tres modos se distinguen desde la portada, con icono y texto.
- [ ] Al pegar el enlace de una lista **abierta** en WhatsApp sale la tarjeta con
      la imagen de la lista, su nombre y su descripción.
- [ ] Al pegar el de una **restringida**, la tarjeta **no enseña ni un nombre ni
      el número de personas**, y hay un test que lo comprueba sobre el HTML y
      sobre la imagen.
- [ ] Pasar de abierta a restringida **cambia el enlace** y lo avisa antes.
- [ ] La página pública se abre **sin sesión**, en una ventana privada, y no
      enseña ni barra lateral ni selector de iglesia.
- [ ] La página pública se abre igual **con la aplicación instalada como PWA**:
      hay un e2e que instala el service worker, recarga y entra por el enlace.
- [ ] La respuesta pública no lleva teléfono, correo, cumpleaños, estado, dones
      ni identificadores, ni siquiera activando todas las opciones. Hay un e2e
      que lo comprueba campo a campo.
- [ ] Un creyente borrado desaparece del cartel al momento.
- [ ] Las fotos cargan en la página pública cuando están activadas, y la de
      alguien que no está en esa lista da 404 aunque el token sea válido.
- [ ] Dejar de compartir deja el enlace en 404 al momento, y volver a publicar da
      un token distinto.

### Los accesos

- [ ] **Un acceso concedido a la lista A no abre la lista B**, aunque el usuario
      y la contraseña sean correctos: da 403 con su mensaje. Es el e2e central de
      esta entrega.
- [ ] **Un mismo acceso abre varias listas** marcando sus casillas, sin crear un
      usuario por lista, y **quien ya entró en una abre las demás sin volver a
      escribir nada**.
- [ ] Quitarle **una** lista a un acceso no afecta a las otras y no cambia su
      contraseña.
- [ ] Un acceso se crea **desde un creyente**, hereda su nombre, y la ficha de esa
      persona enseña su acceso y las listas que abre.
- [ ] Un creyente no puede tener dos accesos, y el segundo intento da 409 con un
      enlace al que ya existe.
- [ ] **Añadir a alguien a una lista no le da acceso**, y darle acceso no lo mete
      en la lista. Hay un e2e de cada dirección.
- [ ] «Dar acceso a los de esta lista» crea solo los que faltan y devuelve la hoja
      de credenciales una vez.
- [ ] Con la cookie ya emitida, quitarle la concesión le cierra la lista **en la
      petición siguiente**.
- [ ] Regenerar la contraseña, desactivar el acceso, borrarlo o despublicar la
      lista cierran al momento las sesiones abiertas.
- [ ] La contraseña se genera sola al abrir el formulario, se puede volver a
      tirar, se copia, y **no vuelve a verse**: no hay ningún endpoint que la
      devuelva.
- [ ] La contraseña entra igual escrita con guiones que sin ellos.
- [ ] Un usuario que no existe y una contraseña incorrecta dan **el mismo
      mensaje** y tardan lo mismo.
- [ ] Al undécimo intento desde el mismo origen en quince minutos, la respuesta es
      429 y dice cuánto falta. El acceso legítimo **sigue funcionando desde otro
      sitio**.
- [ ] Un `X-Forwarded-For` inventado no cambia ni el freno ni el recuento.
- [ ] En la base de datos no hay ninguna contraseña en claro, ni en
      `list_viewers` ni en `list_access_log`.
- [ ] Publicar en modo restringido sin ninguna concesión se rechaza y lo explica.
- [ ] Borrar un acceso libera su nombre de usuario para volver a usarlo.

### Lo que se ve

- [ ] Recargar la página pública cinco veces cuenta **una** visita.
- [ ] En la base de datos no hay ninguna dirección IP completa.
- [ ] En una lista restringida, las estadísticas dicen **quién** ha entrado, con
      nombre y foto, cuántas veces y cuándo, y cuántos no han entrado nunca.
- [ ] La estela se lee con teclado y tiene su tabla de datos detrás.
- [ ] Las estadísticas dicen quién está en cuatro listas o más, y la cifra abre el
      listado de creyentes filtrado.
- [ ] La lista se exporta en los cinco formatos del RFC 0009 sin haber escrito
      ningún escritor nuevo.

### El suelo

- [ ] Todas las filas de la tabla de **«Casos límite»** tienen su test.
- [ ] Ninguna pantalla —incluidas la pública y la puerta— tiene scroll horizontal
      a 375 px, con el texto en alemán y en los dos temas.
- [ ] La puerta se recorre entera con el teclado, con el foco visible, y el error
      se anuncia a un lector de pantalla.
- [ ] Los ficheros nuevos siguen dentro del objetivo de la Regla 6.
- [ ] `pnpm check` y `pnpm test:e2e` en verde, con los e2e de la API contra
      Postgres **y** SQLite.
