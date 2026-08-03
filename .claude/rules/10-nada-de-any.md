# Regla 10 — Aquí no entra `any`

**Nunca se escribe `any`.** Ni en código, ni en tests, ni «temporalmente», ni
para salir del paso con una librería que tipa mal. Un `any` apaga el compilador
justo donde más falta hace, y el fallo que tapa aparece en producción.

Esto vale para todo el repositorio: API, web, móvil, escritorio, paquetes
compartidos y los scripts de `scripts/`.

## 1. Lo que se usa en su lugar

| Situación                                         | En vez de `any`                               |
| ------------------------------------------------- | --------------------------------------------- |
| No sabes qué llega (JSON, `catch`, entrada libre) | `unknown` + comprobar antes de usarlo         |
| Un dato con forma conocida                        | Su interfaz, su `type` o su esquema zod       |
| Vale cualquier objeto                             | `Record<string, unknown>`                     |
| Una función que solo se pasa por ahí              | `(...args: never[]) => unknown`               |
| Algo genérico de verdad                           | Un parámetro de tipo `<T>` con su restricción |
| Una librería sin tipos                            | Un `.d.ts` propio con lo que usas de ella     |

`unknown` es la respuesta correcta casi siempre: acepta lo mismo que `any` pero
te obliga a comprobar qué es antes de tocarlo, que es justo lo que quieres.

## 2. Los primos de `any`

Prohibidos por el mismo motivo, aunque el linter no los llame igual:

- **`as any`** y **`as unknown as X`** para forzar una conversión. La única
  excepción son los dobles de test (`{ query } as unknown as DataSource`), donde
  se está montando a mano un objeto que solo implementa lo que el test usa: eso
  va con un comentario que lo diga.
- **`@ts-ignore`** y **`@ts-expect-error`** sin explicación. Si de verdad hace
  falta, `@ts-expect-error` con el motivo escrito al lado y nunca `@ts-ignore`.
- **`Function`**, **`object`** y **`{}`** como tipos: no dicen nada.
- **`!` para callar al compilador** (`user!.name`) cuando lo que toca es
  comprobar si existe. Es un `any` de una sola propiedad.
- **Genéricos sin restringir** que acaban resolviendo a `any`.
- **`JSON.parse` sin validar**: devuelve `any`. Se valida con el esquema zod de
  `packages/shared` (Regla 1).

## 3. En las fronteras

Donde el tipo llega de fuera, se **valida**, no se declara y ya:

- **Lo que entra en la API**: DTO con `class-validator` (Nest lo necesita para
  validar y documentar).
- **Lo que consumen los clientes**: esquema zod en `packages/shared`.
- **La respuesta de un `fetch`**: pasa por `createApiClient`, que ya devuelve el
  tipo que le pidas; el que se lo pide es quien tiene que acertar.
- **Las variables de entorno**: `parseEnv` con su esquema, nunca
  `process.env.LO_QUE_SEA` a pelo.
- **Un `catch`**: la variable es `unknown`. Se comprueba con `instanceof` o con
  una función `isAlgo` antes de leerle nada.

## 4. Lo que se exporta va tipado a mano

Dentro de una función, la inferencia hace su trabajo. En la frontera de un
módulo —lo que otro fichero importa— la firma se escribe: parámetros y valor de
retorno. Así un cambio interno que rompa el contrato se ve en el sitio donde
está el contrato y no tres ficheros más allá (Regla 1).

## 5. Cómo se hace cumplir

- ESLint corre con `@typescript-eslint` en modo _type-checked_: `no-explicit-any`
  y toda la familia `no-unsafe-*` (`no-unsafe-return`, `no-unsafe-assignment`,
  `no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-argument`) son
  **errores**, no avisos.
- `strict` está activado en `tsconfig.base.json` y no se relaja por proyecto.
- `pnpm check` no pasa si queda alguno.

Si el linter marca un `no-unsafe-*`, el problema **no** es la regla: hay un
`any` entrando desde algún sitio. Búscalo y tipa el origen, no silencies el
aviso.

## 6. Cuando la librería tipa mal

Pasa —`class-transformer` da `any` en `TransformFnParams`, y hay más—. La salida
es siempre la misma: **acotar el `any` en un solo sitio** y que del resto del
código salga ya tipado.

```ts
// Las normalizaciones, tipadas: `TransformFnParams` trae `value` como `any`.
const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;
```

Una función pequeña, con nombre, comentada, y el resto del fichero limpio.

## 7. Antes de darlo por hecho

- ¿Hay algún `any`, `as any` o `@ts-ignore` en lo que has tocado?
- ¿Lo que entra de fuera se valida, y no solo se declara?
- ¿Lo que exportas lleva su firma escrita?
- ¿`pnpm lint` sale sin errores **ni avisos** de `no-unsafe-*`?

> Si necesitas `any`, lo que necesitas es entender mejor el dato.
