# Navis — convenciones del repositorio

Contexto para quien (o lo que) trabaje en este código.

- Las **reglas del proyecto** están en [`.claude/rules/`](./.claude/rules) y se
  aplican a todo lo que se escriba aquí.
- Cómo colaborar, en [`CONTRIBUTING.md`](./CONTRIBUTING.md).
- Aquí abajo, lo que hay que saber del terreno para no tropezar.

## Qué es

Monorepo pnpm con cuatro clientes (API, web, móvil, escritorio) sobre paquetes
compartidos. La funcionalidad de negocio **todavía no está implementada**: cada
sección tiene su propuesta escrita en [`docs/rfcs`](./docs/rfcs) y una pantalla
puente que enlaza a ella.

## Mapa

```
apps/api        NestJS 11 + TypeORM 1 + Better Auth
apps/web        Vite 8 + React 19 + React Router 8 (PWA)
apps/mobile     Expo 57 + expo-router + NativeWind 5
apps/desktop    Tauri 2 (Rust) envolviendo apps/web
apps/ai         microservicio Python (esqueleto)
packages/shared      tipos y esquemas zod, incluido el contrato de entorno
packages/theme       tokens Tailwind v4 y store de tema (light/dark/system)
packages/i18n        seis idiomas, con detección del idioma del dispositivo
packages/api-client  cliente HTTP tipado y hooks de TanStack Query
```

## Trampas de este repositorio

Cosas que ya han costado un rato y no hace falta volver a descubrir.

- **`node-linker=hoisted`** es obligatorio (Metro/Expo). Consecuencia: los
  paquetes viven en el `node_modules` de la raíz, no en el de cada app. Por eso
  el CLI de TypeORM se lanza desde `apps/api/scripts/typeorm.mjs`, que lo
  resuelve con `require.resolve`.
- **`inject-workspace-packages` debe seguir desactivado**: copia los paquetes
  del workspace en vez de enlazarlos y congela su `dist`.
- **TypeScript se queda en 5.9.3**: `@nestjs/cli@11` lo fija internamente y todo
  Nest/TypeORM depende de `emitDecoratorMetadata`.
- **`lightningcss` fijado en 1.30.1**: con 1.33 el compilador de
  react-native-css falla y no se puede empaquetar la app móvil.
- **`bodyParser: false` en `NestFactory.create`**: Better Auth necesita el
  cuerpo crudo y su handler se monta antes que `express.json()`.
- **`tsconfig.build.json` de la API no lleva `rootDir`**: el builder de SWC solo
  aplica `stripLeadingPaths` si no lo hay; con él, la salida sería
  `dist/src/main.js`.
- **Las entidades de TypeORM se listan a mano**, sin globs: con glob, TypeORM
  hace `require()` de ficheros `.ts` al correr los tests sobre el fuente.
- **El `DataSource` es la única exportación de su tipo** en `data-source.ts`: el
  CLI de TypeORM falla si encuentra dos (por eso no hay `export default`).
- **Una migración que importa de `@navis/shared` no está congelada**:
  `CreateRoles` siembra a partir de `ROLES`, así que al cambiar esa constante
  cambió lo que crea en una base de datos **nueva**, no en las que ya existían.
  Las migraciones siguientes que tocan lo mismo tienen que valer para los dos
  casos (ver `SeedMinistryRoles`, que renombra si encuentra lo viejo y siembra
  si no).
- **`queryRunner.query` devuelve `any`** y no acepta genérico: lo que sale de un
  `SELECT` en una migración se comprueba antes de usarlo (Regla 10).
- **`apps/api/src/metadata.ts` lo genera el build y está en `.gitignore`**: con
  `nest start --watch` corriendo, `tsc` lo pillaba a medio escribir y `pnpm
check` fallaba con errores de sintaxis en un fichero que nadie había tocado.
  Está excluido del `tsconfig.json` de la API —no lo importa nadie—, así que si
  vuelve a aparecer el problema es que alguien lo ha vuelto a incluir.
- **`/health` es `VERSION_NEUTRAL`**: el versionado por URI lo dejaría en
  `/v1/health` y tanto Docker como el despliegue consultan `/health`.
- **En postgres:18 el volumen va en `/var/lib/postgresql`**, no en `/data`.
- **En Jest (móvil) el preset de NativeWind se desactiva**: sus componentes
  chocan con los mocks de React Native. Los tests comprueban comportamiento, no
  estilos.
- **`@testing-library/react-native` 14: `render` y `fireEvent` son asíncronos.**
- **La identidad (nombre e icono) no se toca a mano**: `pnpm rename <Nombre>` y
  `pnpm icons`, con `brand.json` y `packages/theme/src/logo/` como fuentes. Hay
  tests que comprueban que está aplicada en todas partes.
- **`pnpm rename` recorre `git ls-files`**, así que lo ignorado por git no lo
  vería: por eso trata aparte `.env*` y `data/` (ahí vivía la base de datos
  local con el nombre viejo), y apunta el slug abandonado en
  `docker/marcas-anteriores.txt` para que `scripts/limpiar-docker.sh` pueda
  borrar del servidor las imágenes que deja atrás.
- **El `.icns` que genera Tauri no es reproducible byte a byte**: sale distinto
  en cada ejecución de `pnpm icons`. Si aparece como único cambio, es ruido.
- **La versión vive en siete sitios** (package.json de la raíz y de cada app,
  app.config.ts, tauri.conf.json, Cargo.toml y Cargo.lock). No la toques a
  mano: `pnpm release` los sincroniza y hay un test que falla si alguno se
  queda descolgado.
- **Padre e hijo de TypeORM no se importan el uno al otro.** `@ManyToOne(() =>
Padre)` parece perezoso, pero `emitDecoratorMetadata` escribe la clase en los
  metadatos y la evalúa al cargar el módulo: el par acaba en «Cannot access
  'X' before initialization» al arrancar. En el lado hijo se referencia **por
  nombre** y con el tipo envuelto: `@ManyToOne('Padre', 'hijos')` y
  `padre: Relation<Padre>`, con `import type`.
- **Una relación sin `ORDER BY` no vuelve ordenada en Postgres.** Las fases de
  una reunión salían en el orden de inserción en SQLite —por casualidad— y
  desordenadas en Postgres («predicación, testimonios, introducción»). El orden
  se pide en la consulta: `order: { phases: { position: 'ASC' } }`.
- **Un `IN ('')` contra una columna `uuid` revienta en Postgres** («invalid
  input syntax for type uuid») y a SQLite le da igual, porque ahí todo es
  texto. Pasó al mapear los `believer_id` nulos a cadena vacía antes de
  buscarlos: los identificadores vacíos se filtran **antes** de la consulta.
  Es el motivo por el que los e2e de la API se corren en los dos motores.
- **Una columna `date` leída en crudo desde Postgres vuelve como `Date`**, y el
  driver la construye a **medianoche local**: `toISOString().slice(0,10)`
  devuelve entonces el día anterior en cualquier huso al este de Greenwich. El
  `MAX(occurred_at)` de las notas daba el 31 de julio para una nota del 1 de
  agosto. Se convierte con los getters locales, y en un solo sitio:
  `apps/api/src/database/iso-day.ts`.
- **Restar fechas no se escribe igual en los dos motores**: Postgres resta dos
  `date` y devuelve un entero; SQLite no tiene tipo fecha y hay que pasar por
  `julianday(date(...))` —con el `date()` puesto, o la resta incluye la hora y
  deja de ser un número entero de días—. Está absorbido en `database/date-sql.ts`,
  junto con el `NULLS FIRST`, que en SQLite ni existe.
- **Con relaciones cargadas, `take`/`skip` de TypeORM pasan a una subconsulta
  con `DISTINCT`**, y ahí Postgres exige que todo lo que se ordena esté en la
  lista de selección. En un listado paginado se consulta la tabla sola con
  `limit`/`offset` y las relaciones se piden aparte, ya con los identificadores
  de la página.
- **Al quitar una columna en SQLite, TypeORM recrea la tabla pero vuelve a
  poner los índices que había.** O sea: una migración que los cree «por si
  acaso» después de un `dropColumn` muere con «index already exists». Solo se
  crean los **nuevos**.
- **`@Res({ passthrough: true })` y un `pipe` no se llevan.** Nest cierra la
  respuesta al volver del handler, así que el stream se corta a medias y
  supertest lo ve como «Error: aborted». Para servir un fichero se devuelve un
  `StreamableFile`, y `Res` queda solo para poner cabeceras.
- **Un elemento solo admite una `animation` y un `animation-delay`.** La sonda
  de creyentes hace tres cosas —entrar llenándose, transicionar al cambiar de
  valor y latir escalonada cuando se desborda—, así que son tres capas
  anidadas, cada una con la suya. Y el valor se anima con `transform: scaleX()`
  y no con `width`, que el compositor no sabe resolver (Regla 9 §5).
- **`calc()` sin espacios alrededor del `-` es CSS inválido.** En una clase de
  Tailwind (`w-[min(30rem,calc(100vw-2rem))]`) funciona porque el compilador lo
  normaliza; en un `style` en línea, la declaración entera se descarta sin
  avisar. Escríbelo `calc(100vw - 2rem)`.
- **Un hijo ancho dentro de un `flex-col` ensancha al padre**: `min-width: auto`
  impide que el elemento se encoja, así que un `<dialog>` con una imagen grande
  dentro se sale de la pantalla aunque tenga `width` puesto. Se arregla con
  `min-w-0` en el contenedor.
- **`getBoundingClientRect` incluye los `transform` de los ancestros** y
  `offsetWidth`/`offsetHeight` no. Para medir algo que se está enseñando
  reducido —la lámina del calendario dentro de su vista previa— van los
  segundos, o la imagen sale recortada.
- **Crear y desconectar un `ResizeObserver` en cada render lo deja mudo**: la
  primera medición se entrega de forma asíncrona y el `cleanup` la cancela
  antes de que llegue. El efecto lleva dependencias.
- **GHCR solo acepta nombres de imagen en minúsculas**, y `github.repository`
  conserva las mayúsculas (`CrisAlejo26/Navis`). El workflow de despliegue lo
  baja a minúsculas en el paso `meta` y pasa ese nombre al servidor; sin eso,
  `docker buildx` corta con «repository name must be lowercase».
- **Los finales de línea los fija `.gitattributes`, no la máquina.** Con
  `core.autocrlf=true` —lo normal en Windows— git escribía CRLF en el árbol de
  trabajo y Prettier, configurado con `endOfLine: lf`, daba por mal formateado
  medio repositorio después de cada `checkout`: se formateaba, se subía, y a la
  siguiente operación de git volvía a fallar. `* text=auto eol=lf` lo corta de
  raíz. Si algún día `pnpm format:check` marca ficheros que nadie ha tocado, es
  que se ha colado algo que salta esa regla.
- **Los hooks de git son ficheros en `.husky/`, no la configuración.** Tener
  husky instalado y `lint-staged` configurado en `package.json` no ejecuta
  nada: la carpeta estaba vacía y por eso llegaba a CI sin formatear. Los hooks
  se reparten con `pnpm install` (el script `prepare`).
- **En `lint-staged` va lo mismo que verifica CI, y nada más.** Con oxlint
  dentro, un commit se bloqueaba por reglas que no comprueba ni `pnpm check` ni
  el workflow —un `<th scope="row">` con su botón dentro, por ejemplo—. oxlint
  sigue disponible a mano en `pnpm lint:fast`.
- **En Playwright, un service worker activo se come los `page.route`.** En la
  primera carga no controla la página y todo funciona; tras un `reload` sí, las
  peticiones dejan de pasar por los `route` del test y la aplicación se queda
  sin sesión. Los specs que sirven la API desde el navegador van con
  `test.use({ serviceWorkers: 'block' })`; el service worker tiene su propio
  spec.
- **En local, Playwright reutiliza el `preview` que ya esté escuchando.** El
  `webServer` lleva `reuseExistingServer: !CI`, así que si quedó uno vivo en el
  4173 de una sesión anterior, `pnpm test:e2e` **no reconstruye**: corre contra
  el build viejo y los tests de lo recién escrito fallan con un «no encuentro el
  botón» perfectamente creíble. Si un e2e falla por algo que en el código está,
  mira el puerto antes que el test.
- **Una banda fija abajo se come la acción principal.** El aviso de la PWA
  vivía ahí y no se iba solo, así que en un teléfono tapaba el botón que la
  Regla 5 §4 manda poner justo en ese sitio. Lo que es una **noticia** va por
  el `Toaster` —arriba y con temporizador—; lo que es una **decisión** puede
  ser banda, pero se cierra y lleva `pointer-events-none` en el contenedor.
- **Los ficheros subidos no están en la base de datos.** Los audios de las notas
  viven en `UPLOADS_PATH` —un volumen de Docker— y **no entran en un volcado de
  Postgres**: esa carpeta va aparte en las copias de seguridad.
- **Las profecías no llevan `church_id`, y no falta.** Son de cada usuario y no
  de una iglesia (RFC 0004 D1): es el único módulo del proyecto sin esa columna,
  sin `ActiveChurchGuard` y sin permisos de rol. La única barrera de acceso es
  el filtro por dueño, y por eso vive en `PropheciesRepository` —que lo exige en
  todos sus métodos— y no en el controlador. Si alguien añade un endpoint ahí,
  el test que hay que copiar es el e2e que intenta leer la profecía de otro.
- **Un método de servicio que valida y lanza tiene que ser `async`.** Sin él,
  la excepción sale de forma **síncrona** al llamarlo, en vez de rechazando la
  promesa: `expect(...).rejects` no la ve y un `.catch()` del llamador tampoco.
  Pasó con `PropheciesService.create`, y lo cazó el test.
- **Exportar una constante junto a un componente rompe el recambio en
  caliente.** La regla `react-refresh/only-export-components` avisa: un módulo
  con un componente **solo** exporta componentes. Los mapas de iconos y de
  clases van a su propio fichero (`lib/prophecies/state-icons.ts`).
- **En React 19 `ref` es una prop más**: `Input` y `Textarea` la declaran y la
  pasan al elemento, sin `forwardRef`. Hace falta porque dentro de un `<dialog>`
  modal el foco lo reparte el navegador al abrirlo y `autoFocus` no vale.
- **`setState` dentro de un efecto para copiar props es un error de lint**, no
  un aviso. Cuando un formulario tiene que nacer con datos que llegan tarde, se
  monta con `key` cuando ya están (ver `ProphecyForm` → `ProphecyFormBody`): así
  su estado nace correcto y ningún `refetch` pisa lo que se está escribiendo.
- **Una fila de listado no sirve para editar lo que trunca.** `ProphecyListItem`
  lleva un `excerpt` del cuerpo, no el cuerpo: el formulario de edición recibe
  el **identificador** y lo vuelve a pedir. Guardar desde la fila habría
  recortado el texto sin avisar.
- **recharts vive detrás de una sola puerta.** Solo se importa en
  `components/prophecies/charts/`, y la portada lo carga con `React.lazy`: son
  ~370 kB que se quedan en su propio trozo (`charts-*.js`) y no entran en el
  bundle inicial. Si algún día se cambia por SVG propio, se toca esa carpeta y
  ninguna otra.
- **`formatDate` con un día de calendario pinta el día anterior.** Es la pareja
  en la interfaz de la trampa de `iso-day.ts`: `new Date('2026-03-14')` es
  medianoche **UTC**, y al pintarla en la hora local de cualquier huso al oeste
  de Greenwich sale el 13. En Bogotá, todas las fechas de profecías salían un
  día antes. Para `AAAA-MM-DD` va `formatDay`, que formatea en UTC; `formatDate`
  queda para instantes de verdad.
- **El barril de `packages/api-client` reexporta en plano.** Dos módulos con una
  función del mismo nombre —había un `toSearch` en profecías y otro en sueños—
  se pisan en el `index.ts` sin que nadie avise. Por eso el de sueños se llama
  `toDreamSearch`.
- **Los audios se guardan por ámbito, y el de iglesia no lleva prefijo.**
  `AudioStorageService` recibe `churchScope(id)` o `userScope(id)`; el primero
  escribe en `<uploads>/<churchId>/` porque **ahí están ya** los ficheros de las
  notas y su `storage_key` apunta a esa ruta. Moverlos para que quedara
  simétrico obligaría a tocar disco y base de datos a la vez para no ganar nada.
- **Un `.xlsx` es un ZIP de siete XML y el orden de los elementos es ley.**
  `styles.xml` pide `fonts`, `fills`, `borders`, `cellStyleXfs`, `cellXfs` y
  `cellStyles` en ese orden, y una hoja pide `sheetViews`, `cols`, `sheetData`,
  `autoFilter` y `mergeCells` en el suyo. Con uno fuera de sitio Excel no abre
  el fichero: ofrece repararlo. Y lo mismo con un **carácter de control** dentro
  de un texto, que es inválido en XML 1.0 y se cuela copiando de cualquier
  sitio: se limpian en `escapeXml`. Lo escribe `lib/export/xlsx/`, sin
  librería, como el PDF de la lámina.
- **Las fechas del Excel van con el formato 14, el corto integrado.** Escribir
  `dd/mm/yyyy` a mano deja el fichero en español para siempre; el 14 se pinta
  con la configuración regional de quien lo abre. El valor es un número de
  serie desde el **30 de diciembre de 1899**, no desde el 1 de enero de 1900:
  Excel se cree que 1900 fue bisiesto.
- **La verificación de CI formatea en vez de morir**, y si cambia algo lo sube
  en un commit con `[skip ci]`. El `[skip ci]` no es por ahorrar: sin él, ese
  push cancelaría la propia ejecución por la regla de `concurrency`.
- **Un `IN (...)` no garantiza el orden de lo que devuelve.** Al meter tres
  personas de golpe en una lista, `find({ where: { id: In(ids) } })` las
  devolvía en el orden de inserción en Postgres y en otro en SQLite, y ese es el
  orden con el que quedaban numeradas en un cartel publicado. Lo que tenga que
  salir en el orden en que llegó se recompone **a partir de la petición**, no de
  la consulta (`ListMembersService.add`).
- **`Array.isArray` sobre un `unknown` lo estrecha a `any[]`**, no a
  `unknown[]`: el elemento sale `any` y con él vuelven los `no-unsafe-*` de la
  Regla 10 justo donde se creía estar comprobando. Se usa un predicado propio
  (`value is readonly unknown[]`), como en la migración `CreateLists`.
- **El filtro de excepciones aplana el cuerpo del error.** `AllExceptionsFilter`
  construye un `ApiErrorBody` fijo, así que un campo suelto puesto en un
  `HttpException` no llega al cliente. Lo que la pantalla necesita para pintarse
  —la puerta de una lista restringida, el tiempo que falta de un 429— va en
  `data`, que es el único campo que viaja entero.
- **El cliente de API redirige a `/login` ante un 401**, y eso es lo correcto en
  el panel y un desastre en la página pública de una lista: allí el 401 **es la
  puerta** y quien la abre no tiene cuenta. Por eso hay un segundo cliente sin
  `onUnauthorized` (`lib/lists/public-api.ts`), y es la única razón de que
  exista.
- **Un script de `src/scripts/` no se puede lanzar con `tsx`.** Si levanta la
  aplicación (`NestFactory.createApplicationContext`), esbuild no emite
  `emitDecoratorMetadata` y la inyección muere con «The dependency at index [0]
  appears to be undefined at runtime», que suena a un `import type` mal puesto y
  no lo es. Se compila y se corre desde `dist/`, que es además como se ejecuta
  en el servidor: `pnpm --filter @navis/api build` y después el `node dist/…`.
- **Un stub de e2e que se queda desfasado no lo canta nadie.** El de
  `apps/web/e2e/servidor.ts` mandaba `activeChurchId` donde el contrato dice
  `activeId`, así que en los tests **no había iglesia activa** y las piezas que
  dependen de ella —el selector de la barra lateral, ahora la ficha de
  ajustes— simplemente no se pintaban. Nada falla: se deja de comprobar. Al
  añadir un campo a un esquema de `shared`, se mira si el stub lo trae.
- **Los e2e levantan la app entera, con su `fetch` de verdad.** Los festivos
  salían a la calle en cada tramo de calendario que pedía un test. Se apaga con
  `HOLIDAYS_API_URL=''` en `vitest.e2e.setup.ts`; si mañana entra otra
  dependencia externa, ese es el sitio.
- **El bloque `location /l/` de nginx se instala a mano en el servidor**, y no
  lo despliega Actions. Cuando falta, `/l/<token>` lo contesta el contenedor de
  la web: la tarjeta de WhatsApp sale con el título y la descripción genéricos
  de Navis para las cinco listas y el enlace muere en el 404 de React Router. El
  404 lo tapa una ruta de respaldo en la SPA (`ShareLinkFallback`), pero **la
  tarjeta no**, porque el rastreador no ejecuta JavaScript: una vista previa
  genérica significa siempre que el proxy está viejo. Se ve con
  `curl -sI …/l/<token>`, que solo trae `x-robots-tag` si contesta la API.
- **El service worker se come cualquier navegación que no esté en la
  denylist.** Con `navigateFallback: '/index.html'` y sin
  `navigateFallbackDenylist`, `/l/<token>` lo contesta él y la petición no llega
  ni a nginx ni a la API: el enlace público funciona en un teléfono cualquiera y
  falla justo en el de quien tiene la PWA instalada. Hay un e2e que lo cubre
  instalando el service worker y entrando por el enlace.

## Antes de dar algo por terminado

```bash
pnpm check        # formato + lint + tipos + tests (incluye los del script de release)
pnpm test:e2e     # API y web
```

Y, si has tocado la app móvil o la de escritorio:

```bash
pnpm --filter @navis/mobile exec expo-doctor
cd apps/desktop/src-tauri && cargo check
```
