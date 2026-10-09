# Gestión de usuarios en móvil

Llevar a `apps/mobile` lo que la web hace en `/users` (Usuarios · Roles), más los
**accesos de lectura** de los listados (RFC 0010 D22: no son cuentas). Hoy todo
es local (SQLite), pero detrás de un puerto para conectar la API después sin
tocar pantallas.

## Arquitectura

`UsersGateway` (`src/data/users/users-gateway.ts`) declara las operaciones que
ya usa la web, con los tipos de `@navis/shared`. Hoy lo cumple
`local-users-gateway.ts`; el adaptador remoto envolverá `useManagedUsers`,
`useRoles`… de `@navis/api-client`. El único sitio que elige adaptador es
`src/data/users/gateway.ts`. El test `users-gateway.test.ts` es la batería de
contrato: parametrizarla por adaptador cuando exista el remoto.

`getUser` (la ficha) no existe en la API de hoy (`GET /admin/users/:id`): el
adaptador remoto lo añadirá o lo sacará del listado.

## Fases

1. **Datos locales y reglas** — hecha. Migración 21 (`roles` + `local_user.role`),
   repos y reglas (propia cuenta, alcance por iglesia, tope de rol, último
   superadmin, baja con iglesias propias, roles de serie).
2. **Directorio** — hecha. Cabecera con cifra y reparto por rol, buscador, chips
   de rol, tarjeta con anillo del color del rol. `roleColor` y las claves de
   nombre de rol viven en `@navis/shared` (`role-display.ts`).
3. **Alta, edición, contraseña, baja y ficha** — hecha. Hojas de formulario,
   ficha `/users/[id]` con cabecera del color del rol, baja en dos pasos con el
   impacto de las iglesias propias, y acciones ocultas sin `users.manage`.
4. **Roles y selector de permisos** — hecha. Pestañas Usuarios · Roles en una sola
   pantalla; lista de roles de más a menos alcance, ficha `/users/roles/[id]` con
   el resumen de permisos por módulo, alta/edición con selector de permisos
   (píldoras Ver · Gestionar · Publicar) y baja. Los mapas de módulo y acción de
   los permisos (`permission-display.ts`) viven ahora en `@navis/shared`, y la
   web los reexporta.
5. **Pestaña Accesos** — hecha. Tercer segmento de la pantalla con el directorio de
   accesos de lectura de **toda la iglesia** (no los de una lista): cabecera con el
   reparto por estado (en vigor · caducado · desactivado), tarjeta con una píldora
   de color por lista que abre, y ficha `/users/access/[id]` con hojas para cambiar
   las listas, editar nombre y caducidad, regenerar la contraseña (se ve una vez)
   y revocar. Reutiliza `ViewerForm`, `ViewerGrants`, `ViewerCredentials` y
   `useViewerDetail` de las listas; el alta ya no exige una lista de partida.
6. **Pulido** — hecha. Contraste fijado por test (`contrast.test.ts`) y degradados que
   solo se oscurecen lo justo (`readableGradient`); pestañas en el azul de los
   botones (`primary`) en toda la app; y las tres pantallas recorridas en **los seis
   idiomas**, a 375 px y en claro y oscuro.

## Decisiones tomadas en las fases 2 y 3

- **Cambiar el correo exige contraseña nueva**: el correo es la sal del hash
  local (`account-repo.hashPassword`). El formulario la pide al cambiarlo
  (`lib/users/user-form.ts`).
- **Baja con «trasladar» una iglesia** no está en local (funde catálogos y mueve
  ficheros, como `church-transfer.service.ts`): el adaptador responde
  `transfer-unsupported` y la hoja de baja solo ofrece eliminar, avisándolo.
- **En la hoja de alta el rol va antes que la contraseña**: con el teclado
  abierto, el pie de la hoja tapaba el selector (lo cazó el repaso en emulador).
- **La lista va ordenada por nombre**, no agrupada por escalón de rol.
- Las cuentas que ya existían pasan a `pastor` en la migración; las que se
  registren en el teléfono, también.
- **Los permisos de un rol solo los toca `roles.manage`** (el superadministrador).
  El pastor ve el catálogo y las fichas, sin acciones. De un rol de serie se
  editan descripción y permisos; del superadministrador, ni los permisos.
- **La pestaña Accesos la ve quien tiene `lists.share` y es dueño de la iglesia**: en
  local, escribir en los accesos exige ser el dueño (`listDb(context, true)`), así que
  un pastor que solo es miembro no la ve en vez de ver una lista que no puede tocar.
  Los accesos no son cuentas (RFC 0010 D22) y la cabecera lo dice.
- Activar/desactivar cuentas, invitaciones y sesiones no existen en web ni API: no se
  inventan en móvil.

## Pruebas

- Unitarias y de contrato: `src/data/users/users-gateway.test.ts`,
  `src/lib/users/user-form.test.ts`, `packages/shared/src/role-display.test.ts`.
- Interfaz con SQLite real: `src/components/users/users-directory.test.tsx` y
  `users-flows.test.tsx` (alta con validación, correo repetido, edición con
  cambio de correo, contraseña, baja en dos pasos y permisos).
- e2e en emulador: `users_flow.py`, `roles_flow.py` (solo lectura, vale un pastor) y
  `roles_manage_flow.py` (superadministrador); ver `apps/mobile/e2e/README.md`.
  Capturas en `docs/qa/usuarios-movil/`. Hechos en los seis idiomas.
- Roles: `roles-flows.test.tsx` (lista y búsqueda, alta, nombre repetido, edición,
  borrado, rol con cuentas, rol de serie, superadministrador, permisos y pestañas),
  `role-form.test.ts` y `permission-display.test.ts`.

- Accesos: `access-flows.test.tsx` (listado y estados, caducado, búsqueda, vacío, alta,
  la X de la hoja, listas, edición, contraseña, activar, revocar y quién ve la pestaña)
  y `access-status.test.ts`. e2e: `access_flow.py`.
- Los guiones e2e ya no suponen la pestaña, la búsqueda ni el scroll de la visita
  anterior (`reveal()` en `adb_driver.py`): la pantalla conserva su estado entre visitas.

## Pulido de la Fase 6

- **Las pestañas son del azul de los botones.** `SegmentedControl` pinta la activa con
  `primary` y su texto con `primary-foreground`, y lo heredan todas las pantallas que lo
  usan (usuarios, tareas, cuaderno, listas, creyentes…).
- **Etiquetas largas**: una pestaña de más de 10 letras («Utilisateurs», «Utilizadores»)
  baja a `text-xs`; el título de un rol se encoge hasta un 80 % antes de partirse
  («Superamministratore»); el marcador del buscador es corto en cada idioma; el subtítulo de
  la cabecera admite tres líneas.
- **Los e2e corren en es, en, de, fr, it y pt** (`--locale`), siempre a 375 px; guardan
  capturas en `docs/qa/usuarios-movil/*-{idioma}`.

## Arreglado por el camino

- `believers-repo`: el alta (`created_at`, un instante UTC) se recortaba con `substr` y se
  comparaba con el día **local**: «días sin nota» y las altas del mes salían un día
  desviados según la hora. Ahora `CREATED_DAY` (`believers-sql.ts`) convierte a hora
  local, y el panel (`dashboard-repo`) reutiliza esa misma consulta en vez de duplicarla.
- `believers-repo.test.ts` calculaba «hoy» en UTC; usa `deviceToday()` como el repositorio.
- `tables/date-value.test.ts` ya no depende de `rtk`: lanza el propio `node`.

## Pendiente

- Nada de las seis fases. Queda fuera del plan: conectar el adaptador remoto a la API (RFC 0024).
- El e2e de roles de gestión (`roles_manage_flow.py`) exige superadministrador.
- `calendar-repo.test.ts` calcula el mes con `toISOString()` (UTC): mismo defecto de
  fondo, solo salta en el cambio de mes.
