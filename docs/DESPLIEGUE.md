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

## Si falta configuración

Sin los secretos del servidor no hay despliegue posible, y el workflow **falla
en rojo** diciendo cuáles faltan (nunca cuánto valen: el resumen de una
ejecución de un repositorio público lo lee cualquiera). Es a propósito: durante
un tiempo se saltaba en verde, y un push a `main` parecía desplegado sin haberlo
estado nunca.

La excepción son los **forks**, donde no hay servidor al que desplegar: ahí sí
se salta entero y lo deja anotado en el resumen de la ejecución.

## Qué hay que configurar una sola vez

> **Este repositorio es público.** Aquí no se escriben la IP del servidor, el
> usuario de SSH, la ruta de despliegue ni los puertos internos: van en los
> secretos del repositorio. Si alguna vez hace falta un ejemplo, se pone un
> marcador (`<servidor>`, `<carpeta-de-despliegue>`), nunca el valor real.

### En el servidor

- Docker y el plugin de Compose.
- Una carpeta de despliegue con un fichero `.env` que contenga los secretos de
  producción: credenciales de Postgres, `BETTER_AUTH_SECRET`,
  `BETTER_AUTH_URL`, `CORS_ORIGINS`, `AUTH_TRUSTED_ORIGINS` y los puertos en
  los que escuchan la API y la web detrás del proxy. Ese `.env` **no** viaja
  desde el repositorio: vive solo en el servidor.
- Un usuario con acceso SSH por clave y permiso para ejecutar `docker`, con la
  clave pública de despliegue en su `authorized_keys`.

Los únicos ficheros que Actions copia al servidor son
[`docker-compose.deploy.yml`](../docker-compose.deploy.yml) —que no construye
nada: tira de las imágenes ya publicadas— y el script de limpieza.

### Secretos del repositorio

**Settings → Secrets and variables → Actions → New repository secret.**

| Secreto                 | Qué es                                                                  |
| ----------------------- | ----------------------------------------------------------------------- |
| `HOST_CRISTIAN_SSH_KEY` | Clave **privada** SSH de despliegue, sin passphrase                     |
| `DEPLOY_HOST`           | Host o IP del servidor                                                  |
| `DEPLOY_USER`           | Usuario SSH                                                             |
| `DEPLOY_PATH`           | Carpeta de despliegue en el servidor                                    |
| `DEPLOY_PORT`           | Puerto SSH, si no es el 22 (opcional)                                   |
| `REGISTRY_TOKEN`        | Token con `read:packages`, solo si las imágenes son privadas (opcional) |

El nombre de la clave es el mismo que en los demás proyectos que despliegan en
ese servidor, así que se reutiliza su valor. Ojo: los secretos son **por
repositorio**, y una vez guardados **no se pueden volver a leer**, ni siquiera
por su dueño. Hay que pegar el fichero de la clave privada, no copiarlo de otro
repositorio.

### Variables del repositorio

Ninguna es obligatoria: el workflow trae por defecto las URL públicas del sitio,
que no son ningún secreto —acaban dentro del bundle de la web—. Se definen solo
para cambiarlas sin tocar el YAML.

| Variable         | Para qué                                                 |
| ---------------- | -------------------------------------------------------- |
| `VITE_API_URL`   | URL pública de la API, incrustada en el bundle de la web |
| `VITE_AUTH_URL`  | URL pública de Better Auth, igual de incrustada          |
| `PRODUCTION_URL` | Solo para el enlace que muestra GitHub en el despliegue  |

Cambiar `VITE_*` obliga a reconstruir la imagen de la web: son constantes de
compilación, no configuración de ejecución. La API, en cambio, sí lee su entorno
al arrancar (ver [RFC 0007](./rfcs/0007-modo-local-y-servidor.md)).

### Aprobación manual (opcional)

El job de despliegue usa el entorno `production` de GitHub. Si en
**Settings → Environments → production** se añade un revisor obligatorio, cada
despliegue se queda esperando aprobación después de pasar las verificaciones.

## Desplegar a mano

### Desde GitHub

`Actions → Deploy → Run workflow`. Tiene una casilla `skip_verify` para saltarse
las comprobaciones: existe solo para revertir una emergencia, y no debería
usarse para nada más.

### Desde el servidor, sin esperar al workflow

Mientras el despliegue automático no esté configurado —o si hace falta subir
algo ya—, el servidor se actualiza construyendo allí mismo, que es como se
levantó la primera vez:

```bash
ssh <servidor>
cd <carpeta-de-despliegue>

git pull

# 1. Construir. La web incrusta VITE_API_URL y VITE_AUTH_URL en el bundle,
#    así que tienen que estar en el .env del servidor ANTES de construir.
docker compose -f docker-compose.prod.yml --profile migrate --profile ai build

# 2. Migrar ANTES de levantar la API nueva. Este contenedor aplica primero las
#    de Better Auth y después las de TypeORM, y sale.
docker compose -f docker-compose.prod.yml run --rm migrate

# 3. Levantar
docker compose -f docker-compose.prod.yml --profile ai up -d

# 4. Comprobar que responde (API_PORT sale del .env del servidor)
curl -fsS "http://127.0.0.1:${API_PORT:-3000}/health"
```

Si `/health` no responde, el log dice por qué:

```bash
docker compose -f docker-compose.prod.yml logs --tail 50 api
```

> Los dos compose comparten nombre de proyecto (`navis-prod`) a propósito: así
> el despliegue automático adopta esta misma pila y su volumen de Postgres en
> vez de crear otro vacío. No cambies uno sin el otro.

## Volver a una versión anterior

El servidor guarda la etiqueta desplegada en `.deployed-tag`. Para retroceder a
mano, desde la carpeta de despliegue:

```bash
IMAGE_TAG=<sha-de-12-caracteres> docker compose -f docker-compose.deploy.yml up -d
```

Las imágenes se etiquetan con los 12 primeros caracteres del SHA del commit, así
que cualquier commit de `main` que llegara a desplegarse se puede recuperar.

## Limpieza del servidor

Cada despliegue deja atrás la imagen de la versión anterior y capas de
compilación. Sin limpiar, eso se acumula en gigas: tras los dos renombrados del
proyecto había casi 6 GB de imágenes con los nombres antiguos que ya no usaba
nadie.

El último paso del workflow ejecuta `scripts/limpiar-docker.sh` en el servidor:

| Qué borra                                                          | Qué no toca                     |
| ------------------------------------------------------------------ | ------------------------------- |
| Imágenes de los nombres anteriores del proyecto                    | Las imágenes de otros proyectos |
| Etiquetas viejas de este proyecto (menos la desplegada y `latest`) | La versión en marcha            |
| Capas huérfanas (`docker image prune`, **sin** `-a`)               | Volúmenes y contenedores        |
| Caché de compilación sin usar de más de 7 días                     | La caché reciente               |

Va **al final**, después de comprobar que la versión nueva responde: si algo
falla antes, las imágenes anteriores siguen ahí para volver atrás. Y si la
limpieza falla, el despliegue no se da por malo.

La lista de nombres anteriores está en `docker/marcas-anteriores.txt` y la
escribe `pnpm rename` sola. Nunca se usa `docker system prune -a`: este servidor
aloja más cosas.

A mano, desde la carpeta de despliegue:

```bash
bash scripts/limpiar-docker.sh --dry-run   # enseña qué borraría
bash scripts/limpiar-docker.sh             # lo borra
```
