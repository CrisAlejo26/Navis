# syntax=docker/dockerfile:1.7
#
# API de PastorTools. Se construye desde la RAÍZ del monorepo:
#   docker build -f docker/api.Dockerfile .

FROM node:24-slim AS base
RUN corepack enable
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"

# --- Build -------------------------------------------------------------------
FROM base AS build
WORKDIR /repo

# better-sqlite3 se compila si no hay binario precompilado para la plataforma.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY . .

# `--filter` deja fuera la web, el móvil y el escritorio: ni Playwright ni Expo
# pintan nada en la imagen de la API.
# HUSKY=0: el `prepare` de la raíz instala los hooks de git, y aquí no hay .git.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store   HUSKY=0 pnpm install --frozen-lockfile --filter @pastortools/api...
RUN pnpm --filter @pastortools/api... build

# `pnpm deploy` deja en /app el proyecto con SOLO sus dependencias de
# producción y los paquetes del workspace ya resueltos, sin symlinks.
RUN pnpm deploy --legacy --filter @pastortools/api --prod /app

# --- Migraciones -------------------------------------------------------------
# Imagen de un solo uso que se lanza ANTES de arrancar la nueva versión de la
# API. Se queda en la etapa `build` a propósito: conserva el CLI de Better Auth
# y tsx, así que ejecuta exactamente el mismo `pnpm db:migrate` que en local y
# no hay un segundo camino de migración que pueda divergir.
FROM build AS migrate
WORKDIR /repo
CMD ["pnpm", "db:migrate"]

# --- Runtime -----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app

# El usuario se crea ANTES de copiar, y la copia ya asigna el propietario. Un
# `chown -R` posterior reescribiría cada fichero en una capa nueva y duplicaría
# el tamaño de la imagen.
RUN useradd --create-home --uid 10001 pastortools \
  && mkdir -p /app/data \
  && chown pastortools:pastortools /app/data

COPY --from=build --chown=pastortools:pastortools /app ./

USER pastortools

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{process.exit(r.ok?0:1)}).catch(()=>{process.exit(1)})"

CMD ["node", "dist/main.js"]
