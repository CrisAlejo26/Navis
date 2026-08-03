# Regla 4 — «Funciona» significa probado, no supuesto

Nada está terminado hasta que se ha ejecutado y se ha visto el resultado. No se
dice que algo está listo sin evidencia.

## 1. Lo que hay que pasar siempre

```bash
rtk pnpm check
```

Encadena, en este orden: `format:check` → `lint` → `typecheck` → `test` →
`test:scripts`. Si falla lo primero, no llegas a lo último: arréglalo por
orden.

## 2. Y según lo que hayas tocado

| Si has tocado…               | Ejecuta también                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------- |
| API o web                    | `rtk pnpm test:e2e`                                                               |
| API (e2e, antes de lanzarlo) | `rtk pnpm db:up && rtk pnpm db:migrate` — los e2e van contra Postgres de verdad   |
| App móvil                    | `rtk pnpm --filter @navis/mobile exec expo-doctor`                                |
| App de escritorio            | `rtk pnpm build:web` y después `cd apps/desktop/src-tauri && cargo check`         |
| Base de datos                | Las migraciones **en los dos motores**: `DB_DRIVER=sqlite` y `DB_DRIVER=postgres` |
| Iconos o nombre del proyecto | `rtk pnpm icons` y `rtk pnpm test:scripts`, que comparan byte a byte              |
| Cualquier cosa que compile   | `rtk pnpm build` — un fallo de build no puede aparecer al desplegar               |

## 3. Dónde vive cada test y con qué se ejecuta

| Qué                   | Runner                           | Dónde                           |
| --------------------- | -------------------------------- | ------------------------------- |
| API (unitarios)       | Vitest + SWC, entorno `node`     | `apps/api/src/**/*.test.ts`     |
| API (e2e)             | Vitest + supertest               | `apps/api/test/*.e2e-spec.ts`   |
| Web (unitarios)       | Vitest + jsdom + Testing Library | `apps/web/src/**/*.test.tsx`    |
| Web (e2e)             | Playwright (Chromium y Pixel 7)  | `apps/web/e2e/*.spec.ts`        |
| Móvil                 | Jest con el preset `jest-expo`   | `apps/mobile/src/**/*.test.tsx` |
| Paquetes compartidos  | Vitest                           | junto al fichero que prueban    |
| Scripts de `scripts/` | Runner de Node (`node --test`)   | `scripts/*.test.mjs`            |

SWC en la API no es un capricho: aplica los decoradores y
`emitDecoratorMetadata`, sin los cuales no hay inyección de dependencias ni
entidades. Y los e2e de web corren **contra el build real**, porque es la única
forma de validar el service worker.

## 4. Cómo se escriben aquí

- **Prueba comportamiento, no implementación.** Los tests del store de tema
  comprueban qué modo queda activo y qué se persiste, no cómo lo hace zustand
  por dentro.
- **Títulos en español y descriptivos**, en la forma «hace tal cosa cuando tal
  otra»: `recupera el tema guardado y lo aplica al arrancar`.
- **Inyecta en vez de mockear.** `createApiClient` acepta `fetchImpl` y el
  store de tema recibe su adaptador: un doble de memoria (como el
  `memoryStorage` de `theme-store.test.ts`) vale más que un mock global.
- **En la interfaz, selecciona como lo haría una persona**: por rol o por
  etiqueta accesible (`getByRole`, `getByLabelText`), no por clases ni por
  estructura. De paso, el test comprueba que hay accesibilidad.
- **En móvil, `render` y `fireEvent` son asíncronos** (Testing Library 14 +
  React 19): hay que esperarlos.
- **Los tests de móvil comprueban comportamiento, no estilos**: el preset de
  NativeWind está desactivado en Jest porque choca con los mocks de React
  Native. Que pasen no dice nada del aspecto.
- **Los mocks del entorno viven en `jest.setup.js`** (AsyncStorage,
  expo-localization, expo-secure-store) e i18next se inicializa allí: sin eso,
  los componentes renderizan las claves en crudo.

## 5. Qué merece un test

- **Lógica nueva**: el caso normal y los límites que importen (vacío, máximo,
  entrada inválida).
- **Un fallo que arreglas**: **primero** el test que lo reproduce. Si no falla
  antes del arreglo, no estás probando el fallo. Los tests de regresión llevan
  un comentario diciendo qué protegen, como el del `merge` del store de tema.
- **Contratos**: esquemas de `shared`, variables de entorno, formas de
  respuesta. Son lo que rompe a los cuatro clientes a la vez.
- **Los scripts**: `rename`, `release` e `icons` tocan todo el repositorio y
  tienen sus tests en `scripts/`.

No merecen test: los estilos, lo que ya garantiza el tipado y los envoltorios
que no deciden nada.

## 6. Trampas de la suite

- **`BETTER_AUTH_SECRET` tiene que estar** (más de 32 caracteres) o los tests
  que importan la configuración ni arrancan.
- **Los unitarios corren con `DB_DRIVER=sqlite`**; los e2e de la API, contra
  **Postgres** arrancado y migrado, y en ese orden: Better Auth primero,
  TypeORM después (`pnpm db:migrate` ya lo hace así).
- **Playwright levanta `build` + `preview`**: la primera vez tarda, hasta tres
  minutos. No es que se haya colgado.
- **Los tests de marca comparan byte a byte** lo que hay en el repositorio con
  lo que genera `pnpm icons`; un icono tocado a mano los tumba. El `.icns` de
  Tauri no es reproducible: si aparece como único cambio, es ruido.
- **Las entidades de TypeORM se listan a mano**, sin globs, justamente para que
  los tests puedan correr sobre el fuente.

## 7. Compruébalo de verdad

Que compile no es que funcione, y que los tests pasen tampoco. Si el cambio se
ve, míralo en la aplicación: en los **dos temas** (Regla 3), en un ancho de
móvil y en uno de escritorio (Regla 5), y con más de un idioma si toca textos
(Regla 2).

## 8. Lo que va a correr igualmente en CI

Formato, lint, tipos, tests, tests de scripts y `build`; e2e de la API contra
Postgres; e2e de la web con Playwright; `expo-doctor` en móvil; `cargo check`
en escritorio; y la construcción de las imágenes de Docker. Pasarlo en local
antes es más rápido que descubrirlo en el pull request.

## 9. Cuenta la verdad

Si un test falla, dilo con la salida real. Si te has saltado un paso, dilo.
Un «está listo» sin comprobar cuesta más que un «esto no lo he podido probar».

> Probado, no supuesto.
