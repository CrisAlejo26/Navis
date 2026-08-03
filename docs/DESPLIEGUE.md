# Despliegue a producción

Todo pasa por GitHub Actions. Un `push` a `main` dispara
[`deploy.yml`](../.github/workflows/deploy.yml), que hace **siempre** esto y en
este orden:

| #   | Paso                                                                                                                      | Si falla…                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Verificación completa: formato, lint, tipos, tests unitarios, `pnpm build`, e2e de API y web, expo-doctor y `cargo check` | No se construye ninguna imagen. Producción no se toca |
| 2   | Construir y publicar las imágenes en GHCR, etiquetadas con el SHA                                                         | Producción no se toca                                 |
| 3   | Aplicar migraciones en un contenedor de un solo uso                                                                       | La versión antigua sigue sirviendo                    |
| 4   | Levantar la versión nueva                                                                                                 | —                                                     |
| 5   | Sondear `/health` durante 2,5 minutos                                                                                     | Se vuelve a la versión anterior                       |

El paso 1 es el mismo workflow de CI que corre en cada pull request: no hay dos
listas de comprobaciones que puedan desincronizarse.

## La regla que hay que respetar: migraciones compatibles hacia atrás

El paso 5 revierte los **contenedores**, no la **base de datos**. Durante unos
segundos convive el esquema nuevo con la versión antigua del código, y tras una
reversión eso deja de ser temporal.

Por eso una migración nunca debe romper a la versión anterior en el mismo
despliegue. Renombrar o borrar una columna se hace en dos entregas:

1. Añadir lo nuevo, escribir en ambos sitios, desplegar.
2. Cuando la versión anterior ya no está en marcha, borrar lo viejo.

## Qué hay que configurar una sola vez

### En el servidor

- Docker y el plugin de Compose.
- Una carpeta de despliegue (por ejemplo `/srv/pastortools`) con un fichero
  `.env` que contenga los secretos de producción: credenciales de Postgres,
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGINS`,
  `AUTH_TRUSTED_ORIGINS` y los puertos. Ese `.env` **no** viaja desde el
  repositorio: vive solo en el servidor.
- Un usuario con acceso SSH por clave y permiso para ejecutar `docker`.

El único fichero que Actions copia al servidor es
[`docker-compose.deploy.yml`](../docker-compose.deploy.yml), que no construye
nada: tira de las imágenes ya publicadas.

### Secretos del repositorio

| Secreto          | Para qué                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `DEPLOY_HOST`    | Host o IP del servidor                                                                                                                 |
| `DEPLOY_USER`    | Usuario SSH                                                                                                                            |
| `DEPLOY_SSH_KEY` | Clave privada SSH (sin passphrase)                                                                                                     |
| `DEPLOY_PATH`    | Carpeta de despliegue en el servidor                                                                                                   |
| `DEPLOY_PORT`    | Puerto SSH, si no es el 22 (opcional)                                                                                                  |
| `REGISTRY_TOKEN` | Token con permiso `read:packages`, si las imágenes son privadas (opcional: por defecto se usa el `GITHUB_TOKEN` del propio despliegue) |

### Variables del repositorio

| Variable         | Para qué                                                                             |
| ---------------- | ------------------------------------------------------------------------------------ |
| `VITE_API_URL`   | URL pública de la API. Se **incrusta en el bundle** de la web al construir la imagen |
| `VITE_AUTH_URL`  | URL pública de Better Auth, igual de incrustada                                      |
| `PRODUCTION_URL` | Solo para el enlace que muestra GitHub en el despliegue                              |

Cambiar `VITE_*` obliga a reconstruir la imagen de la web: son constantes de
compilación, no configuración de ejecución. La API, en cambio, sí lee su entorno
al arrancar (ver [RFC 0007](./rfcs/0007-modo-local-y-servidor.md)).

### Aprobación manual (opcional)

El job de despliegue usa el entorno `production` de GitHub. Si en
**Settings → Environments → production** se añade un revisor obligatorio, cada
despliegue se queda esperando aprobación después de pasar las verificaciones.

## Desplegar a mano

`Actions → Deploy → Run workflow`. Tiene una casilla `skip_verify` para saltarse
las comprobaciones: existe solo para revertir una emergencia, y no debería
usarse para nada más.

## Volver a una versión anterior

El servidor guarda la etiqueta desplegada en `.deployed-tag`. Para retroceder a
mano, desde la carpeta de despliegue:

```bash
IMAGE_TAG=<sha-de-12-caracteres> docker compose -f docker-compose.deploy.yml up -d
```

Las imágenes se etiquetan con los 12 primeros caracteres del SHA del commit, así
que cualquier commit de `main` que llegara a desplegarse se puede recuperar.
