# RFC 0008: Iglesias como espacios de trabajo, y permisos por vista

- **Estado**: Implementado en web (fases 1 a 5). Pendiente: la parte de móvil
- **Fecha**: 2026-08-03
- **Apps afectadas**: api / web / mobile / desktop
- **Depende de**: —
- **Condiciona a**: 0001 (panel), 0002 (calendario), 0003 (creyentes), 0006
  (comunicaciones): todas ellas nacen ya con `church_id`.

## Problema

Hoy Navis es de una sola congregación: `profiles.church` es un texto suelto y
todo lo que se guarde a partir de ahora sería de todos. Un pastor que atiende
dos iglesias, o una obra con varias sedes, no tiene forma de separar sus
creyentes, su calendario y sus comunicaciones. Y no es solo comodidad: mezclar
las notas pastorales de dos congregaciones es un problema de privacidad, no de
organización.

Al mismo tiempo, el acceso se decide hoy por **nivel** (`member` < `leader` <
`pastor` < `admin`). Una escala funciona mientras los papeles se ordenen en
línea recta, y en una iglesia no lo hacen: quien lleva el **sonido** no está
«por encima» ni «por debajo» de quien atiende **recepción**; simplemente ven
cosas distintas.

## Alcance

**Entra:**

- La **iglesia** como espacio de trabajo (tenant): se crea, se cambia de una a
  otra y todo lo pastoral cuelga de ella.
- Alcance por iglesia de **inicio, calendario, creyentes y comunicaciones**.
- **Permisos por vista** en el catálogo de roles, con una semilla de siete roles
  (superadministrador, pastor, recepción, biblias, sonido, púlpito, creyente).
- **Usuarios acotados**: el pastor administra las cuentas que él ha creado y las
  de sus iglesias; nunca las de otra.
- Selector de iglesia en la barra lateral (web y escritorio) y en móvil, alta de
  iglesia y pantalla de bienvenida cuando todavía no hay ninguna.

**No entra:**

- **Profecías y sueños** siguen siendo globales por ahora (RFC 0004 y 0005). Son
  personales, no de la congregación; cuando se implementen se decide si cuelgan
  de la persona o de la iglesia.
- **Roles distintos por iglesia**: una cuenta tiene un rol y vale en todas las
  iglesias a las que pertenece. Ver §5.4 para la salida si algún día hace falta.
- Invitaciones por correo, traspaso de propiedad de una iglesia y borrado con
  exportación de datos.
- Facturación o límite de iglesias por plan: aquí **no hay planes**; el pastor
  crea las que necesite.

> ⚠️ **Iglesia ≠ creyente.** `Church` es el espacio de trabajo; `Believer`
> (RFC 0003) es una persona de esa iglesia. Comparten campos —nombre,
> dirección— y no son lo mismo.

## Referencia: cómo lo resuelve Cuentify

Cuentify (el otro proyecto de la casa) hizo esto mismo con empresas, y de ahí se
copia lo que funcionó y se descarta lo que no aplica:

| De Cuentify                                                         | Aquí                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| `Company` = tenant, `companyId` en cada tabla de negocio            | Igual, con `Church` y `church_id`                      |
| `User.activeCompanyId`: la empresa activa vive en la base           | Igual: `user.active_church_id` (§5.2)                  |
| Onboarding bloqueante: sin empresa no se entra al panel             | Igual, pero solo para quien puede crearlas (§7.2)      |
| Selector arriba a la izquierda, con «Añadir»                        | En la barra lateral, bajo el logo, plegable (§8)       |
| `CompanyMember` solo para miembros restringidos (sin filas = todas) | **Descartado**: la pertenencia es explícita (§5.3)     |
| Límite de empresas por plan y página de upgrade                     | **Descartado**: no hay planes                          |
| Rol global ligado al plan                                           | Rol global, pero con **permisos** en vez de nivel (§6) |

La regla «sin filas ⇒ acceso a todas» de Cuentify es cómoda en una gestoría,
donde el dueño se fía de su equipo. En una iglesia el defecto tiene que ser el
contrario: **si no te han añadido, no entras**. Un fallo de esa regla no expone
una factura, expone una conversación pastoral.

## Decisiones tomadas

- **D1 — Qué se acota**: inicio, calendario, creyentes y comunicaciones. Roles,
  usuarios, ajustes, profecías y sueños siguen siendo globales.
- **D2 — Iglesia activa en la base de datos** (`user.active_church_id`), no en el
  cliente: web, escritorio y móvil comparten contexto y el servidor nunca se fía
  de una cabecera para decidir qué datos devuelve.
- **D3 — Pertenencia explícita**: `church_members`. Sin fila, no hay acceso.
- **D4 — Permisos por vista** en `roles.permissions`, sustituyendo al nivel como
  criterio de acceso. `level` se queda, pero solo para ordenar quién puede
  administrar a quién.
- **D5 — Rol global, alcance por pertenencia**: el rol dice **qué módulos** ve
  una cuenta; la pertenencia dice **de qué iglesias** son los datos.
- **D6 — Usuarios acotados por autoría**: `user.created_by_id`. El pastor ve las
  cuentas que ha creado y las de las iglesias en las que está; el
  superadministrador, todas.
- **D7 — Sin límite de iglesias**: cualquiera con `churches.manage` crea las que
  necesite.

### Preguntas abiertas

- **P1** — ¿El creyente acaba entrando a la aplicación (para ver sus profecías y
  sueños) o se queda fuera del panel del todo? De momento, fuera.
- **P2** — El rol `leader` actual: ¿se convierte en `recepcion` o se conserva
  como rol propio de la instalación? La migración propone lo primero (§9).
- **P3** — ¿Una cuenta puede pertenecer a varias iglesias con papeles distintos?
  Hoy no (D5). Ver §5.4.

## Modelo de datos

### 5.1 Entidades nuevas (TypeORM)

```
Church                                — el espacio de trabajo
├── id: uuid
├── name: text                        — «Iglesia Central»
├── slug: text (único)                — derivado del nombre, para rutas y logs
├── city / country: text | null
├── address: text | null
├── timezone: text                    — por defecto, la del perfil de quien la crea
├── logoUrl: text | null
├── ownerId → user(id)                — quien la creó; nunca se queda sin dueño
└── ← ChurchMember[]

ChurchMember                          — quién pertenece a qué iglesia
├── id: uuid
├── churchId → churches(id)  (cascade)
├── userId → user(id)        (cascade)
├── joinedAt: timestamptz
└── único (churchId, userId)
```

Las dos heredan de `BaseEntity` (id, `created_at`, `updated_at`, `deleted_at`) y
se **añaden a mano** a la lista de entidades del `DataSource`: aquí no hay globs
(ver `CLAUDE.md`).

### 5.2 Columnas nuevas en tablas existentes

| Tabla   | Columna            | Por qué                                               |
| ------- | ------------------ | ----------------------------------------------------- |
| `user`  | `active_church_id` | La iglesia en la que está trabajando ahora mismo (D2) |
| `user`  | `created_by_id`    | Quién dio de alta la cuenta; acota el listado (D6)    |
| `roles` | `permissions`      | Texto con un JSON de permisos (§6)                    |

Las dos de `user` son **campos extra de Better Auth**
(`user.additionalFields`, con `input: false` como ya hacen `role` y `locale`):
así viajan dentro de la sesión y el cliente sabe en qué iglesia está sin pedir
nada más. La columna la crea la migración de TypeORM, igual que se hizo con
`role`.

### 5.3 Cómo se resuelve el acceso

```
¿Qué iglesias veo?
├── superadministrador → todas
└── el resto          → las de sus filas en church_members

¿Cuál es la activa?
├── user.active_church_id, si sigue siendo accesible
└── si no, la primera accesible (y se corrige la columna)

¿Qué datos leo?
└── siempre WHERE church_id = <la activa>, puesto por el servidor
```

Quien crea una iglesia queda como `ownerId` **y** con su fila en
`church_members`: el dueño es un miembro más, con una marca. Así ninguna
consulta necesita dos caminos.

### 5.4 Lo que se reserva sin construir

- `believers.user_id` (nulable, único) — el enlace entre la ficha de un creyente
  y su cuenta, cuando exista el módulo (RFC 0003). Es lo que permitirá que el
  pastor vea «los usuarios de sus creyentes».
- `church_members.role_slug` (nulable) — el día que haga falta un papel distinto
  por iglesia, esa columna lo resuelve sin tocar nada más: nula significa «el rol
  global de la cuenta». **No se crea ahora** (Regla 1: nada de abstraer por si
  acaso); queda escrito aquí para que la salida sea conocida.

## Permisos

### 6.1 El catálogo

Vive en `packages/shared/src/permissions.ts`, que es lo que comparten API, web y
móvil. Formato `modulo.accion`, en minúsculas:

```ts
dashboard.view
calendar.view      calendar.manage
believers.view     believers.manage
communications.view communications.manage
prophecies.view    prophecies.manage
dreams.view        dreams.manage
users.view         users.manage
roles.manage
churches.view      churches.manage
```

`view` es entrar y leer; `manage` es crear, editar y borrar. El comodín `*` lo
lleva únicamente el superadministrador, y se comprueba en un solo sitio
(`hasPermission`), no repartido por la aplicación.

Los ajustes de la propia cuenta (perfil, tema, idioma) **no llevan permiso**:
quien tiene sesión puede tocar lo suyo.

### 6.2 Permiso y alcance son cosas distintas

- **Permiso** responde a _¿puedo abrir este módulo?_ → lo dice el rol.
- **Alcance** responde a _¿qué filas veo dentro?_ → lo dice la pertenencia.

Un pastor con `users.manage` no administra a todo el mundo: administra a los
suyos. Esa segunda mitad **no se resuelve con permisos**, se resuelve en la
consulta (§7.3). Confundirlas es la forma habitual de abrir un agujero.

### 6.3 Los siete roles de la semilla

| Permiso                 | Superadmin | Pastor     | Recepción    | Biblias | Sonido | Púlpito | Creyente |
| ----------------------- | ---------- | ---------- | ------------ | ------- | ------ | ------- | -------- |
| `dashboard.view`        | ✅         | ✅         | ✅           | ✅      | ✅     | ✅      | —        |
| `calendar.view`         | ✅         | ✅         | ✅           | ✅      | ✅     | ✅      | —        |
| `calendar.manage`       | ✅         | ✅         | ✅           | —       | —      | —       | —        |
| `believers.view`        | ✅         | ✅         | ✅           | ✅      | —      | —       | —        |
| `believers.manage`      | ✅         | ✅         | ✅           | —       | —      | —       | —        |
| `communications.view`   | ✅         | ✅         | ✅           | ✅      | ✅     | ✅      | —        |
| `communications.manage` | ✅         | ✅         | —            | —       | —      | ✅      | —        |
| `prophecies.*`          | ✅         | ✅         | —            | —       | —      | —       | —        |
| `dreams.*`              | ✅         | ✅         | —            | —       | —      | —       | —        |
| `users.view` / `manage` | ✅ (todas) | ✅ (suyas) | —            | —       | —      | —       | —        |
| `roles.manage`          | ✅         | —          | —            | —       | —      | —       | —        |
| `churches.view`         | ✅ (todas) | ✅ (suyas) | ✅ (la suya) | ✅      | ✅     | ✅      | —        |
| `churches.manage`       | ✅         | ✅         | —            | —       | —      | —       | —        |
| `level` (jerarquía)     | 3          | 2          | 1            | 1       | 1      | 1       | 0        |

Lecturas de la tabla que conviene no perder:

- **El superadministrador lo ve todo**, y es el único que toca el catálogo de
  roles: repartir permisos es la llave del resto de llaves.
- **El pastor lo ve todo dentro de lo suyo**, usuarios incluidos, pero no cambia
  qué significa cada rol ni entra en otra iglesia.
- **Púlpito** publica avisos porque es quien habla desde el frente; **recepción**
  lleva las personas y la agenda; **biblias** y **sonido** consultan para
  prepararse, y no editan.
- **El creyente no entra al panel.** Su cuenta existe para estar enlazada a su
  ficha (§5.4) y, más adelante, para lo suyo (P1).

Es una **semilla**, no una ley: el superadministrador puede reajustar los
permisos de cualquier rol desde la administración de accesos, y los cuatro roles
de ministerio (recepción, biblias, sonido, púlpito) son los que más se van a
mover de una iglesia a otra.

### 6.4 Cómo se comprueba

- **API**: `@RequirePermissions('believers.manage')` + `PermissionsGuard`, que
  sustituye a `RolesGuard` (hoy compara niveles). El guard lee el rol de
  `request.user`, busca sus permisos en la tabla `roles` y compara. Un rol que no
  esté en el catálogo no tiene permisos y no pasa —igual que hoy con el nivel—.
- **Web y móvil**: `usePermissions()` sobre la sesión, y `navItemsFor` pasa de
  filtrar por `minRole` a filtrar por permiso. La interfaz **no es la seguridad**:
  esconder una entrada del menú es cortesía, la puerta la cierra el guard.

## API

Rutas nuevas, todas bajo `/api/v1`:

| Método | Ruta                            | Permiso           | Descripción                                    |
| ------ | ------------------------------- | ----------------- | ---------------------------------------------- |
| GET    | `/churches`                     | `churches.view`   | Las iglesias accesibles, con la activa marcada |
| POST   | `/churches`                     | `churches.manage` | Crea una y la deja activa                      |
| GET    | `/churches/:id`                 | `churches.view`   | Ficha, si se pertenece                         |
| PATCH  | `/churches/:id`                 | `churches.manage` | Edita nombre, ciudad, dirección, zona horaria  |
| DELETE | `/churches/:id`                 | `churches.manage` | Borrado lógico; falla si es la última          |
| PUT    | `/churches/active`              | —                 | Cambia la iglesia activa (valida pertenencia)  |
| GET    | `/churches/:id/members`         | `users.view`      | Quién pertenece                                |
| POST   | `/churches/:id/members`         | `users.manage`    | Añade una cuenta existente                     |
| DELETE | `/churches/:id/members/:userId` | `users.manage`    | La saca (nunca al dueño)                       |

Y los cambios en lo que ya existe:

- `GET /users` deja de exigir `@Roles('admin')` y pasa a `users.view`, con el
  listado **acotado** (§7.3).
- `POST /users` guarda `created_by_id` y, si se indica `churchId`, crea la
  pertenencia en la misma transacción.
- `GET /roles`, `POST /roles`, `PATCH /roles/:id` pasan a `roles.manage` y
  aceptan/devuelven `permissions`.
- Todo endpoint de módulo acotado recibe la iglesia **del servidor**, nunca del
  cliente: un `@CurrentChurch()` que resuelve la activa y ya ha validado la
  pertenencia.

### 7.1 Errores

- `403` si el permiso falta, con el mensaje de siempre.
- `403` si se pide un recurso de una iglesia a la que no se pertenece —**no
  `404`**: el 404 se guarda para lo que de verdad no existe, y aquí conviene que
  el registro diga que alguien llamó a una puerta ajena.
- `409` al crear una iglesia con un `slug` que ya existe.

### 7.2 Sin iglesia todavía

Quien puede crear iglesias y no tiene ninguna, va a la pantalla de bienvenida
(§8.2). Quien **no** puede crearlas y no pertenece a ninguna ve un estado
«todavía no te han añadido a ninguna iglesia», con el contacto de quien le dio
de alta. Mandarle a un formulario que no puede rellenar es peor que no decirle
nada.

### 7.3 El listado de usuarios acotado

```sql
-- superadministrador: sin filtro
-- pastor:
WHERE u.created_by_id = :yo
   OR u.id IN (SELECT user_id FROM church_members WHERE church_id IN (:mis_iglesias))
```

La consulta vive en `UserAdminService`, que ya arma su SQL a mano por la tabla
de Better Auth. El mismo filtro se aplica **antes de editar, cambiar el rol o
borrar**: un listado acotado con un `PATCH` abierto no acota nada.

## Interfaz

### 8.1 Dirección de diseño

La aplicación se llama Navis y su símbolo es una nave (Regla 7). La iglesia
activa es, siguiendo esa idea, **el puerto en el que se está atracado**, y eso da
el elemento firma de la pantalla: bajo el logo de la barra lateral, una **placa**
con la inicial de la iglesia sobre `bg-brand` y el nombre al lado. Es lo único
de la barra que cambia al cambiar de espacio, y por eso se ve.

- **Desplegada**: logo centrado, y debajo la placa a ancho completo con la
  inicial, el nombre y el chevron.
- **Plegada**: solo la insignia cuadrada, centrada bajo el logo; el menú se abre
  a la derecha, como los rótulos de la navegación plegada.
- El menú lista las iglesias accesibles con una marca en la activa, y cierra con
  «Añadir iglesia» —que solo aparece con `churches.manage`—.
- Con **una sola iglesia** y sin permiso para crear más, la placa no es un botón:
  es una etiqueta. Un desplegable con una opción es ruido.

Nada de degradados de relleno ni de tarjeta centrada genérica (Regla 9): la
personalidad la pone la placa y la composición de la barra, y el resto acompaña
en voz baja con los tokens de siempre.

### 8.2 Web (`apps/web`)

| Ruta         | Qué es                                                                     |
| ------------ | -------------------------------------------------------------------------- |
| `/welcome`   | Alta de la primera iglesia, a pantalla completa, con la estética de acceso |
| `/churches`  | Listado y edición de las iglesias propias                                  |
| `/no-access` | «Todavía no te han añadido a ninguna iglesia»                              |

Componentes nuevos: `church-switcher.tsx` (la placa y su menú),
`create-church-dialog.tsx` y `church-form.tsx`. El guard de ruta pasa de
`ProtectedRoute` a `ProtectedRoute` + `RequirePermission`, que ya sabe redirigir
a `/no-access`.

La barra lateral plegable ya está: el selector se engancha ahí y hereda el estado
`collapsed` (`useSidebarStore`), no inventa el suyo.

### 8.3 Móvil (`apps/mobile`)

El selector va en la cabecera de la pantalla de inicio y en «Más», no en las
pestañas: cambiar de iglesia es una acción de contexto, no un destino. La alta de
iglesia y la pantalla de bienvenida se replican como pantallas de expo-router.
La lógica —hooks, tipos, claves de traducción— se comparte; el JSX se escribe dos
veces, como manda la Regla 1.

### 8.4 Textos (los seis idiomas)

Sección nueva `church.*`:

```
church.title  church.switch  church.current  church.add  church.name
church.city  church.address  church.timezone  church.created  church.deleted
church.members  church.addMember  church.removeMember  church.lastOne
church.welcomeTitle  church.welcomeSubtitle  church.noAccessTitle
church.noAccessBody
```

Y `roles.*` gana los nombres y las pistas de los siete roles de serie
(`roles.superadmin`, `roles.recepcion`, `roles.biblias`, `roles.sonido`,
`roles.pulpito`, `roles.creyente` y sus `…Hint`), más `permissions.*` con el
nombre de cada permiso para la pantalla de roles. Los nombres de los roles **de
serie** se traducen; los que cree cada instalación guardan su nombre en la base
de datos, como ya ocurre hoy.

## Migraciones y datos que ya existen

Tres migraciones, y en este orden:

1. **`CreateChurches`** — tablas `churches` y `church_members`, más
   `active_church_id` y `created_by_id` en `user`.
2. **`AddRolePermissions`** — columna `permissions` en `roles`, y siembra los
   permisos de los roles de serie.
3. **`RenameSystemRoles`** — renombra los slugs y actualiza `user.role`:

   | Antes    | Después      | Motivo                             |
   | -------- | ------------ | ---------------------------------- |
   | `admin`  | `superadmin` | Es el papel que describe la tabla  |
   | `pastor` | `pastor`     | Se queda igual                     |
   | `leader` | `recepcion`  | Mismo nivel y el papel más cercano |
   | `member` | `creyente`   | El nombre que se usa en la iglesia |

   Y añade los tres que faltan: `biblias`, `sonido`, `pulpito`.

**Traspaso de lo que ya hay** (una instalación en marcha):

- Se crea **una iglesia** con el `profiles.church` de la cuenta más antigua
  —o «Mi iglesia» si está vacío—, con esa cuenta como dueña.
- **Todas** las cuentas existentes entran como miembros de esa iglesia, y esa
  iglesia queda como su `active_church_id`.
- `profiles.church` se deja donde está y deja de usarse. Se borrará en una
  limpieza posterior, cuando ya no queden instalaciones con la versión vieja.

Las tres se prueban **en los dos motores** (`DB_DRIVER=sqlite` y `postgres`),
como pide la Regla 4.

## Fases

### Fase 1 — Permisos (sin tocar iglesias) · **implementada**

- [x] `packages/shared/src/permissions.ts`: catálogo, tipo `Permission`,
      `hasPermission(permissions, required)` con su test, y la semilla de los
      siete roles en `role-permissions.ts`.
- [x] Columna `permissions` (`AddRolePermissions`) y renombrado + siembra de los
      roles de serie (`SeedMinistryRoles`), idempotente y para los dos motores.
- [x] `PermissionsGuard` y `@RequirePermissions`, sustituyendo a `RolesGuard` en
      los controladores; test del guard (permitido, denegado, rol desconocido).
- [x] Web: `usePermissions`, `navItemsFor` por permiso, `RequirePermission` en
      las rutas y pantalla `/no-access` —adelantada de la Fase 4, porque desde
      que existe el rol creyente ya hay a quien explicárselo—.
- [x] Pantalla de roles: permisos con casillas por módulo (`PermissionPicker`).
- [ ] Móvil: sus pestañas son fijas y todavía no filtran por permiso.

Decisiones que aparecieron al implementarla:

- **`ai.use`** se suma al catálogo: el endpoint de IA exigía `@Roles('pastor')` y
  necesitaba su propio permiso, no un nivel.
- **`GET /roles/mine`** en vez de leer el catálogo entero: lo pide **todo el
  mundo** al arrancar, y el catálogo completo solo quien administra accesos.
- **Los permisos del superadministrador no se editan**, ni desde la API ni desde
  la pantalla: quitarle el comodín dejaría la instalación sin nadie que pudiera
  devolvérselo.
- **`level` sigue en la tabla** pero ya no decide accesos; queda para la
  jerarquía de administración y para el tope de los roles propios.

### Fase 2 — La iglesia como entidad · **implementada**

- [x] Entidades `Church` y `ChurchMember` (a mano en el `DataSource`) y
      migración `CreateChurches`, con el traspaso de la instalación existente:
      una iglesia sacada de `profiles.church` y todas las cuentas dentro.
- [x] `ChurchesService` con su test: quién llega a qué, resolución de la activa
      y alta que deja dentro a quien la crea.
- [x] Esquemas zod en `shared` y hooks en `api-client` (`queryKeys.churches`).

### Fase 3 — La iglesia activa · **implementada**

- [x] `profiles.active_church_id` y `PUT /churches/active`.
- [ ] `@CurrentChurch()` y el contrato de acotado: se añadirá con el primer
      módulo que lo necesite (creyentes), no antes de tener a quién servírselo.

**Cambio sobre D2**: la iglesia activa **no** va en la sesión de Better Auth. Su
caché en cookie dura cinco minutos, así que un cambio de iglesia tardaría ese
rato en notarse. Vive en `profiles` —tabla nuestra, con entidad— y viaja en la
respuesta de `GET /churches`, que se invalida al cambiar. Se evita así la trampa
que estaba apuntada en §12.

### Fase 4 — Interfaz · **implementada (web)**

- [x] Selector en la barra lateral, desplegada y plegada, con el alta de otra.
- [x] `/welcome` bloqueante —nombre y ciudad, nada más— y `/no-access`.
- [x] `ChurchGate`: sin iglesia no se entra al panel.
- [x] Los textos, en los seis idiomas.
- [ ] `/churches` (edición de la ficha) y la parte de móvil.

### Fase 5 — Usuarios acotados · **implementada**

- [x] El listado de cuentas va acotado por las iglesias de quien pregunta, y el
      mismo alcance se aplica **antes** de editar, cambiar el rol, poner
      contraseña o borrar (`UserAdminService.target`).
- [x] Una cuenta creada desde la administración entra en la iglesia activa de
      quien la crea: sin eso, dejaría de verla al instante.
- [x] Filtro por iglesias en el listado —**varias a la vez o una sola**, con
      casillas—, **guardado entre visitas** (`navis.usersFilter`): quien
      administra varias trabaja días sobre las mismas. Viaja como
      `churchIds=a,b` y solo puede **acotar** el alcance, nunca ampliarlo.
- [ ] Añadir y quitar miembros de una iglesia desde su ficha.

**Cambio sobre D6**: el alcance no necesita `user.created_by_id`. Se resuelve con
la **pertenencia** (`church_members`), que es más fuerte —cubre también a quien
llegó por otra vía— y no añade una columna a la tabla de Better Auth. El
`churchId` de la query solo puede acotar el alcance, nunca ampliarlo.

## Animación e interacción

- El menú del selector entra con opacidad y un desplazamiento corto, el mismo
  gesto que el resto de la aplicación; nada de rebotes.
- Al cambiar de iglesia: la placa hace un fundido corto, las consultas de
  TanStack Query se invalidan por completo y un aviso confirma en cuál se está.
  Sin el aviso, un cambio con la lista vacía parece que no ha hecho nada.
- Solo se anima `opacity` y `transform`, y `prefers-reduced-motion` lo apaga todo
  desde `global.css` (Regla 9).

## Pruebas

- **Unitarias**: `hasPermission` (comodín, vacío, permiso ausente),
  `PermissionsGuard`, resolución de la iglesia activa cuando la guardada ya no es
  accesible, y el filtro del listado de usuarios.
- **e2e de la API** (contra Postgres, como siempre): dos iglesias y dos cuentas;
  la de la iglesia A no lee nada de la B (403); el pastor no ve en `/users` a
  quien no ha creado; el creyente recibe 403 en todo el panel; no se puede borrar
  la última iglesia.
- **e2e de web** (Playwright, Chromium y Pixel 7): alta de la primera iglesia,
  cambio entre dos, la barra plegada enseñando solo la insignia, y el menú de
  navegación distinto según el rol.
- **Migraciones**: en SQLite y en Postgres, con datos previos, comprobando el
  traspaso.
- Y lo de siempre: `pnpm check`, en los dos temas, a 375 px y con el alemán.

## Riesgos y trampas

- **La caché de sesión en cookie de Better Auth dura 5 minutos.** Si la iglesia
  activa se escribe con SQL directo, la sesión seguirá diciendo la anterior hasta
  que caduque. El cambio tiene que ir por la API de Better Auth
  (`auth.api.updateUser`) para que refresque la cookie; hay que probarlo
  explícitamente.
- **Acotar por defecto, no por descuido.** Toda consulta de un módulo acotado
  nace con `church_id`. Conviene un test que recorra los repositorios y falle si
  alguno consulta una tabla acotada sin filtro.
- **El renombrado de roles toca `user.role`**, que es de Better Auth: si la
  migración se queda a medias, hay cuentas con un rol que ya no existe y el guard
  las deja fuera —que es el fallo seguro, pero hay que verlo venir—.
- **La última iglesia no se borra**, y el dueño no se sale de la suya: dejar a
  alguien sin espacio de trabajo es dejarle sin aplicación.
- **`profiles.church` deja de significar nada** y hay interfaz que lo enseña:
  revisar los ajustes de perfil en el mismo cambio.
- **Regla 6**: `app-sidebar.tsx` ya está cerca del límite. El selector es un
  componente aparte desde el minuto uno, no una sección más de la barra.

## Alternativas descartadas

- **Una base de datos por iglesia.** Aísla de verdad, pero multiplica las
  migraciones y las copias de seguridad por el número de congregaciones. Con
  `church_id` y guards bien puestos el aislamiento es suficiente para lo que esto
  es.
- **La iglesia en la URL** (`/c/:slug/creyentes`). Se comparte mejor por enlace,
  pero obliga a reescribir toda la tabla de rutas de web y móvil, y a validar el
  slug en cada carga. Se puede añadir después sin deshacer nada de esto.
- **Mantener el nivel y meter los ministerios en la escala.** Es lo barato hoy y
  lo caro dentro de dos meses: sonido y recepción no se ordenan, y forzarlos a
  una escala acaba dando permisos que nadie pidió.
- **La regla de Cuentify «sin filas, acceso a todas»**: cómodo, pero el defecto
  inseguro. Ver §4.

## Criterios de aceptación

- [ ] Un pastor crea dos iglesias, cambia entre ellas y los datos de cada una no
      se ven desde la otra.
- [ ] Los siete roles se crean con la semilla y sus permisos coinciden con §6.3.
- [ ] El superadministrador cambia los permisos de un rol y el efecto se nota sin
      volver a desplegar.
- [ ] El pastor no ve en `/users` cuentas de otra iglesia ni creadas por otro.
- [ ] Una cuenta con rol creyente no entra a ninguna vista del panel, ni por la
      interfaz ni llamando a la API.
- [ ] Quien no pertenece a ninguna iglesia ve una explicación, no un formulario
      que no puede usar.
- [ ] El selector funciona con la barra desplegada y plegada, en los dos temas, a
      375 px y en los seis idiomas.
- [ ] `pnpm check` y `pnpm test:e2e` en verde, y las migraciones probadas en
      SQLite y Postgres.
