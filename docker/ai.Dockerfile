# syntax=docker/dockerfile:1.7
#
# Microservicio de IA (Python). Todavía es un esqueleto: ver apps/ai/README.md.
# Solo se levanta con el perfil `ai` de docker compose.

FROM python:3.14-slim AS base
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /srv

# El proyecto entero antes de instalar: hatchling necesita el paquete `app` y
# el README que declara el pyproject para generar los metadatos. Copiar solo el
# pyproject cachea mejor las capas, pero aquí no llega a construir.
COPY apps/ai/ ./
RUN pip install --upgrade pip && pip install .

RUN useradd --create-home --uid 10002 fidus
USER fidus

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health').status==200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
