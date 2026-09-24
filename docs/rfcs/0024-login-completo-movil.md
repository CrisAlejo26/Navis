# RFC 0024: Login completo en móvil (local primero, servidor después)

- **Estado**: En curso — Fase 1 implementada (pendiente de probar en dispositivo); Fases 2-5 sin empezar
- **Autor**: Cristian Alejandro Arroyave (con Claude Code)
- **Fecha**: 2026-09-09
- **Apps afectadas**: mobile (api y web con cambios menores)
- **Depende de**: RFC 0007 (modo local y servidor), RFC 0023 (recuperación por
  correo en web), RFC 0008 (iglesias como espacios de trabajo)

## Problema

La app móvil de Navis solo funciona conectada a una API: sin servidor no hay
nada. Un pastor que se la descarga debería poder **empezar a usarla al
instante**, con los datos guardados en su propio teléfono, y decidir más
tarde —si quiere— conectarse al servidor de su iglesia **sin perder lo que ya
escribió**. Y también al revés: si deja de usar el servidor, sus datos vuelven
al teléfono y siguen ahí.

Además, entrar cada vez pidiendo email y contraseña completos es más de lo
que un teléfono debería pedir: con huella o un PIN basta, como hace Taskia
(`D:\Proyectos_personales\taskia\mobile`), cuyo patrón de inicio rápido se
replica aquí.

Referencia de funcionamiento: Taskia — credenciales y secretos en SecureStore,
PIN hasheado con pepper, biometría como desbloqueo local, guard declarativo de
navegación.

## Visión general

La app móvil pasa a tener **una base de datos SQLite propia** (expo-sqlite)
que es siempre la copia de trabajo, y dos modos:

| Modo                                  | Dónde viven los datos                         | Cómo se entra                     |
| ------------------------------------- | --------------------------------------------- | --------------------------------- |
| **Local** (primera vez y por defecto) | En el teléfono                                | Contraseña, PIN o huella          |
| **Conectado** (opcional, después)     | En el servidor; el teléfono conserva su copia | Cuenta del servidor, PIN o huella |

La conexión se hace **una vez en cada sentido** (migración, no sincronización
continua):

- **Conectar**: la iglesia y los datos locales se suben al servidor; a partir
  de ahí el servidor manda.
- **Desconectar**: los datos del servidor se bajan al teléfono y la app sigue
  funcionando en local con todo lo que había.

No es offline-first con sincronización bidireccional continua — eso quedó
fuera en RFC 0007 y sigue fuera. Los datos de las tablas locales son **los
mismos campos y los mismos tipos** que las entidades de TypeORM (paridad
exigida y comprobada con tests, ver §Paridad de datos).

## Alcance

**Entra** (por fases, cada una entregable por separado):

- **Fase 1** — Base de datos local + pantalla de primera vez (crear usuario y
  iglesia) y app funcionando en modo local.
- **Fase 2** — Inicio rápido: PIN y huella (patrón de Taskia).
- **Fase 3** — Conectar al servidor por API: migración local → servidor.
- **Fase 4** — Desconectar del servidor: migración servidor → local, sin
  perder nada.
- **Fase 5** — Recuperar contraseña (solo modo conectado).

**No entra:**

- **Sincronización continua** entre teléfono y servidor (ni edición simultánea
  desde dos sitios con el teléfono en local): la conexión es una migración con
  dirección única cada vez. Un offline-first real es otra propuesta.
- **Base de datos en web/escritorio**: solo la app móvil lleva SQLite propio;
  web y escritorio siguen hablando siempre con la API.
- **API key a mano**: la credencial contra el servidor es la sesión de Better
  Auth (en el SecureStore); «quitar la URL y el token» se resuelve con la
  acción _Desconectar_ de la Fase 4, que borra la conexión y la sesión. Un
  mecanismo de API key paralelo sería más frágil y menos seguro (RFC 0007).
- **Volver a la app con deep link al terminar el reset de contraseña**.

## Enmienda al RFC 0007

RFC 0007 descartó la pantalla de ajustes con URL y token. Se revisita para el
móvil con dos matices: la app nativa se instala (no se recompila por iglesia),
y lo que se configura no es un token a mano sino la **URL del servidor** — la
credencial sigue siendo la sesión de Better Auth. Además, el «modo local» de
RFC 0007 era una API corriendo con SQLite en algún sitio; este RFC añade el
modo local **del teléfono**, que RFC 0007 no contemplaba. Queda en RFC 0007
una nota que remite aquí.

---

# Fase 1 — Base de datos local y primera vez

## Modelo de datos local

`expo-sqlite` en `apps/mobile/src/data/`, con el esquema de los módulos que la
app móvil usa, **escrito con las mismas columnas y tipos** que las entidades
de TypeORM (los `TIMESTAMP` de `column-types.ts`, los mismos nombres). Las
tablas de Better Auth no se replican: la cuenta local es una tabla propia.

```
apps/mobile/src/data/
├── db.ts               — abre la base, ejecuta migraciones propias (versionadas)
├── schema.ts           — definición de tablas, espejo de las entidades de la API
└── repos/              — un repositorio por módulo, misma firma que los de la API
```

- Migraciones propias de la app (no las de TypeORM): SQLite del móvil no pasa
  por `pnpm db:migrate`; `db.ts` aplica las pendientes al arrancar, dentro de
  una transacción.
- **Paridad**: un test compara, para cada entidad replicada, las columnas de
  `schema.ts` con los metadatos de la entidad de TypeORM (nombre, tipo,
  anulable). Si alguien añade un campo en la API y no en el móvil, el test
  falla — es la trampa de los stubs desfasados, pero para el esquema.
- Preferencias no sensibles (tema, idioma) siguen en AsyncStorage, como hoy.
  Sensible (sesión, hash de PIN, pepper, credenciales locales) en SecureStore.

## Cuenta local

- La primera vez se crea el usuario local: nombre, email y contraseña. La
  contraseña se guarda **hasheada** en la base local (pepper de 32 bytes
  aleatorios por dispositivo en SecureStore + SHA-256 con el email de sal —
  mismo espíritu que el PIN de Taskia). El email no se verifica: no hay correo
  en modo local.
- Entrar en la app local = contraseña (o PIN/huella, Fase 2). No hay servidor
  que valide: la comprobación es local.
- La iglesia se crea en el mismo flujo (pantalla única o dos pasos): «Crea tu
  cuenta» → «Crea tu iglesia» → app. Sin iglesia no hay dónde guardar un
  creyente — el mismo bloqueo consciente de `welcome.tsx` en web.

## Interfaz

```
apps/mobile/app/(auth)/
├── index.tsx           — nueva: bienvenida; primera vez → registro; si hay cuenta → login
├── register.tsx        — pasa a crear el usuario LOCAL (sin Better Auth)
├── church-setup.tsx    — nueva: crear la iglesia local (equivalente móvil de ChurchForm)
└── login.tsx           — entra con la contraseña de la cuenta local
```

## Repositorios, no clientes

La app ya llama a la API a través de hooks de `api-client`. Para poder vivir
en los dos modos, las pantallas consumen **repositorios** (`src/data/repos/`)
que en modo local leen de SQLite; al conectar (Fase 3) la misma interfaz se
implementa contra la API. Es la frontera del proyecto: ninguna pantalla
importa `api-client` directamente.

## Criterios de la Fase 1

- [ ] Primera instalación → bienvenida → crear cuenta → crear iglesia → app,
      sin red y sin servidor. _(pendiente de probar en dispositivo/emulador)_
- [x] Los datos creados se conservan al cerrar y reabrir la app (los
      repositorios se prueban contra SQLite real, en memoria).
- [x] Entrar con la contraseña de la cuenta local funciona; con otra, no.
- [x] El test de paridad de esquema compara las entidades replicadas con las
      de TypeORM y falla si se descuelgan
      (`apps/api/src/database/local-schema.parity.test.ts`).
- [x] Los seis idiomas en todo el flujo nuevo.

---

# Fase 2 — Inicio rápido: PIN y huella

Patrón de Taskia (`credential-store.ts`, `biometric.ts`, `security-setup`,
`pin-modal`, `pin-entry`), aplicado al modo local y reutilizado en el
conectado.

## Modelo

- El PIN y la huella **no sustituyen a la contraseña**: son el desbloqueo
  rápido de la sesión ya abierta. Si el bloqueo fuerte falla (contraseña
  olvidada, sesión expirada en modo conectado), se cae al login con
  contraseña — sin pantallas de error raras.
- **PIN hasheado**: `SHA-256("navis-pin-v1:<pepper>:<userId>:<pin>")` con
  `expo-crypto`; `pepper` de 32 bytes generado una vez por dispositivo y
  guardado en SecureStore; el identificador de usuario hace de sal. Nunca en
  claro.
- **Biometría**: `expo-local-authentication`; se ofrece solo si
  `hasHardwareAsync() && isEnrolledAsync()`. El SO guarda las huellas, la app
  no guarda nada biométrico.

## Interfaz

```
apps/mobile/src/lib/auth/
├── pin-store.ts        — hash/verify/clear (SecureStore + expo-crypto)
├── biometric.ts        — disponibilidad y prompt nativo
└── quick-login.ts      — qué método ofrece cada cuenta
apps/mobile/app/(auth)/
├── security-setup.tsx  — tras el primer login: huella, crear PIN (dos veces) o saltar
└── login.tsx           — botón de huella y modal de PIN, como Taskia
```

- La configuración se ofrece **una vez** tras el primer login, solo si el
  hardware la soporta y la cuenta no la tiene ya. Desde ajustes se desactiva
  o cambia el PIN.
- Cinco intentos de PIN fallidos → se olvida el acceso rápido y se pide
  contraseña.

## Criterios de la Fase 2

- [ ] Tras el primer login aparece la configuración solo si el dispositivo la
      soporta; «saltar» deja la cuenta sin inicio rápido.
- [ ] Con huella activada, la app abre con huella sin escribir nada.
- [ ] PIN erróneo muestra el error; al quinto fallo se pide la contraseña.
- [ ] Un dispositivo sin lector o sin huellas no muestra la opción.
- [ ] Desde ajustes se desactiva y se cambia el PIN.
- [ ] Los seis idiomas.

---

# Fase 3 — Conectar al servidor

## Flujo

1. Desde ajustes → «Conexión» → «Conectar a un servidor»: se pide la **URL**
   (p. ej. `https://navis.miiglesia.es`), se valida con zod y se comprueba de
   verdad con `GET {url}/health` — si no responde, no se guarda nada.
2. Se autentica la cuenta contra ese servidor: si el email local ya existe
   allí, login; si no, registro con la misma contraseña.
3. **Migración local → servidor**, en orden de dependencias:
    1. Crear la iglesia en el servidor con los datos de la local (si el usuario
       ya tiene una, se elige: usar esa o crear otra).
    2. Subir creyentes, notas, etiquetas, listas y demás módulos locales,
       atribuidos a la iglesia y al usuario del servidor.
    3. Al terminar, la base local se **conserva** como copia de respaldo (no
       se borra): si la migración se corta a medias, nada se ha perdido y se
       puede reintentar.
4. La app pasa a modo conectado: los repositorios leen de la API y el
   `api-client` apunta a la URL guardada (SecureStore).

## Contraseña para migrar

Para registrar en el servidor una cuenta que solo existía en local hace falta
la contraseña: se pide **en el paso 2** (el usuario la escribe él mismo al
autenticarse/registrarse) y no se almacena — se usa en memoria para el
registro y se descarta.

## Consideraciones

- La migración es **idempotente por intento**: se marca en la base local qué
  lote se subió (`migracion_estado`), y un fallo a medias permite reintentar
  desde el punto cortado, no desde cero (evita duplicados).
- Si en el servidor ya existen los mismos datos (creyentes con el mismo
  email), la migración avisa y **no los pisa**: se importan los que no
  chocan y el resto se lista para resolver a mano.
- Sin red a medias: la migración se aborta y todo queda como estaba (local),
  con el intento marcado para reintentar.

## i18n

Sección `connection`, seis idiomas: `title`, `subtitle`, `urlLabel`,
`urlPlaceholder`, `testing`, `connected`, `connectionFailed`, `connect`,
`connectTitle`, `connectDetail`, `accountExists`, `migrating`,
`migrationDone`, `migrationPartial`, `conflictsFound`.

## Criterios de la Fase 3

- [ ] Una URL que no responde `/health` no se guarda y muestra el motivo.
- [ ] Conectar sube la iglesia y todos los datos locales al servidor, y en la
      web se ven.
- [ ] Cortar la red a medias deja todo en local y permite reintentar sin
      duplicar.
- [ ] Los datos que ya existían en el servidor no se sobreescriben.
- [ ] Desconectar y reconectar funciona (ver Fase 4) sin duplicar nada.
- [ ] Los seis idiomas.

---

# Fase 4 — Desconectar del servidor

## Flujo

1. Desde ajustes → «Conexión» → «Desconectar», con confirmación y explicación
   clara de qué va a pasar: **los datos del servidor se bajan al teléfono** y
   la app seguirá funcionando en local con ellos.
2. **Migración servidor → local**, en orden inverso al de la Fase 3: se
   descargan la iglesia activa y los datos que el usuario puede ver (mismos
   permisos que en pantalla), se escriben en la base local — los que ya
   existen de la época local se actualizan, no se duplican (los
   identificadores del servidor pasan a ser los locales).
3. Se borra la conexión guardada (URL y sesión de Better Auth del
   SecureStore). La cuenta local vuelve a ser la de entrada, con su
   contraseña, PIN y huella intactos.
4. La app queda en modo local. Nada se pierde: la copia en el teléfono tiene
   todo lo descargado.

## Consideraciones

- **Quien comparte servidor no se lleva lo ajeno**: se descarga lo que el
  usuario puede ver (su iglesia y sus permisos); un miembro sin permiso de
  iglesia no descarga los creyentes de otros.
- **El servidor no se toca**: desconectar no borra nada allí — otro miembro
  del equipo sigue viendo todo. Es una salida, no una baja (la baja de dueño
  es el RFC 0015).
- Sin red al desconectar: no se puede descargar; la acción se rechaza con un
  mensaje claro y nada cambia.

## i18n

`disconnect`, `disconnectTitle`, `disconnectDetail`, `disconnectConfirm`,
`downloading`, `downloadDone`, `downloadNeedsNetwork`.

## Criterios de la Fase 4

- [ ] Desconectar baja la iglesia y los datos visibles al teléfono y la app
      sigue funcionando en local con ellos.
- [ ] Reconectar después no duplica creyentes ni notas.
- [ ] En el servidor no falta nada tras desconectar.
- [ ] Sin red, desconectar no cambia nada y lo explica.
- [ ] Los seis idiomas.

---

# Fase 5 — Recuperar contraseña (solo modo conectado)

En modo local no hay correo: la contraseña local se recupera **con la
migración de vuelta** (conectarse al servidor con la cuenta de allí y
desconectar restaure la cuenta local) o borrando los datos de la app. Se
documenta; no se construye un flujo de recuperación sin servidor.

En modo conectado, la vía es la del RFC 0023 ya implementada en web, con la
pantalla nativa de petición:

```
apps/mobile/app/(auth)/
├── login.tsx               — enlace a /(auth)/forgot-password junto al campo de contraseña
└── forgot-password.tsx     — pide el email y muestra la confirmación
```

- Reutiliza `BrandHeader`, `TextField`, `Button` y la animación de
  `login.tsx`; valida con el `forgotPasswordSchema` de `@navis/shared` que ya
  existe.
- `redirectTo`: `` `${serverUrl}/reset-password` `` — la URL del servidor de la
  conexión (Fase 3), no una variable nueva de build.
- El enlace del correo abre el navegador contra la web `/reset-password`, que
  ya existe. El servidor responde igual exista o no la cuenta: sin ramas.
- **Sin claves i18n nuevas**: el RFC 0023 ya añadió las de este flujo en los
  seis idiomas.
- En modo local, el enlace no se muestra.

| Método | Ruta                               | Rol mínimo | Descripción                          |
| ------ | ---------------------------------- | ---------- | ------------------------------------ |
| POST   | `/api/auth/request-password-reset` | público    | Responde igual exista o no la cuenta |

## Criterios de la Fase 5

- [ ] En modo conectado, pedir el enlace con un email inexistente responde
      igual que con uno real, y el correo abre el reset de la web.
- [ ] Fijar la contraseña nueva permite entrar en la app (y cierra las demás
      sesiones — `revokeSessionsOnPasswordReset` ya activo).
- [ ] En modo local no aparece el enlace.
- [ ] Tests unitarios de la pantalla y del enlace en el login.

---

## Plan de implementación (orden)

1. **Fase 1** — base local + primera vez: es el cimiento; las demás fases
   presuponen los repositorios y la cuenta local.
2. **Fase 2** — PIN y huella: corta y sobre el login ya estable.
3. **Fase 3** — conectar (local → servidor).
4. **Fase 4** — desconectar (servidor → local): reutiliza los repositorios de
   la Fase 1 en sentido inverso.
5. **Fase 5** — recuperar contraseña: solo depende de estar conectado.

Cada fase termina en `main` con:

```bash
pnpm --filter @navis/shared build
pnpm --filter @navis/mobile typecheck && pnpm --filter @navis/mobile test
pnpm check
```

La Fase 2 se prueba en **dispositivo real** (el emulador no tiene lectores de
huella fiables); las fases 3 y 4, contra un servidor real con datos de
prueba, cortando la red a propósito.

## Paridad de datos

- **Entre SQLite local del teléfono y la base de la API**: test de paridad que
  compara `schema.ts` del móvil con los metadatos de las entidades TypeORM
  (Fase 1). Un solo origen de verdad por entidad: la clase de la API.
- **Entre SQLite y Postgres en la API**: como ya está — migraciones escritas
  con la API `Table` de TypeORM y probadas en los dos motores.
- Los tipos de columna van por el mismo camino: los `TIMESTAMP` vienen de
  `apps/api/src/database/column-types.ts` y su equivalente SQLite (`TEXT` ISO)
  se documenta en `schema.ts` junto a cada tabla.
