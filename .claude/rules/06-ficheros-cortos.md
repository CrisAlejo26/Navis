# Regla 6 — Ficheros cortos (objetivo: ≤ 100 líneas)

Ningún fichero de código debería pasar de unas **100 líneas**. Es una guía, no
un número rígido: se pueden pasar unas pocas cuando partirlo lo empeoraría,
pero no por mucho. Un fichero bastante más largo suele estar haciendo
demasiado.

- **Una responsabilidad por fichero.** Si acumula varias, sepáralas:
  componentes, hooks, utilidades y tipos a ficheros propios.
- **Extraer en vez de inflar.** Antes de añadir líneas, mueve lo común a
  `packages/` o a `src/lib`, la interfaz a un componente y el estado a un hook
  o a un store. Es la Regla 1 vista desde otro ángulo.
- **En la API**, un controlador que crece pide un servicio; un servicio que
  crece pide separar por caso de uso. Las entidades se quedan finas: la lógica
  no vive en ellas.
- **En la interfaz**, divide las pantallas grandes en subcomponentes y saca la
  lógica a hooks.

## Excepciones razonables

No cuentan para el límite:

- Ficheros **generados**: los iconos, `packages/theme/src/logo/encuadrado/`,
  `apps/desktop/src-tauri/icons/`, `apps/api/src/metadata.ts`, cualquier `dist/`.
- **Datos y configuración**: las traducciones de `packages/i18n/src/locales/`,
  los tokens de `packages/theme/src/tokens.css`, los `docker-compose*.yml`, los
  workflows, los `tsconfig`.
- **Migraciones** de la base de datos: describen un esquema y se leen enteras.

## Verificación

Al terminar, mira que los ficheros que has tocado sigan dentro del objetivo. Si
alguno se ha disparado, refactorízalo antes de darlo por hecho.

> Si un fichero necesita muchas más de 100 líneas, probablemente deberían ser
> varios.
