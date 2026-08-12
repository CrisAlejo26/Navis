# RFC 0007: Modo local y servidor compartido

- **Estado**: Implementado (la parte de infraestructura)
- **Fecha**: 2026-08-03
- **Apps afectadas**: api / web / mobile / desktop
- **Depende de**: —

## Problema

Un pastor que se descarga Navis quiere abrirlo y usarlo, no montar un
servidor. Pero un equipo de una iglesia con varias personas necesita que todos
vean los mismos creyentes, el mismo calendario y las mismas notas.

Son dos escenarios muy distintos y no queremos dos productos.

## Alcance

Entra: elegir entre base de datos **local** y **compartida** mediante variables
de entorno, validadas al arrancar.

No entra: sincronización entre el modo local y el compartido. Si alguien empieza
en local y luego monta un servidor, hoy tendría que migrar sus datos a mano.
Un modo _offline-first_ con sincronización es otra propuesta.

## Cómo se elige

Una sola variable en el `.env` de la API:

| `DB_DRIVER`            | Qué usa                        | Para quién                                        |
| ---------------------- | ------------------------------ | ------------------------------------------------- |
| `sqlite` (por defecto) | Un fichero en `DB_SQLITE_PATH` | Una persona, un ordenador. Sin Docker ni servidor |
| `postgres`             | El servidor de `POSTGRES_*`    | Un equipo. Todas las apps contra los mismos datos |

Las credenciales de Postgres solo se exigen cuando `DB_DRIVER=postgres`: el
esquema de zod lo comprueba con un `superRefine`, de modo que en modo local no
hace falta ni escribirlas.

Los clientes no hablan con la base de datos, sino con la API, así que lo único
que configuran es a qué API apuntan:

| App        | Variables                                                               |
| ---------- | ----------------------------------------------------------------------- |
| Web        | `VITE_API_URL`, `VITE_AUTH_URL`                                         |
| Móvil      | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_AUTH_URL`, `EXPO_PUBLIC_APP_SCHEME` |
| Escritorio | Las de la web: empaqueta ese mismo bundle                               |

## Por qué por variables de entorno y no por una pantalla de ajustes

Una pantalla de «pon aquí la URL y el token» parece más cómoda, pero:

- La URL de la API se necesita **antes** de tener sesión, así que no puede vivir
  en la base de datos ni depender de estar autenticado.
- En web y escritorio, Vite incrusta la URL en el bundle al compilar; una
  pantalla daría a entender que se puede cambiar en caliente y no es así.
- El token no debe estar en una caja de texto: la sesión la emite Better Auth y
  viaja en una cookie httpOnly (o en el almacén seguro del móvil). Pedir un
  token a mano sería un mecanismo paralelo, más frágil y menos seguro.

## Validación

Todo el entorno se valida con **zod** en el arranque, no cuando se usa:

- `apiEnvSchema` en `packages/shared/src/env.ts` — la API muere al arrancar con
  la lista completa de variables mal puestas.
- `webEnvSchema` y `mobileEnvSchema` — mismo contrato para los clientes.
- `parseEnv()` agrupa todos los errores en un solo mensaje en vez de reventar
  con el primero.

## Consideraciones

- **Privacidad**: en modo local los datos no salen del equipo. Es el argumento
  para que sea el modo por defecto: las notas pastorales son sensibles.
- **Migraciones**: la migración inicial está escrita con la API `Table` de
  TypeORM, no con SQL literal, para que valga en los dos motores. Cualquier
  migración nueva debe hacer lo mismo y probarse contra ambos.
- **Escritorio**: Tauri empaqueta la web, así que hereda su configuración. Una
  instalación de escritorio «todo en uno» necesita además que la API corra en la
  misma máquina; ese empaquetado conjunto queda para más adelante.

## Alternativas descartadas

- **Solo Postgres**: obliga a Docker para probar el proyecto. Barrera de entrada
  demasiado alta para un proyecto pensado para pastores, no para desarrolladores.
- **Solo SQLite con réplica**: soluciones como LiteFS o Turso resolverían el
  caso compartido sin Postgres, pero añaden un servicio propio y un modelo de
  consistencia que hay que entender. No compensa todavía.
- **Pantalla de ajustes con URL y token**: descartada por lo explicado arriba.

## Criterios de aceptación

- [x] `pnpm install && pnpm db:migrate && pnpm db:seed` funciona sin Docker.
- [x] Cambiar `DB_DRIVER=postgres` y repetir esos comandos funciona igual.
- [x] La API falla al arrancar, con un mensaje claro, si falta una variable.
- [ ] El README explica los dos modos en la primera pantalla.
