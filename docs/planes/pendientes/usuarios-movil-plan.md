# Gestión de usuarios en móvil

Llevar a `apps/mobile` lo que la web hace en `/users` (Usuarios · Roles), más los
**accesos de lectura** de los listados (RFC 0010 D22: no son cuentas). Hoy todo
es local (SQLite), pero detrás de un puerto para conectar la API después sin
tocar pantallas.

## Arquitectura

`UsersGateway` (`src/data/users/users-gateway.ts`) declara las operaciones que
ya usa la web, con los tipos de `@navis/shared`. Hoy lo cumple
`local-users-gateway.ts`; el adaptador remoto envolverá `useManagedUsers`,
`useRoles`… de `@navis/api-client`. El test `users-gateway.test.ts` es la batería
de contrato: parametrizarla por adaptador cuando exista el remoto.

## Fases

1. **Datos locales y reglas** — hecha. Migración 21 (`roles` + `local_user.role`),
   repos, reglas (propia cuenta, alcance por iglesia, tope de rol, último
   superadmin, baja con iglesias propias, roles de serie) y 13 tests.
2. Directorio de usuarios (pantalla firma, estilo Tomtask con tokens de Navis).
3. Alta, edición, contraseña, baja y detalle.
4. Roles y selector de permisos.
5. Pestaña Accesos (reutiliza `components/lists/viewer-*`).
6. Pulido, seis idiomas, dos temas, verificación en emulador.

## Huecos conocidos (decidir antes de la Fase 3)

- **Cambiar el correo invalida la contraseña**: el correo es la sal del hash
  local (`account-repo.hashPassword`). La pantalla debe pedir una contraseña
  nueva al cambiarlo.
- **Baja con «trasladar» una iglesia** no está en local (funde catálogos y mueve
  ficheros, como `church-transfer.service.ts`): el adaptador responde
  `transfer-unsupported`. «Eliminar» sí, con aviso de impacto.
- Las cuentas que ya existían pasan a `pastor` en la migración; las que se
  registren en el teléfono, también.
- Activar/desactivar, invitaciones y sesiones no existen en web ni API: no se
  inventan en móvil.
