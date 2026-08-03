# Regla 1 — Reutilizar antes de escribir, y escribir para que se lea

Cuatro clientes sobre paquetes compartidos. Lo que se duplica se desincroniza,
y lo que se abstrae de más se paga en cada cambio. Esta regla dice dónde buscar
antes de escribir, dónde poner lo nuevo y con qué patrones resolverlo.

## 1. Antes de escribir, busca

Primero el grafo (Regla 8: `search_code`, `get_architecture`), después el
fichero. Si algo parecido ya existe, se extiende; no se clona.

| Necesitas                                                 | Míralo en                      |
| --------------------------------------------------------- | ------------------------------ |
| Tipos, esquemas zod, constantes, contrato del entorno     | `packages/shared`              |
| Colores, radios, store de tema, `themeColorHex`, logo     | `packages/theme`               |
| Textos y la instancia de i18next                          | `packages/i18n`                |
| Cliente HTTP tipado, `queryKeys`, hooks de TanStack Query | `packages/api-client`          |
| Guards, decoradores, filtros y `BaseEntity` de la API     | `apps/api/src/common`          |
| Tipos de columna que cambian según el motor               | `apps/api/src/database`        |
| Botón, tarjeta, campo de texto… de una app                | `apps/<app>/src/components/ui` |
| `cn`, cliente de API, i18n y tema ya cableados de una app | `apps/<app>/src/lib`           |

## 2. Dónde va lo nuevo

1. ¿Lo usan **dos o más apps**? Va a `packages/`.
2. ¿Es **lógica, tipos, textos o tokens**? Se comparte.
3. ¿Es **interfaz**? No se comparte entre web y móvil: son DOM y React Native.
   Se comparte el hook, el tipo y la clave de traducción; el JSX se escribe dos
   veces. `PlaceholderScreen` (móvil) y `routes/placeholder.tsx` (web) están
   duplicados a propósito.
4. ¿Es de **una sola app**? `apps/<app>/src/lib` o su carpeta de componentes.

Direcciones permitidas: apps → packages → `shared`. **Ningún paquete importa de
`apps/`**, y `shared` no importa de ningún otro paquete. Si te hace falta ir al
revés, es que la dependencia está mal puesta: invierte la dirección inyectando
lo que cambia (punto 3).

## 3. Patrones que ya usa este repositorio

Úsalos antes de inventar otro. Cada uno tiene un ejemplo vivo que leer.

| Patrón                      | Para qué                                           | Ejemplo                                      |
| --------------------------- | -------------------------------------------------- | -------------------------------------------- |
| **Adaptador de plataforma** | Una lógica, varios entornos                        | `createThemeStore(adapter)`, `createI18n`    |
| **Factoría configurable**   | Elegir implementación en el arranque               | `AI_PROVIDER` en `ai.module.ts`              |
| **Interfaz + token**        | Punto de extensión sin acoplar al llamador         | `AiProvider` en `ai.types.ts`                |
| **Fábrica con opciones**    | Cliente reutilizable con dependencias inyectadas   | `createApiClient({ fetchImpl, getLocale… })` |
| **Contrato único en zod**   | Un solo sitio define la forma del dato             | `packages/shared/src/schemas`, `env.ts`      |
| **Claves centralizadas**    | Invalidar caché sin literales sueltos              | `queryKeys`                                  |
| **Constante derivada**      | Absorber una diferencia de entorno en un sitio     | `TIMESTAMP` y `NOW` en `column-types.ts`     |
| **Clase base acotada**      | Columnas transversales, sin lógica                 | `BaseEntity`                                 |
| **Mapa de variantes**       | Estilos por variante sin condicionales encadenados | `variants`/`sizes` en `components/ui/button` |
| **Capas en la API**         | Controlador fino, servicio con la lógica           | `profiles.controller` → `profiles.service`   |
| **DTO en la frontera**      | Validar lo que entra y documentar Swagger          | `dto/update-profile.dto.ts`                  |
| **Hook con dependencias**   | Compartir consultas entre web y móvil              | `useProfile(api)`                            |

Detalles que importan de estos patrones:

- **Adaptador**: la interfaz declara solo lo que cambia (`storage`,
  `getSystemTheme`, `applyTheme`), y el núcleo no sabe en qué plataforma corre.
  Es la forma preferida de resolver «esto es distinto en móvil».
- **Factoría**: se justifica cuando hay **dos implementaciones reales**. El
  módulo de IA la tiene porque existen Anthropic y el microservicio Python; no
  se monta una factoría para un único proveedor.
- **Inyectar en vez de importar**: `createApiClient` recibe `fetchImpl` y
  `useProfile` recibe el cliente por parámetro. Eso es lo que hace que se
  puedan probar sin montar medio mundo y que cada app decida cómo construirlos.
- **DTO frente a esquema zod**: `class-validator` en la entrada de la API
  (Nest lo necesita para validar y documentar); zod en `shared` para el tipo
  que consumen los clientes. Son dos capas, no una duplicación que haya que
  «arreglar».

## 4. Lo que no queremos aquí

- **Abstraer por si acaso.** Interfaces con una sola implementación, opciones
  que nadie pasa, capas de indirección sin un segundo caso real.
- **Copiar lógica entre web y móvil.** Si el JSX se duplica, vale; si se
  duplica el cálculo, sube a `packages/`.
- **Cajones de sastre.** Nada de `utils.ts` o `helpers.ts` genéricos: el
  fichero se nombra por lo que hace (`column-types.ts`, `query-keys.ts`).
- **Lógica de negocio en las entidades.** Las entidades describen tablas; la
  lógica vive en el servicio.
- **Componentes que lo hacen todo.** Un componente que pide datos, guarda
  estado y pinta se parte: hook para la lógica, componente para la vista.
- **Literales repetidos.** Claves de query, rutas, nombres de almacenamiento y
  colores salen de una constante, no de un literal escrito otra vez.
- **Herencia profunda.** Una clase base transversal y para de contar; para
  compartir comportamiento, composición.
- **Envoltorios de una línea** que solo renombran algo que ya existe.

## 5. Cuándo duplicar es la respuesta correcta

A la segunda vez se mira; **a la tercera se extrae**. Dos usos que se parecen
hoy pueden separarse mañana, y deshacer una abstracción equivocada cuesta más
que copiar diez líneas. Si al extraer aparecen banderas booleanas para atender
a los dos llamadores, no era la misma cosa: déjalas separadas.

## 6. Nombres y forma

- **Ficheros** en kebab-case, y con sufijo cuando el marco lo pide:
  `*.controller.ts`, `*.service.ts`, `*.module.ts`, `*.entity.ts`, `*.dto.ts`,
  `*.test.ts`.
- **Convenciones de nombre**: `createAlgo` para las factorías, `useAlgo` para
  los hooks, `isAlgo` para los predicados, componentes en PascalCase,
  constantes de módulo en `MAYÚSCULAS_CON_GUIONES`.
- **Exportación nombrada**, salvo donde el marco exige `default`: las pantallas
  de expo-router y la configuración de Vite, Playwright o Expo.
- **Funciones cortas y con una responsabilidad**, con salida temprana en vez de
  anidar. Sin abreviaturas crípticas: se lee más veces de las que se escribe.
- **Tipos explícitos en lo que se exporta.** Dentro de una función, la
  inferencia; en la frontera de un paquete, la firma escrita.
- **Sigue el estilo que ya hay.** Prettier y ESLint deciden el formato; tú
  decides que el siguiente lo entienda.

## 7. Comentarios

Comenta **el porqué**, nunca el qué. Un comentario que repite el código sobra;
uno que explica por qué algo es así evita que alguien lo «arregle» y rompa
algo — como el `merge` del store de tema o el `bodyParser: false` de la API.
Cuando descubras una trampa nueva, apúntala en `CLAUDE.md`.

## 8. Antes de darlo por hecho

- ¿Has buscado si ya existía, en el grafo y en la tabla del punto 1?
- ¿Lo compartido está en `packages/` y no copiado en dos apps?
- ¿El patrón elegido es el más simple que resuelve **el caso de hoy**?
- ¿Los ficheros que has tocado siguen dentro del objetivo de la Regla 6?
- ¿Alguien que llegue mañana entiende por qué está así?

> Objetivo: que el código sea reutilizable, predecible y fácil de leer.
