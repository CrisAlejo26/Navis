# Regla 6 — Ficheros cortos (objetivo: ≤ 100 líneas)

Ningún fichero de código debería pasar de unas **100 líneas**. Es una guía, no
un número rígido: se pueden pasar unas pocas cuando partirlo lo empeoraría,
pero no por mucho. Un fichero bastante más largo suele estar haciendo
demasiado, y eso se paga al leerlo, al probarlo y al cambiarlo.

## 1. La idea

**Una responsabilidad por fichero.** Si acumula varias, sepáralas: componentes,
hooks, utilidades y tipos a ficheros propios. Y **extraer antes que inflar**:
antes de añadir líneas, mira si eso ya debería vivir en `packages/` o en
`src/lib` (Regla 1).

## 2. Cómo se parte cada cosa

| Lo que crece           | Se parte en                                         |
| ---------------------- | --------------------------------------------------- |
| Pantalla o ruta        | Subcomponentes + un hook con la lógica              |
| Componente con estado  | Componente de vista + hook `use…`                   |
| Hook que hace de todo  | Varios hooks pequeños que se componen               |
| Controlador de la API  | Un servicio (el controlador solo recibe y responde) |
| Servicio de la API     | Un fichero por caso de uso                          |
| Entidad de TypeORM     | Nada: se queda fina, la lógica va al servicio       |
| Utilidades             | Un fichero por tema, con nombre propio              |
| Configuración de rutas | Un módulo de rutas por área                         |

En la interfaz, la regla práctica: si un `return` no cabe en una pantalla de
editor, hay un subcomponente ahí dentro esperando salir.

## 3. Señales de que toca partir

- El fichero tiene comentarios de sección (`// ---- helpers ----`) para
  orientarse dentro.
- Mezcla obtención de datos, estado y presentación.
- Sus imports vienen de cinco sitios distintos que no tienen nada que ver.
- Una función pasa de unas 30 líneas o tiene tres niveles de anidamiento.
- Al describir qué hace el fichero necesitas una «y»: «pinta la lista **y**
  valida el formulario».

## 4. Excepciones razonables

No cuentan para el límite:

- Ficheros **generados**: los iconos, `packages/theme/src/logo/encuadrado/`,
  `apps/desktop/src-tauri/icons/`, `apps/api/src/metadata.ts`, cualquier
  `dist/`.
- **Datos y configuración**: las traducciones de `packages/i18n/src/locales/`,
  los tokens de `packages/theme/src/tokens.css`, el contrato de entorno de
  `packages/shared/src/env.ts`, los `docker-compose*.yml`, los workflows, los
  `tsconfig`.
- **Migraciones** de la base de datos: describen un esquema y se leen enteras.
- **Los scripts de `scripts/`**: son herramientas de línea de órdenes que se
  leen de arriba abajo. Aun así se parten cuando crecen —de `gen-icons.mjs`
  salió `brand-logo.mjs`—, y sus tests van aparte.
- **Los tests** siguen el mismo espíritu, pero no se trocean a la fuerza: un
  `describe` largo y plano se lee mejor que tres ficheros que hay que cruzar.

## 5. Dónde va lo que sacas

Al sitio que dice la Regla 1: a `packages/` si lo usa más de una app, a
`apps/<app>/src/lib` si es de una sola, a un componente si es interfaz, a un
hook o a un store si es estado. Sacar algo a un fichero nuevo **no** es
motivo para exportarlo: si solo lo usa su vecino, que quede sin exportar o en
la misma carpeta.

## 6. Cómo está el repositorio

Cuando se escribió esta regla, en `apps/` y `packages/` el fichero de código
más largo era `apps/web/src/routes/app-layout.tsx`, con 101 líneas. Todo lo
demás que pasa de 100 son scripts o configuración. Ese es el listón: si tu
cambio deja algo muy por encima, es tu cambio el que se sale, no el listón el
que está mal puesto.

## 7. Verificación

Al terminar, mira que los ficheros que has tocado sigan dentro del objetivo:

```powershell
git diff --name-only HEAD | Where-Object { $_ -match '\.(ts|tsx|mjs|rs)$' } |
  ForEach-Object { "{0,4}  {1}" -f (Get-Content $_ | Measure-Object -Line).Lines, $_ }
```

Si alguno se ha disparado, refactorízalo antes de darlo por hecho.

> Si un fichero necesita muchas más de 100 líneas, probablemente deberían ser
> varios.
