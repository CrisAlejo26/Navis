#!/usr/bin/env bash
#
# Limpia lo que los despliegues dejan atrás en el servidor:
#
#   · las imágenes de versiones anteriores de este proyecto,
#   · las imágenes que quedaron colgadas de los renombrados del proyecto,
#   · las capas huérfanas y la caché de compilación que ya no usa nadie.
#
# Es deliberadamente conservador: el servidor aloja otros proyectos, así que
# solo toca imágenes cuyo nombre pertenece a este y caché que Docker ya da por
# no utilizada. Nunca `docker system prune -a`.
#
# Uso:
#   ./limpiar-docker.sh                    # limpia de verdad
#   ./limpiar-docker.sh --dry-run          # solo enseña qué borraría
#
# Variables:
#   MARCA           slug actual (por defecto, el de brand.json)
#   MARCAS_ANTERIORES  slugs viejos separados por espacios
#                      (por defecto, docker/marcas-anteriores.txt)
#   REPO_IMAGENES   repositorio del registro, p. ej. crisalejo26/navis
#   TAG_ACTUAL      etiqueta desplegada, que no se borra
#   RETENCION_CACHE antigüedad a partir de la cual se tira la caché (720h)

set -euo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAIZ="$(dirname "$AQUI")"

SECO=0
[ "${1:-}" = "--dry-run" ] && SECO=1

# --- De qué marca hablamos ---------------------------------------------------

if [ -z "${MARCA:-}" ] && [ -f "$RAIZ/brand.json" ]; then
  MARCA="$(sed -n 's/.*"slug"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$RAIZ/brand.json")"
fi
MARCA="${MARCA:-navis}"

if [ -z "${MARCAS_ANTERIORES:-}" ] && [ -f "$RAIZ/docker/marcas-anteriores.txt" ]; then
  MARCAS_ANTERIORES="$(grep -v '^[[:space:]]*#' "$RAIZ/docker/marcas-anteriores.txt" | tr '\n' ' ')"
fi

RETENCION_CACHE="${RETENCION_CACHE:-720h}"

echo "== Antes =="
docker system df

borrar() {
  # $@ = imágenes (repo:tag o id). `docker rmi` sin -f: si algo está en uso,
  # se queda, que es exactamente lo que queremos.
  if [ "$#" -eq 0 ]; then
    echo "  nada que borrar"
    return 0
  fi
  if [ "$SECO" -eq 1 ]; then
    printf '  (simulado) %s\n' "$@"
  else
    docker rmi "$@" 2>&1 | sed 's/^/  /' || true
  fi
}

# --- 1. Imágenes de marcas anteriores ---------------------------------------
# Son las que dejó un renombrado: mismo contenido, nombre viejo. Aquí es donde
# estaban los gigas.

for vieja in ${MARCAS_ANTERIORES:-}; do
  [ -z "$vieja" ] && continue
  echo "== Imágenes de la marca anterior «$vieja» =="
  sobras=()
  mapfile -t sobras < <(
    docker images --format '{{.Repository}}:{{.Tag}}' |
      grep -E "(^|/)${vieja}(-|_|/|:)" || true
  )
  borrar ${sobras[@]+"${sobras[@]}"}
done

# --- 2. Versiones viejas de la marca actual ---------------------------------
# Del registro se conservan la etiqueta desplegada y `latest`; el resto sobra.

if [ -n "${REPO_IMAGENES:-}" ]; then
  echo "== Etiquetas antiguas de $REPO_IMAGENES =="
  CONSERVAR="${TAG_ACTUAL:-$(cat "$RAIZ/.deployed-tag" 2>/dev/null || echo '')}"
  viejas=()
  mapfile -t viejas < <(
    docker images --format '{{.Repository}}:{{.Tag}}' |
      grep -E "/${REPO_IMAGENES}/" |
      grep -v ':latest$' |
      { [ -n "$CONSERVAR" ] && grep -v ":${CONSERVAR}$" || cat; } || true
  )
  borrar ${viejas[@]+"${viejas[@]}"}
fi

# --- 3. Capas huérfanas y caché de compilación ------------------------------
# `image prune` sin -a: solo lo que ya no tiene nombre (dangling), nunca las
# imágenes de otros proyectos del servidor.

echo "== Capas huérfanas =="
if [ "$SECO" -eq 1 ]; then
  docker image ls --filter dangling=true --format '  (simulado) {{.ID}} {{.Size}}'
else
  docker image prune -f | sed 's/^/  /'
fi

echo "== Caché de compilación sin usar (más de $RETENCION_CACHE) =="
if [ "$SECO" -eq 1 ]; then
  docker builder du 2>/dev/null | tail -n 1 | sed 's/^/  /' || true
else
  docker builder prune -f --filter "until=$RETENCION_CACHE" | tail -n 2 | sed 's/^/  /'
fi

echo "== Después =="
docker system df
