# RFC 0014: Tope de roles, onboarding independiente del pastor y alcance del superadministrador

- **Estado**: Implementado
- **Autor**: Cristian Alejandro Arroyave (con Claude)
- **Fecha**: 2026-08-07
- **Apps afectadas**: api / web
- **Depende de**: RFC 0008 (iglesias como espacios de trabajo, permisos por vista)
- **Condiciona a**: —

## Problema

RFC 0008 puso los cimientos —iglesia como espacio de trabajo, pertenencia
explícita, permisos por vista, usuarios acotados por iglesia— pero dejó tres
huecos que hoy hacen que un pastor vea y toque más de lo que debería, y que el
superadministrador no pueda acotarse aunque quiera:

1. **Cualquiera con `users.manage` puede asignar cualquier rol.** Un pastor
   creando o editando una cuenta puede darle el rol `pastor` o `superadmin`:
   `UserAdminService.create`/`update` solo comprueban que el rol **exista**
   (`RolesService.ensureExists`), nunca quién lo pide.
2. **Una cuenta nueva siempre entra en la iglesia de quien la crea.**
   `UserAdminService.create` llama a `ChurchesService.addToActive` sin mirar el
   rol. Eso es lo correcto para un miembro de equipo (recepción, sonido…), pero
   no para un pastor: un pastor nuevo tiene que empezar sin iglesia y crear la
   suya, no heredar la de quien lo dio de alta.
3. **El superadministrador no puede acotarse.** `ChurchesService.accessible`
   devuelve **todas** las iglesias de la instalación para
   `SUPERADMIN_ROLE`, sin excepción. No hay forma de decir «hoy quiero ver solo
   lo mío» sin dejar de ser superadministrador.

Los tres comparten una idea: **el rol dice qué se puede hacer, y hoy se está
usando además para decidir qué se ve por defecto sin que nadie lo haya
pedido.** Esta RFC separa esas dos cosas donde hacía falta.

## Alcance

**Entra:**

- Un tope de rol al crear o editar una cuenta: nadie —salvo el
  superadministrador— puede asignar un rol de su mismo nivel o superior.
- Que una cuenta nueva con rol `pastor` (o `superadmin`) no entre en la iglesia
  de quien la crea: nace sin iglesia y pasa por `/welcome` para crear la suya,
  exactamente igual que ya le pasa a un pastor sin cuenta previa.
- Una preferencia de alcance para el superadministrador, en ajustes: por
  defecto ve solo sus propias iglesias y las cuentas de sus miembros —como
  cualquier pastor—, con la opción de ver todas las iglesias y todas las
  cuentas de la instalación.
- Confirmar que las listas compartidas (RFC 0010) ya quedan fuera del alcance
  de quien no pertenece a la iglesia (lo están: `List.churchId` +
  `ActiveChurchGuard`), y dejarlo cubierto con un test explícito.

**No entra:**

- Roles distintos por iglesia (sigue siendo D5 de RFC 0008: un rol, válido en
  todas las iglesias de la cuenta).
- Traspasar la propiedad de una iglesia o transferir cuentas entre iglesias.
- Móvil: como en RFC 0008, el tope de roles y el selector de alcance quedan
  pendientes ahí; esta RFC los deja resueltos en API y web.
- Auditoría o registro de quién cambió su propio alcance: la preferencia es
  personal y no deja rastro, igual que el tema o el idioma.

## Referencia: el patrón fuera de aquí

Dos cosas que ya usan quienes resuelven esto a diario, y de donde sale la
forma que toma esta RFC:

- **Tope de rol al asignar, no lista cerrada de «roles permitidos».** Es el
  problema que describe [WorkOS al diseñar RBAC multi-tenant][workos]: un
  admin delegado no debe poder fabricarse (o fabricarle a otro) un rol igual o
  por encima del suyo. La solución que se repite es comparar **niveles**, no
  mantener una tabla de «quién puede dar qué rol»: con niveles, un rol nuevo
  que se cree mañana ya tiene su tope sin tocar código. Es justo lo que ya
  tiene esta base de datos en `roles.level` (RFC 0008 §6.3), solo que hoy nadie
  lo compara al crear una cuenta.
- **El alcance restringido por defecto, con un interruptor explícito para
  ampliarlo**, es el mismo patrón que usa Azure para el rol de administrador
  global: [«Elevate access to manage all subscriptions»][azure-elevate] deja al
  administrador **sin** acceso a los recursos por defecto, y quien lo necesita
  activa un interruptor que se puede apagar después. Aquí se copia la forma —
  apagado por defecto, encendido explícito— y se adapta la semántica: en vez de
  «sin acceso a nada», el superadministrador restringido ve **lo suyo**, porque
  aquí lo suyo ya existe (D6 de RFC 0008: el pastor administra por pertenencia).
- El patrón de **quien crea la cuenta nace como dueño de su propio espacio**
  (Slack, Notion, Figma) ya está descrito en RFC 0008 §7.2/8.2 con `/welcome`;
  esta RFC solo corrige que hoy no se dispara para un pastor dado de alta desde
  la administración, únicamente para quien se registra por su cuenta.

[workos]: https://workos.com/blog/how-to-design-multi-tenant-rbac-saas
[azure-elevate]: https://learn.microsoft.com/en-us/azure/role-based-access-control/elevate-access-global-admin

## Decisiones tomadas

- **D1 — El tope se calcula con `roles.level`, no con `ROLE_HIERARCHY`.** La
  constante de `packages/shared` solo cubre los roles de serie; un rol propio
  de la instalación (RFC 0008 §6.3) tiene su nivel en la tabla `roles` y el
  tope tiene que valer igual para él. `RolesService` gana un `levelOf(slug)`.
- **D2 — Regla única**: quien no es superadministrador solo puede asignar un
  rol con `level` **estrictamente menor** que el suyo. El superadministrador no
  pasa por esta comprobación: es quien reparte los roles altos y `roles.manage`
  ya es solo suyo (RFC 0008 §6.3).
- **D3 — El tope se aplica en dos sitios de `UserAdminService`**: al crear
  (`create`) y al cambiar el rol de una cuenta existente (`update`/`setRole`).
  No hace falta tocar `remove`: borrar no cambia el rol de nadie.
- **D4 — Quién se autoprovisiona, no una lista de slugs.** En vez de codificar
  `if (role === 'pastor' || role === 'superadmin')`, la regla es: **un rol con
  el permiso `churches.manage` no entra en la iglesia de quien lo crea**; se
  queda sin iglesia y pasa por `/welcome`. Hoy eso son `pastor` y
  `superadmin` (RFC 0008 §6.3), y seguirá siendo así si algún día se crea un
  rol propio con ese permiso, sin tocar este código.
- **D5 — La preferencia de alcance vive en `profiles`, no en el cliente.**
  Igual que `active_church_id` (RFC 0008 D2): decide qué devuelve el
  **servidor**, así que no puede vivir en `localStorage` — si viviera ahí,
  cualquier acceso que no pase por esta pantalla (móvil, una llamada directa a
  la API) volvería a ver todo.
- **D6 — Es una preferencia, no un permiso.** No se añade `admin.scopeAll` al
  catálogo de `packages/shared/src/permissions.ts`: esto no decide **qué puede
  hacer** el superadministrador —ya puede con todo—, decide **qué quiere ver
  ahora mismo**. Es la misma distinción de RFC 0008 §6.2 entre permiso y
  alcance, llevada un paso más allá: aquí el alcance lo elige la propia cuenta.
- **D7 — Restringido es el valor por defecto**, también para las cuentas de
  superadministrador que ya existen: la migración pone la columna a `true`
  para todas. Quien de verdad necesita ver todo lo activa una vez desde
  ajustes.
- **D8 — Un superadministrador restringido usa el mismo camino que un
  pastor**, sin bifurcación: si no tiene `ChurchMember`, `ChurchGate` lo manda
  a `/welcome` igual que a cualquiera con `churches.manage` y sin iglesias.
  Nace, si hace falta, exactamente como nace hoy un pastor nuevo.

## Modelo de datos

Una columna nueva, nada más: no hace falta ninguna entidad ni relación nueva.

```
Profile (existente, RFC 0008)
└── restrict_own_scope: boolean, default true
    — Solo tiene efecto para quien tiene rol `superadmin`; en cualquier otra
      cuenta se guarda y no se lee nunca, para no bifurcar el esquema por rol.
```

`packages/shared/src/schemas/profile.ts`:

```ts
export const profileSchema = z.object({
  // …los campos que ya hay…
  restrictOwnScope: z.boolean(),
});

export const updateProfileSchema = z.object({
  // …los campos que ya hay…
  restrictOwnScope: z.boolean().optional(),
});
```

Y en `packages/shared/src/constants.ts`, junto a `ROLE_HIERARCHY`:

```ts
/**
 * Si quien tiene el nivel `askerLevel` puede asignarle a alguien un rol de
 * nivel `targetLevel`: nunca el suyo propio ni uno por encima. El
 * superadministrador no pasa por aquí (D2).
 */
export function canAssignRoleLevel(
  askerLevel: number,
  targetLevel: number,
): boolean {
  return targetLevel < askerLevel;
}
```

## Lógica de negocio

### El tope de rol (D1-D3)

`RolesService` gana un método de lectura, hermano de `permissionsOf`:

```ts
/** El nivel de ese rol, o `null` si no está en el catálogo. */
async levelOf(slug: RoleSlug): Promise<number | null> {
  const role = await this.roles.findOne({ where: { slug } });
  return role ? role.level : null;
}
```

`UserAdminService` gana un método privado que usan `create` y `update`:

```ts
/** Nadie asigna un rol igual o por encima del suyo; el superadministrador, sí. */
private async ensureAssignable(role: RoleSlug, asker: Asker): Promise<void> {
  if (asker.role === SUPERADMIN_ROLE) return;

  const [askerLevel, targetLevel] = await Promise.all([
    this.roles.levelOf(asker.role),
    this.roles.levelOf(role),
  ]);

  if (askerLevel === null || targetLevel === null || !canAssignRoleLevel(askerLevel, targetLevel)) {
    throw new ForbiddenException('No puedes asignar un rol igual o superior al tuyo');
  }
}
```

Se llama justo después de `roles.ensureExists(input.role)` en `create`, y al
principio de `update` cuando `input.role` está presente (`setRole` ya delega en
`update`, así que queda cubierto sin tocarlo).

### Onboarding independiente (D4)

En `UserAdminService.create`, después de fijar el rol:

```ts
const permissions = await this.roles.permissionsOf(input.role);
const seProvisionaSolo = hasPermission(permissions ?? [], 'churches.manage');

if (!seProvisionaSolo) {
  await this.churches.addToActive(asker, created.user.id);
}
```

Una cuenta que nace con `churches.manage` (hoy, `pastor` y `superadmin`) se
queda sin `ChurchMember`. Al iniciar sesión, `useChurches()` devuelve
`items: []`, y `ChurchGate` —sin tocarlo, ya hace exactamente esto— la manda a
`/welcome`. A partir de ahí sigue el camino que ya existe: crea su iglesia,
queda como dueña y como miembro, y todo lo que gestione después (calendario,
creyentes, comunicaciones, listas, usuarios) queda acotado a esa iglesia por
`church_id`, como todo lo demás desde RFC 0008.

### Alcance del superadministrador (D5-D8)

`ChurchesService.accessible` es el único sitio que decide qué iglesias llegan
a una cuenta; todo lo demás (`scopeFor`, `listFor`, `sharesChurchWith`) ya
cuelga de él. Se le añade una comprobación al principio de la rama de
superadministrador:

```ts
private async accessible(asker: Asker): Promise<Church[]> {
  const order = { name: 'ASC' } as const;

  if (asker.role === SUPERADMIN_ROLE && !(await this.isRestricted(asker.id))) {
    return this.churches.find({ order });
  }

  // La rama de siempre: por pertenencia. Un superadministrador restringido
  // pasa por aquí igual que cualquier otra cuenta.
  const memberships = await this.members.find({ where: { userId: asker.id } });
  if (memberships.length === 0) return [];

  return this.churches.find({
    where: { id: In(memberships.map((member) => member.churchId)) },
    order,
  });
}

private async isRestricted(userId: string): Promise<boolean> {
  const profile = await this.profiles.findOrCreate(userId);
  return profile.restrictOwnScope;
}
```

Y `scopeFor` deja de tener un caso especial para el superadministrador: solo
distingue si está restringido o no, delegando en `accessible`:

```ts
async scopeFor(asker: Asker, only?: readonly string[]): Promise<string[] | null> {
  const pedidas = only?.length ? only : undefined;

  if (asker.role === SUPERADMIN_ROLE && !(await this.isRestricted(asker.id))) {
    return pedidas ? [...pedidas] : null;
  }

  const ids = (await this.accessible(asker)).map((church) => church.id);
  return pedidas ? ids.filter((id) => pedidas.includes(id)) : ids;
}
```

Con esto, `UsersController.findAll` (que ya llama a `scopeFor`) y
`UserAdminService.target` (que ya llama a `sharesChurchWith`) quedan
correctos sin tocarlos: heredan el alcance restringido automáticamente. Lo
mismo el selector de iglesias y `/churches`, que cuelgan de `listFor` →
`accessible`.

## API

Cambios sobre lo que ya existe; no hay rutas nuevas.

| Método | Ruta                    | Cambio                                                                             |
| ------ | ----------------------- | ---------------------------------------------------------------------------------- |
| POST   | `/admin/users`          | `403` si el rol pedido es igual o superior al de quien pregunta (salvo superadmin) |
| PATCH  | `/admin/users/:id`      | Mismo `403` cuando el cuerpo trae `role`                                           |
| PATCH  | `/admin/users/:id/role` | Mismo `403` (delega en `update`)                                                   |
| PATCH  | `/profile`              | Acepta `restrictOwnScope`; sin efecto salvo para quien tiene rol `superadmin`      |
| GET    | `/churches`             | Para un superadministrador restringido, devuelve solo las suyas (antes, todas)     |
| GET    | `/admin/users`          | Para un superadministrador restringido, acota igual que a un pastor (antes, todas) |

### Errores

- `403` con `No puedes asignar un rol igual o superior al tuyo`, en el mismo
  formato que ya usa `AllExceptionsFilter` — no necesita campo `data`, es un
  mensaje que se enseña tal cual solo si no hay clave de traducción más
  específica (ver interfaz).

## Interfaz

### Web

**Alta y edición de cuentas** (`components/access/create-user-dialog.tsx`,
`edit-user-dialog.tsx`): el desplegable de rol dejar de ofrecer los roles que
la cuenta no podría asignar. `RoleSelect` gana una prop:

```ts
interface RoleSelectProps {
  // …las que ya tiene…
  /** Si se pasa, solo se listan los roles con `level` por debajo de este. */
  belowLevel?: number;
}
```

Los dos diálogos calculan su propio tope con lo que ya está cableado —
`useSession()` para el rol de quien pregunta y `useRoleCatalog()`, que ya trae
el nivel de cada rol— y no lo pasan si quien pregunta es superadministrador:

```ts
const { data: session } = useSession();
const catalog = useRoleCatalog();
const ownRole = session?.user.role;
const ownLevel = ownRole ? catalog.get(ownRole)?.level : undefined;
const belowLevel = ownRole === SUPERADMIN_ROLE ? undefined : ownLevel;
```

Esto es cortesía, no seguridad (RFC 0008 §6.4): si alguien fuerza un `POST`
directo, el `403` del servidor es la barrera real. El error se enseña con una
clave nueva en vez de `errors.generic`, siguiendo el patrón que ya usan estos
diálogos con el `409` de correo repetido.

**Ajustes, solo para el superadministrador**
(`routes/settings.tsx`): una sección nueva, la **primera** de la página —
decide qué significa todo lo que viene después, así que va antes que la
iglesia—, visible únicamente cuando `session.user.role === SUPERADMIN_ROLE`:

```tsx
{
  session?.user.role === SUPERADMIN_ROLE && (
    <>
      <SettingsSection
        eyebrow={t('settings.scopeGlobal')}
        title={t('settings.superadminScope')}
        description={t('settings.superadminScopeHint')}
      >
        <Card>
          <ScopeToggle profile={profile} update={updateProfile} />
        </Card>
      </SettingsSection>
      <hr className="border-border/60" />
    </>
  );
}
```

`ScopeToggle` (`components/settings/scope-toggle.tsx`) es un componente
pequeño con un interruptor y su etiqueta, que llama a `updateProfile.mutate({
restrictOwnScope: !profile.restrictOwnScope })`. No existe un componente de
interruptor en `components/ui` todavía —lo más cercano es el checkbox de
`PermissionPicker`—, así que esta RFC añade `components/ui/switch.tsx`:
`role="switch"`, `aria-checked`, foco visible (`focus-visible:ring-2
ring-ring`, Regla 3 §7) y los dos tokens de siempre (`bg-primary` encendido,
`bg-muted` apagado). Va a `ui/` porque no tiene nada específico de esta
pantalla y el resto de la aplicación lo va a necesitar tarde o temprano
(Regla 1 §2).

Al cambiar el interruptor, las consultas de iglesias y de usuarios se
invalidan (`queryKeys.churches`, `queryKeys.users`), igual que ya hace el
cambio de iglesia activa (RFC 0008, «Animación e interacción»): sin eso, la
placa del selector y el listado de `/users` seguirían enseñando lo de antes
hasta la próxima navegación.

### Claves de texto nuevas (los seis idiomas)

```
settings.scopeGlobal          — «Alcance» (eyebrow de la sección nueva)
settings.superadminScope      — «Qué ves en la administración»
settings.superadminScopeHint  — «Por defecto ves solo tus iglesias. Actívalo para ver las de todos.»
settings.restrictOwnScope     — «Ver solo lo mío»
settings.restrictOwnScopeHint — «Tus iglesias y las cuentas de sus miembros.»
roles.roleCeilingError        — «No puedes asignar un rol igual o superior al tuyo»
```

## Migraciones

Una sola, después de `BelieverJourney` (`1788048000000`):

```ts
// apps/api/src/database/migrations/<siguiente-timestamp>-RestrictSuperadminScope.ts
await queryRunner.addColumn(
  'profiles',
  new TableColumn({
    name: 'restrict_own_scope',
    type: 'boolean',
    default: true,
    isNullable: false,
  }),
);
```

`default: true` cubre en la misma sentencia a las cuentas de superadministrador
que ya existen (D7): no hace falta un `UPDATE` aparte. Se prueba en los dos
motores, como pide `CLAUDE.md`.

## Fases

### Fase 1 — Tope de roles

- [x] `RolesService.levelOf` y `canAssignRoleLevel` en `packages/shared`, cada
      uno con su test (rol existente, rol inventado, niveles iguales).
- [x] `UserAdminService.ensureAssignable`, llamado desde `create` y `update`.
- [x] `RoleSelect` con `belowLevel`, y los dos diálogos calculándolo.
- [x] Clave `roles.roleCeilingError` en los seis idiomas.

### Fase 2 — Onboarding independiente

- [x] `UserAdminService.create` deja de llamar a `addToActive` cuando el rol
      tiene `churches.manage`.
- [x] e2e: un superadministrador crea un pastor; el pastor entra sin iglesias
      y `ChurchGate` lo manda a `/welcome`.

### Fase 3 — Alcance del superadministrador

- [x] Columna `restrict_own_scope` (migración, en los dos motores) y campo en
      `Profile`, `profileSchema`, `updateProfileSchema`, `UpdateProfileDto`.
- [x] `ChurchesService.accessible`/`scopeFor` con la rama restringida, y su
      test: superadministrador restringido sin iglesias, con iglesias propias,
      y sin restringir (el caso de hoy).
- [x] `components/ui/switch.tsx` y `components/settings/scope-toggle.tsx`,
      enganchados en `settings.tsx` solo para `superadmin`.
- [x] Invalidación de `queryKeys.churches` y `queryKeys.users` al cambiar la
      preferencia.

## Pruebas

- **Unitarias**: `canAssignRoleLevel` (por debajo, igual, por encima),
  `RolesService.levelOf` (existe, no existe), `ChurchesService.accessible` con
  las tres combinaciones de rol/restricción, `UserAdminService.ensureAssignable`
  y el `create` sin `addToActive` para `pastor`.
- **e2e de la API** (Postgres, como siempre):
  - Un pastor intenta crear una cuenta con rol `pastor` → `403`. Con rol
    `recepcion` → `201`.
  - Un pastor intenta subir el rol de una cuenta suya a `pastor` → `403`.
  - Se crea un pastor desde la administración: sin `ChurchMember`, `GET
/churches` le devuelve `items: []`.
  - Dos pastores con sus propias iglesias: ninguno ve en `/admin/users` las
    cuentas del otro.
  - Un superadministrador nuevo (`restrict_own_scope = true` por defecto): `GET
/churches` y `GET /admin/users` acotados a lo suyo. Tras `PATCH /profile`
    con `restrictOwnScope: false`, ambos devuelven todo.
  - Una lista (RFC 0010) de la iglesia A, pedida por una cuenta de la iglesia
    B → `403` (deja explícito lo que RFC 0010 ya hacía implícitamente).
- **e2e de web** (Playwright): el desplegable de rol de un pastor no ofrece
  `pastor` ni `superadmin`; el interruptor de ajustes solo aparece para
  `superadmin` y cambia lo que enseña `/users` sin recargar.
- Y lo de siempre: `pnpm check`, en los dos temas, a 375 px y con el alemán.

## Riesgos y trampas

- **El tope se mira con `roles.level` de la tabla, nunca con `ROLE_HIERARCHY`
  de `shared`.** Esa constante solo cubre los siete roles de serie; un rol
  propio de la instalación con, por ejemplo, `level = 1` tiene que quedar tan
  tapado como `recepcion`, y solo la tabla lo sabe.
- **Atar el autoaprovisionamiento a `churches.manage` y no a los slugs
  `pastor`/`superadmin`** acopla la decisión al catálogo de permisos. Es
  intencional (D4): si algún día se le quita ese permiso a `pastor` desde la
  administración de accesos, el siguiente pastor creado se comportaría como
  cualquier otro rol de equipo. Es coherente con cómo ya funciona todo lo
  demás en RFC 0008, no una costura nueva.
- **Un superadministrador restringido que ya tenía `ChurchMember` de antes**
  (por haber creado iglesias él mismo antes de esta RFC) no queda «vacío»: ve
  esas. Es lo correcto, pero conviene probarlo contra una instalación con
  historial, no solo contra una cuenta recién creada.
- **`ChurchesService.accessible` pasa a leer el perfil también en la rama del
  superadministrador.** `ProfilesService` ya era una dependencia del servicio
  (se usa en `create`, `update`, `resolveActive`); no se añade ninguna
  dependencia nueva, pero si `accessible()` se acaba llamando varias veces en
  una misma petición, vale la pena no perder de vista ese coste, igual que ya
  pasa hoy con `resolveActive`.
- **La preferencia no tiene efecto en ninguna cuenta que no sea
  superadministrador**, y se guarda igual para todas: es más simple que
  esconder la columna, y el `UPDATE` de la migración ya no distingue por rol.

## Alternativas descartadas

- **Guardar la preferencia en `localStorage`**, como `navis.usersFilter`. Se
  descarta porque decide qué **devuelve el servidor**, no solo qué se pinta: si
  viviera en el cliente, una llamada directa a la API —u otro cliente, el día
  que exista en móvil— volvería a ver todo. Tiene que decidirlo el servidor,
  igual que la iglesia activa (RFC 0008 D2).
- **Un permiso nuevo (`admin.scopeAll`) en vez de una preferencia de
  perfil**. Se descarta porque esto no es «quién puede» —el superadministrador
  ya puede con todo—, es «qué quiere ver ahora»: la misma distinción entre
  permiso y alcance de RFC 0008 §6.2, y aquí el alcance lo elige la propia
  cuenta, no el catálogo de roles.
- **Impersonación** (entrar «como» un pastor concreto para ver lo suyo).
  Resuelve un problema distinto —depurar lo que ve alguien— y cuesta más:
  sesión paralela, registro de auditoría, botón para volver. No es lo que se ha
  pedido; si hace falta, es una RFC aparte.
- **Lista fija de «roles que puede dar cada rol»** en vez de comparar niveles.
  Se descarta por lo mismo que descarta WorkOS en su guía: cada rol nuevo
  —incluido uno propio de la instalación— obligaría a tocar esa lista a mano.
  Comparar `level` lo resuelve solo.

## Criterios de aceptación

- [x] Un pastor no puede crear ni ascender a nadie a `pastor` o
      `superadmin`, ni desde la interfaz ni llamando a la API directamente.
- [x] Una cuenta creada con rol `pastor` nace sin iglesia y pasa por
      `/welcome` al iniciar sesión, igual que quien se registra por su cuenta.
- [x] Dos pastores, cada uno con su propia iglesia, no ven nada el uno del
      otro: ni creyentes, ni calendario, ni comunicaciones, ni listas, ni
      usuarios.
- [x] Un superadministrador nuevo ve, por defecto, solo lo suyo —incluida la
      pantalla de bienvenida si no tiene ninguna iglesia—; al activar la opción
      de ajustes, ve toda la instalación sin recargar la página.
- [x] `pnpm check` y `pnpm test:e2e` en verde, con la migración probada en
      SQLite y en Postgres.
