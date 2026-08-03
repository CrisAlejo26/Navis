# ADR 0003: Better Auth con sesiones en la base de datos

- **Estado**: Aceptada
- **Fecha**: 2026-08-02
- **Supersede a**: la idea inicial de JWT con Passport y argon2

## Contexto

Hacía falta autenticación para tres clientes: navegador, app nativa y
escritorio. La opción por defecto era montarla a mano con `@nestjs/jwt`,
`passport-jwt` y argon2.

## Decisión

**Better Auth 1.6**, montado en `/api/auth`, con las **sesiones guardadas en la
base de datos** en vez de JWT sin estado.

- Las tablas de identidad (`user`, `session`, `account`, `verification`) las
  gestiona Better Auth con su propio CLI; el dominio lo gestiona TypeORM en la
  MISMA base de datos, así que hay claves foráneas reales entre ambos mundos.
- `bodyParser: false` en `NestFactory.create` y el handler montado ANTES de
  `express.json()`: Better Auth necesita el cuerpo crudo.
- Campos propios (`role`, `locale`) como `additionalFields` con `input: false`,
  para que el cliente no pueda enviarlos al registrarse.

## Consecuencias

- Una sesión se puede **revocar** desde el servidor. Con un JWT sin estado, un
  token robado vale hasta que caduca.
- El cliente web no guarda ningún token: la sesión viaja en una cookie
  httpOnly, fuera del alcance de JavaScript. En móvil, el plugin de Expo la
  guarda en el almacén seguro del sistema.
- Menos código propio de autenticación, que es donde más caro sale equivocarse.
- **Orden de migraciones obligatorio**: primero `auth:migrate` (crea `user`) y
  después `migration:run` (la FK de `profiles` apunta a `user`). `pnpm
db:migrate` ya encadena ambos, y la migración falla con un mensaje explícito
  si se invierte.
- Detrás de un proxy hay que activar `TRUST_PROXY` para que el limitador de
  peticiones vea la IP real del cliente y no un único cubo compartido.
