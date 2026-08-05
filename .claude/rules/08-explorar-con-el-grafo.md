# Regla 8 — Explorar con el grafo, no fichero a fichero

Este repositorio está indexado en **codebase-memory** (grafo de código). Para
entender el proyecto —qué existe, quién llama a qué, dónde encaja algo nuevo—
se consulta el grafo. Abrir ficheros a ciegas gasta contexto y se queda corto.

El proyecto se llama **`D-Proyectos_personales-Navis`**.

## 1. El orden

1. **Actualiza el índice antes de mirar nada**, para no razonar sobre código
   viejo:

   ```
   index_repository(repo_path="D:/Proyectos_personales/Navis", mode="full")
   ```

   `mode="full"` es el que incluye `scripts/`, `docs/` y `packages/i18n`; los
   modos `moderate` y `fast` los dejan fuera. Si dudas de si hace falta,
   `index_status` te dice cuántos nodos hay y sobre qué commit se construyeron.

2. **Pregunta al grafo** (tabla de abajo).

3. **Lee ficheros solo al final**, cuando el grafo ya te ha dicho cuáles y por
   qué. Para editar hace falta haberlos leído: eso no cambia.

## 2. Qué preguntar y con qué

| Para                                       | Herramienta            |
| ------------------------------------------ | ---------------------- |
| Mapa general, paquetes, seams reales       | `get_architecture`     |
| Encontrar una definición por nombre o idea | `search_graph`         |
| Buscar texto y ver quién lo contiene       | `search_code`          |
| Leer una función concreta                  | `get_code_snippet`     |
| Quién llama a qué, impacto de un cambio    | `trace_path`           |
| Preguntas que no encajan en lo anterior    | `query_graph` (Cypher) |
| Qué has tocado y a qué afecta              | `detect_changes`       |
| Qué nodos y aristas hay                    | `get_graph_schema`     |

Detalles que ahorran vueltas:

- **`search_graph` antes que `get_code_snippet`**: este último quiere el
  `qualified_name` exacto; búscalo primero.
- **`search_graph` acepta tres modos** —`query` (texto, parte los camelCase),
  `name_pattern` (regex) y `semantic_query` (lista de palabras)— y se pueden
  combinar en la misma llamada.
- **Los resultados se truncan**: mira `has_more` y `total` en `search_graph`, y
  `total_results` frente al `limit` en `search_code`. Si no cabe, acota con
  `file_pattern` o `label` en vez de subir el límite a lo bruto.
- **`trace_path` sustituye a un grep de llamadas**: `direction="inbound"` para
  «quién usa esto», `"outbound"` para «de qué depende», y `mode="data_flow"`
  para seguir un valor.

## 3. Cómo es el grafo de este repositorio

Nodos: `Function`, `Method`, `Class`, `Interface`, `Type`, `Variable`,
`Module`, `File`, `Folder`, `Route`, `Decorator`. Aristas: `DEFINES`,
`IMPORTS`, `CALLS`, `USAGE`, `DECORATES`, `DEFINES_METHOD`, `INHERITS`,
`TESTS_FILE`, `SEMANTICALLY_RELATED`.

Propiedades que valen para filtrar: `qualified_name`, `file_path`, `lines`,
`complexity`, `is_test`, `is_exported`, y `decorators` / `decorator_tags`, que
es donde aparecen los `@Injectable()`, `@Module()` y compañía de la API.

## 4. Recetas que funcionan aquí

```cypher
-- Todos los endpoints, sin abrir un controlador.
-- OJO: hoy los nodos Route están incompletos — ver §5. Para las rutas
-- añadidas después de la RFC 0002, la consulta fiable es la de abajo.
MATCH (m:Method) WHERE m.file_path ENDS WITH '.controller.ts'
RETURN m.qualified_name AS metodo, m.file_path AS fichero ORDER BY fichero

-- Los controladores de la API (el nombre es más fiable que el decorador,
-- porque @ApiTags se cuela primero en decorator_tags)
MATCH (c:Class) WHERE c.name =~ '.*Controller'
RETURN c.name AS nombre, c.file_path AS fichero

-- Candidatos a incumplir la Regla 6
MATCH (n) WHERE (n:Function OR n:Method) AND n.is_test = false AND n.lines > 60
RETURN n.name AS nombre, n.lines AS lineas, n.file_path AS fichero
```

Y sin Cypher: `trace_path(function_name="createApiClient",
direction="inbound")` responde en un segundo que lo usan `apps/web/src/lib/api`
y `apps/mobile/src/lib/api` — que es justo la pregunta de la Regla 1 antes de
tocar un paquete compartido.

Antes de dar por cerrado un cambio grande, `detect_changes(since="HEAD~1")`
enseña qué se ha movido y qué cuelga de ello.

## 5. Lo que el grafo no sabe

- **No indexa** `node_modules`, `dist`, `.turbo`, `.git` ni `data/`.
- **La configuración suelta no está en el grafo** como código: `.env.example`,
  `docker-compose*.yml`, los workflows, `brand.json`. Ahí `Read` y `Grep` van
  igual de bien.
- **Los ADR del proyecto viven en `docs/adr/`**, no en el almacén de ADR del
  MCP. Léelos como ficheros.
- **Los nodos `Route` están incompletos, y es la única laguna del grafo.**
  Ficheros, funciones, clases, métodos y llamadas sí están todo: 608 ficheros
  indexados, con `docs/`, `scripts/` y `packages/i18n` dentro. Pero de rutas
  solo hay **catorce**, sin `file_path`, y ninguna de creyentes, notas, dones
  ni audios — el extractor no las saca de los controladores de Nest con
  versionado por URI. La superficie de un módulo se pregunta por sus métodos
  (§4), no por sus `Route`. Si algún día `MATCH (r:Route)` devuelve las
  cincuenta y pico reales, esta nota sobra.
- **Un índice viejo miente con mucha seguridad.** Si has añadido, movido o
  borrado ficheros y vas a seguir explorando, **reindexa**. Hay un hook de
  `SessionStart` en `.claude/settings.local.json` que lo hace al abrir sesión;
  durante la sesión, después de tocar ficheros, lo reindexas tú.

## 6. Cuándo sí vale ir directo

- Sabes exactamente el fichero y la línea.
- Es un fichero excluido del índice o configuración suelta (arriba).
- Es una comprobación de una sola cosa: leerla cuesta menos que preguntarla.

> Primero el grafo, después el fichero.
