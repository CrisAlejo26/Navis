# syntax=docker/dockerfile:1.7
#
# PWA de Fidus servida por nginx. Se construye desde la RAÍZ del monorepo:
#   docker build -f docker/web.Dockerfile .
#
# OJO: Vite incrusta las variables VITE_* en el bundle EN TIEMPO DE BUILD. Para
# apuntar a otro servidor hay que reconstruir la imagen, no basta con cambiar el
# entorno del contenedor.

FROM node:24-slim AS build
RUN corepack enable
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /repo

ARG VITE_API_URL=http://localhost:3000/api/v1
ARG VITE_AUTH_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_URL=$VITE_AUTH_URL

# El monorepo usa `node-linker=hoisted` (obligatorio para Metro/Expo), así que
# pnpm deja en la raíz la UNIÓN de dependencias del workspace por mucho que se
# filtre; entre ellas better-sqlite3, que se compila. De ahí el compilador: vive
# solo en esta etapa y no llega a la imagen final.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  HUSKY=0 pnpm install --frozen-lockfile --filter @fidus/web...
RUN pnpm --filter @fidus/web... build

# --- Runtime -----------------------------------------------------------------
FROM nginx:1.29-alpine AS runtime

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1/ || exit 1
