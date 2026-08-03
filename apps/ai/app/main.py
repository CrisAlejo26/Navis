"""Esqueleto del microservicio de IA de Fidus.

Todavía no hace inferencia: expone `/health` para que el contenedor se declare
sano y documenta el contrato que la API de NestJS ya espera
(`apps/api/src/ai/providers/python-service.provider.ts`).

Cuando se implemente, este servicio hará el trabajo pesado (modelos locales,
embeddings, RAG sobre las notas pastorales) y la API de Nest seguirá siendo el
único punto de entrada de los clientes.
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="Fidus AI",
    version="0.1.0",
    description="Microservicio de IA (esqueleto)",
)


class HealthResponse(BaseModel):
    status: str = "ok"
    ready: bool = Field(
        default=False,
        description="False mientras el servicio no tenga ningún modelo cargado.",
    )


class CompletionRequest(BaseModel):
    prompt: str
    system: str | None = None
    max_tokens: int = 1024
    locale: str = "es"


class CompletionResponse(BaseModel):
    text: str
    model: str


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()


@app.post("/v1/complete", response_model=CompletionResponse, status_code=501)
def completions(_request: CompletionRequest) -> CompletionResponse:
    """Contrato acordado con la API. Sin implementar todavía."""
    raise NotImplementedError("El microservicio de IA aún no está implementado")
