# ADR 0002: NestJS + TypeORM para la API, con un microservicio Python para IA

- **Estado**: Aceptada
- **Fecha**: 2026-08-02

## Contexto

La API podía ser FastAPI (Python) o NestJS (TypeScript). El proyecto tendrá
funciones de IA, terreno donde Python tiene mejor ecosistema.

## Decisión

**NestJS 11 + TypeORM 1** para la API de dominio, y un microservicio **Python**
(`apps/ai`) reservado para lo que requiera ese ecosistema.

Lo que inclinó la balanza es que los tipos y los esquemas de validación se
comparten con los tres clientes: `packages/shared` define una vez el esquema
zod del login y lo usan el formulario web, el móvil y el servidor. Con Python
habría dos definiciones que mantener sincronizadas a mano.

## Consecuencias

- Un único lenguaje en todo el monorepo: mismas herramientas de lint, formato y
  test en todas partes.
- La IA sencilla (llamar a un modelo alojado) se queda en Node. Lo que necesite
  el ecosistema Python vive en `apps/ai`, detrás de un contrato HTTP que la API
  de Nest ya sabe consumir (`AiProvider`).
- Los clientes nunca hablan con el servicio de IA: siempre con la API de Nest,
  que es quien tiene sesión y permisos.
- TypeORM 1 es un salto de major desde 0.3: las migraciones se escriben con la
  API `Table`, no con SQL literal, también porque tienen que valer en SQLite y
  en Postgres (ver ADR 0006).
