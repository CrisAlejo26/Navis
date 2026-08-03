# syntax=docker/dockerfile:1.7
#
# PWA de PastorTools servida por nginx. Se construye desde la RAÍZ del monorepo:
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

COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter @pastortools/web... build

# --- Runtime -----------------------------------------------------------------
FROM nginx:1.29-alpine AS runtime

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1/ || exit 1
