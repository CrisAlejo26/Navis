# Regla 8 — Explorar con el grafo, no fichero a fichero

Este repositorio está indexado en **codebase-memory** (grafo de código). Para
entender el proyecto —qué existe, quién llama a qué, dónde encaja algo nuevo—
se consulta el grafo. Abrir ficheros a ciegas gasta contexto y se queda corto.

El proyecto se llama **`D-Proyectos_personales-Navis`**.

## El orden

1. **Actualiza el índice antes de mirar nada**, para no razonar sobre código
   viejo:

   ```
   index_repository(repo_path="D:/Proyectos_personales/Navis", mode="full")
   ```

   `mode="full"` es el que incluye `scripts/`, `docs/` y `packages/i18n`; los
   modos `moderate` y `fast` los dejan fuera.

2. **Pregunta al grafo**:

   | Para                                    | Herramienta                  |
   | --------------------------------------- | ---------------------------- |
   | Mapa general, paquetes, seams reales    | `get_architecture`           |
   | Buscar código y ver quién lo contiene   | `search_code`                |
   | Ver una función concreta                | `get_code_snippet`           |
   | Quién llama a qué, impacto de un cambio | `query_graph` · `trace_path` |
   | Qué ha cambiado y a qué afecta          | `detect_changes`             |

3. **Lee ficheros solo al final**, cuando el grafo ya te ha dicho cuáles y por
   qué. Para editar hace falta haberlos leído: eso no cambia.

## Cuándo sí vale ir directo

- Sabes exactamente el fichero y la línea.
- Es un fichero que el índice excluye: `node_modules`, `dist`, `.turbo`,
  `.git`, `data/`.
- Es configuración suelta (`.env.example`, `docker-compose*.yml`, workflows):
  ahí `Read` y `Grep` van igual de bien.

## Después de tocar código

Si has añadido, movido o borrado ficheros y vas a seguir explorando,
**reindexa**. El grafo no se entera solo, y un grafo desactualizado miente con
mucha seguridad.

> Primero el grafo, después el fichero.
