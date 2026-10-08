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
4. Roles y selector de permisos.
5. Pestaña Accesos (reutiliza `components/lists/viewer-*`).
6. Pulido, seis idiomas con el texto más largo, dos temas, verificación en
   emulador con alemán.

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
- Activar/desactivar, invitaciones y sesiones no existen en web ni API: no se
  inventan en móvil.

## Pruebas

- Unitarias y de contrato: `src/data/users/users-gateway.test.ts`,
  `src/lib/users/user-form.test.ts`, `packages/shared/src/role-display.test.ts`.
- Interfaz con SQLite real: `src/components/users/users-directory.test.tsx` y
  `users-flows.test.tsx` (alta con validación, correo repetido, edición con
  cambio de correo, contraseña, baja en dos pasos y permisos).
- e2e en emulador: `apps/mobile/e2e/users_flow.py` (ver su `README.md`);
  capturas en `docs/qa/usuarios-movil/`. Hecho en inglés; falta pasarlo en
  español y en alemán.

## Pendiente conocido

- `believers-repo.test.ts` («el que agota su margen…») falla pasada la medianoche
  local porque calcula «hoy» en una zona y el repositorio en otra. No es de
  este trabajo.
- `tables/date-value.test.ts` ejecuta `rtk`, que hay que tener en el PATH.
