# PastorTools — microservicio de IA (esqueleto)

Todavía **no está implementado**: solo existen el contrato HTTP y el contenedor,
para que añadirlo más adelante no obligue a tocar el resto del monorepo.

## Por qué un servicio aparte

La API de NestJS ya sabe hablar con dos proveedores de IA
(`apps/api/src/ai/`): Anthropic por HTTP, y este servicio. La lógica ligera
(llamar a un modelo alojado) se queda en Node; lo que necesita el ecosistema
Python — embeddings locales, transcripción de audio, RAG sobre las notas
pastorales, modelos propios — vivirá aquí.

Los clientes (web, móvil, escritorio) **nunca** llaman a este servicio: hablan
siempre con la API de Nest, que es quien tiene la sesión y los permisos.

## Contrato

| Método | Ruta           | Estado                                 |
| ------ | -------------- | -------------------------------------- |
| GET    | `/health`      | Implementado (devuelve `ready: false`) |
| POST   | `/v1/complete` | Declarado, responde 501                |

`POST /v1/complete` recibe `{ prompt, system?, maxTokens?, locale? }` y debe
devolver `{ text, model }`. Es lo que espera
`apps/api/src/ai/providers/python-service.provider.ts`.

## Arrancarlo

Está bajo el perfil `ai` de compose, así que no se levanta por defecto:

```bash
docker compose --profile ai up ai
```

Y en la API:

```bash
AI_ENABLED=true
AI_PROVIDER=python-service
AI_SERVICE_URL=http://localhost:8000
```

## Desarrollo local sin Docker

```bash
cd apps/ai
python -m venv .venv && .venv/Scripts/activate   # en Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```
