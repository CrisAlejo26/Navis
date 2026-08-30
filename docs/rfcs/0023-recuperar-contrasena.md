# RFC 0023: Recuperar contraseña

- **Estado**: Implementado
- **Autor**: Cristian Alejandro Arroyave (con Claude Code)
- **Fecha**: 2026-08-30
- **Apps afectadas**: api / web
- **Depende de**: Better Auth (`emailAndPassword`, RFC 0007)

## Problema

Quien olvida su contraseña se queda fuera sin ninguna forma de volver a
entrar: no hay «¿olvidaste tu contraseña?» en el login, y tampoco un panel de
administración que la reinicie por otro. Ya ha pasado — una creyente se
registró y nunca consiguió entrar en 23 días, sin dejar ni un intento de
recuperación porque no existía dónde pedirla, y la única salida fue que un
administrador entrara a mano en la base de datos.

## Alcance

**Entra:**

- Enlace «¿Olvidaste tu contraseña?» en `/login`.
- Pantalla para pedir el enlace de recuperación por email (`/forgot-password`).
- Pantalla para fijar la contraseña nueva desde el enlace del correo
  (`/reset-password`).
- Envío de ese correo por SMTP (buzón `cristian@cristiancode.es`, Arsys).
- Invalidar el resto de sesiones activas de la cuenta al cambiar la
  contraseña.

**No entra:**

- **Móvil**: la app nativa ya tiene su propio login (RFC previo, fuera de
  este RFC); recuperar la contraseña ahí abriría el navegador del sistema
  contra las mismas pantallas de web — se deja para cuando haga falta.
- Un panel de administración para que un pastor resetee la contraseña de
  otra persona directamente. El correo es la vía; no hay una segunda.
- Verificación de email al registrarse (`requireEmailVerification` sigue en
  `false`, sin cambios).
- Proveedor de email genérico/configurable: se cablea Arsys por SMTP directo,
  no una capa de proveedores intercambiables — no hay un segundo caso real
  hoy (Regla 1 §4).

## Arquitectura

### Envío de correo (nuevo en `apps/api`)

Better Auth expone el flujo completo (`/request-password-reset`,
`/reset-password/:token`, `/reset-password`) en cuanto
`emailAndPassword.sendResetPassword` está definido — no hace falta ningún
plugin. Lo único que falta es **cómo se manda el correo**, y ahí no había
nada montado en el proyecto (sin SMTP, sin proveedor transaccional).

```
apps/api/src/auth/mailer.ts   — createMailer(env): transporte de nodemailer
                                 + sendPasswordReset(), como función pura
```

`auth.ts` ya vive **fuera** del grafo de Nest — `createAuthDatabase` es la
misma clase de función, plana y creada una vez al cargar el módulo (§ arriba)
— así que el correo sigue el mismo patrón en vez de montar un `MailModule` de
Nest para un único consumidor que no lo necesita (Regla 1 §4: no se abstrae
por si acaso; si mañana otra parte de la API necesita mandar correo, es
entonces cuando se saca a un módulo con inyección de verdad). `createMailer`
es una fábrica con opciones (Regla 1 §3): recibe la configuración SMTP
validada por `env.ts` y expone un método por tipo de correo, no un
`sendMail` genérico — así el HTML y el asunto viven en un solo sitio.

Variables nuevas en `packages/shared/src/env.ts` (`apiEnvSchema`), todas
opcionales — sin ellas, `sendResetPassword` registra un aviso y no manda
nada, en vez de tumbar el arranque como con `BETTER_AUTH_SECRET`:

```
SMTP_HOST      — smtp.serviciodecorreo.es (Arsys)
SMTP_PORT      — 465
SMTP_SECURE    — true (SSL directo en el 465, no STARTTLS)
SMTP_USER      — cristian@cristiancode.es
SMTP_PASSWORD  —
SMTP_FROM      — remitente que ve quien recibe el correo
```

### `apps/api/src/auth/auth.ts`

```ts
emailAndPassword: {
  // … lo que ya había …
  sendResetPassword: async ({ user, url }) => {
    await mailService.sendPasswordReset(user.email, url);
  },
  revokeSessionsOnPasswordReset: true, // cierra el resto de sesiones al cambiarla
},
```

`url` ya viene resuelta por Better Auth apuntando a su propio endpoint de
redirección (`{BETTER_AUTH_URL}/api/auth/reset-password/:token?callbackURL=…`),
que valida el token y manda al navegador a `callbackURL` con `?token=…`. El
correo no construye ningún enlace a mano.

### Web

```
apps/web/src/routes/
├── forgot-password.tsx   — pide el email
└── reset-password.tsx    — lee ?token= y fija la contraseña nueva
```

Las dos reutilizan `AuthLayout`, `FormError`, `PasswordInput`,
`PasswordMeter` y el propio `authClient` (`requestPasswordReset`,
`resetPassword` — métodos del proxy dinámico de Better Auth, sin plugin
nuevo). `login.tsx` gana un `TextLink` a `/forgot-password` junto al campo de
contraseña.

`callbackURL` que se manda al pedir el enlace es
`${window.location.origin}/reset-password`: la app no necesita saber su
propio dominio de antemano (funciona igual en local, en Docker y en
producción).

### Seguridad (Fase 2 — hallazgos del sector)

De la investigación de patrones de recuperación de contraseña ([UX Patterns
for Developers — Password Reset](https://uxpatterns.dev/patterns/authentication/password-reset),
[Mailpro — Password Reset UX](https://www.mailpro.com/blog/how-to-handle-forgotten-passwords-with-confidence)):

- **Nunca se confirma si el email existe.** Better Auth ya responde el mismo
  mensaje exista o no la cuenta (mitiga enumeración de usuarios por timing
  también, simulando el trabajo si no hay cuenta) — la pantalla solo tiene
  que enseñar ese único mensaje, sin ramas.
- **El resto de sesiones se cierran al cambiar la contraseña**
  (`revokeSessionsOnPasswordReset: true`): si el motivo era una cuenta
  comprometida, la sesión de quien la comprometió muere también.
- **Tono tranquilo, no alarmante**, en la confirmación: se informa, no se
  advierte.
- El límite de peticiones lo cubre el `rateLimit` por defecto de Better Auth
  (ya activo para toda `/api/auth`); no hace falta uno específico para esta
  ruta hoy.

## i18n

Sección `auth`, seis idiomas:

`forgotPassword`, `forgotPasswordTitle`, `forgotPasswordSubtitle`,
`sendResetLink`, `sendingResetLink`, `resetLinkSent`, `resetLinkSentDetail`,
`backToLogin`, `resetPasswordTitle`, `resetPasswordSubtitle`, `newPassword`,
`confirmPassword`, `passwordsDontMatch`, `resetPassword`, `resettingPassword`,
`passwordReset`, `invalidResetToken`, `invalidResetTokenDetail`,
`requestNewLink`.

## Consideraciones

- **Privacidad**: el correo lleva solo el enlace de un solo uso, sin datos
  pastorales.
- **Sin SMTP configurado** (instalación local, `DB_DRIVER=sqlite` de
  desarrollo): `sendResetPassword` registra un aviso con `logger` y no
  revienta — el registro y el login normales siguen funcionando igual que
  hoy.

## Alternativas descartadas

- **Proveedor transaccional (Resend, SendGrid)**: añade una cuenta y una
  dependencia externas para un volumen de correo mínimo, cuando ya hay un
  buzón real dando la cara por el proyecto. Se revisará si el volumen lo
  pide.
- **Panel de administración para resetear a otros**: resuelve el síntoma
  puntual (el caso de alejitafm) pero no la causa; el enlace por correo
  cubre el caso general y dice quién sigue teniendo el email.

## Criterios de aceptación

- [x] `/login` enlaza a `/forgot-password`.
- [x] Pedir el enlace con un email que no existe responde igual que con uno
      que sí existe.
- [x] El correo llega con un enlace que abre `/reset-password?token=…`.
- [x] Fijar la contraseña nueva permite entrar con ella y cierra las demás
      sesiones activas de la cuenta.
- [x] Un token caducado o ya usado muestra el estado de error, con salida a
      pedir uno nuevo.
- [x] Los seis idiomas.
- [x] Probado de verdad en `navis.officetools.es`, no solo con tests.
