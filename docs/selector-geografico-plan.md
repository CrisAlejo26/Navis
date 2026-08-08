# Selector geográfico en cascada: país, comunidad, ciudad, zona horaria

- **Tipo**: ampliación de interfaz + un endpoint nuevo. Amplía RFC 0011 (D7,
  D9 revisadas — ver esa RFC) y toca la ficha de iglesia de RFC 0008.
- **Apps afectadas**: api y web (escritorio la hereda). Móvil no tiene ficha de
  iglesia todavía, así que no entra.
- **Motivo**: los cuatro campos («País», «Comunidad», «Ciudad», «Zona
  horaria») eran texto libre o un desplegable que solo servía para España. Se
  piden como un único selector en cascada, buscable, y que funcione para
  cualquier país.

## 1. Objetivo y alcance

Entra:

- País, comunidad, ciudad y zona horaria pasan a ser **buscables**: se escribe
  y se filtra, en vez de escribir un código de memoria o desplazarse por una
  lista larga.
- La cascada: elegir país habilita su comunidad; comunidad y país acotan la
  búsqueda de ciudad. Cambiar el país limpia la comunidad, porque un código
  de otro país no significa nada en el nuevo.
- Los festivos regionales pasan a tener nombre para **cualquier país**, no
  solo España (la fuente de festivos ya los daba; lo que faltaba era
  ponerles nombre en la interfaz).
- Todo carga perezoso: nada de esto entra en el paquete inicial de la
  aplicación, y los datos de comunidades se piden **por país**, no de golpe.

No entra:

- **Ninguna migración de base de datos.** `country`, `region` y `city` de
  `Church` ya son columnas de texto sin restricción de tamaño (Regla: lo que
  cambia es de dónde salen las _opciones_ del formulario, no lo que se
  guarda). Los datos de países y comunidades son estáticos y no son de
  ninguna instalación: van en el paquete, no en la base de datos.
- **Un desplegable nativo por país (250 opciones) o de comunidad.** Un
  `<select>` nativo con 250 entradas sin buscador es justo lo que se quiere
  evitar; hace falta un combobox de verdad.
- **La app móvil.** No tiene pantalla de ajustes de iglesia con estos campos
  (ver CLAUDE.md/RFC 0001: «queda para una entrega aparte»).
- **Cambiar la fuente de festivos.** Sigue siendo `date.nager.at` (RFC 0011
  D2); esto es solo la interfaz que elige país y comunidad.

## 2. Hallazgos de investigación

- El propio repositorio ya tiene el patrón correcto para datos que cambian
  poco y no hace falta traducir: `TimezoneSelect` usa
  `Intl.supportedValuesOf('timeZone')`, cero mantenimiento, siempre al día. La
  misma familia de API (`Intl.DisplayNames`) resuelve el **nombre de un país**
  a partir de su código ISO 3166-1, ya en el idioma activo — sin fichero de
  traducción que mantener y sin las claves nuevas que pediría la Regla 2 si
  fuera texto de interfaz.
- No existe un equivalente de `Intl` para nombres de comunidad/provincia
  (ISO 3166-2): hace falta un dataset. `iso-3166-2.json` (Ola Holmström,
  licencia ISC, https://github.com/olahol/iso-3166-2.json) da 237 países con
  sus subdivisiones en ~130 KB sin comprimir — pequeño de sobra para
  partirlo en un fichero por país y cargarlo perezoso. La cobertura y
  granularidad varían por país (algunos solo traen la división de primer
  nivel, otros mezclan niveles); es exactamente lo que ya advertía RFC 0011
  D9 sobre los datos de terceros, y sigue siendo mejor que un código sin
  nombre.
- El patrón de combobox accesible (WAI-ARIA _combobox_: `role="combobox"` +
  `aria-expanded` + `aria-controls` apuntando a un `role="listbox"`,
  navegación con flechas y `Enter`/`Escape`) es el estándar del sector para
  «escribe y filtra»; las librerías (Reach UI, Radix, shadcn) lo siguen todas
  igual. Este repositorio no trae ninguna de esas librerías y no hace falta
  traerla para un patrón de ~120 líneas (mismo criterio que el XLSX o el PDF
  de exportar: sin librería cuando el patrón es acotado — Regla 1 §4).
- Para buscar-mientras-se-escribe contra una API, 300 ms de espera tras la
  última pulsación es el consenso general — es además el valor por defecto
  que ya usa `SearchField` en este mismo repositorio.
- Para la ciudad, el repositorio **ya tiene** un proveedor de geocodificación
  en producción: `WeatherService` llama a
  `https://geocoding-api.open-meteo.com/v1/search` sin clave, cacheado, desde
  el servidor (para que la ciudad de quien mira no salga directa del
  navegador). Es el mismo dato que hace falta aquí — nombre, país, comunidad,
  coordenadas y **zona horaria** de una ciudad — así que se reutiliza el
  mismo proveedor con el mismo criterio (Regla 1), no una tabla de ciudades
  del mundo aparte.

## 3. Dirección de diseño

**El país no es un dato de servidor.** Lista estática de 249 códigos ISO
3166-1 (`packages/shared`, como `LOCALES`), y el nombre lo pone
`Intl.DisplayNames` con el idioma activo — ninguna clave de `i18n` nueva por
país, y los seis idiomas salen gratis.

**La comunidad es un dataset vendido, partido por país.** Se genera una vez
(script en `scripts/`, no en tiempo de build de cada instalación) a partir de
`iso-3166-2.json`, y el resultado son ~237 ficheros JSON pequeños en
`apps/web/src/lib/geo/regions/<CC>.json`. El navegador solo pide el fichero
del país elegido (`import()` dinámico vía `import.meta.glob` de Vite, en modo
perezoso): elegir España no descarga México. Vive en `apps/web` y no en
`packages/shared` porque **solo la web** lo usa hoy (Regla 1 §2.4) y porque
`import.meta.glob` es una función de Vite, no algo que un paquete compartido
con dos bundlers distintos (Metro para móvil) pueda ofrecer igual.

**La ciudad se busca contra Open-Meteo, a través de un endpoint nuevo y
delgado** (`GET /api/v1/geocode/cities`), calcado del `WeatherService` que ya
existe: mismo proveedor, mismo styling de error (si el proveedor falla, la
búsqueda no rompe el formulario, simplemente no da resultados), mismo motivo
para pasar por el servidor. El resultado trae el nombre de la comunidad y la
**zona horaria** de la ciudad, así que elegir la ciudad puede rellenar la
zona horaria por cortesía — se puede corregir después, no se fuerza.

**Un combobox propio, no un desplegable pintado por una librería.** El
patrón `Select` de este repositorio es un `<select>` nativo _a propósito_
(mejor en el teléfono), y sigue siendo lo correcto para listas cortas y
cerradas (labor, sede, don…). Aquí el problema es otro: 249 países o una
búsqueda en vivo no caben en la filosofía de «que abra el selector del
sistema». El combobox nuevo (`components/ui/combobox.tsx`) seguirá el patrón
de accesibilidad de la fase 2, con los mismos tokens y el mismo tamaño táctil
de 44 px de los demás campos (Regla 5), y **es el mismo componente para los
cuatro campos** —país, comunidad, ciudad y zona horaria—, con distinto origen
de opciones cada vez: nada de reinventar el combobox cuatro veces.

## 4. Arquitectura

### `packages/shared`

| Qué                                 | Dónde                                                           |
| ----------------------------------- | --------------------------------------------------------------- |
| Los 249 códigos ISO 3166-1 alfa-2   | `src/constants.ts` (`COUNTRY_CODES`, junto a `LOCALES`)         |
| Esquema de una ciudad geocodificada | `src/schemas/geocode.ts` (`geocodedCitySchema`, `GeocodedCity`) |

`Church`, `updateChurchSchema` y el `Holiday`/`regionLabel` de
`schemas/holidays.ts` no cambian de forma: `regionLabel` sigue existiendo
como función síncrona con `ES_REGIONS` de respaldo (nunca deja de funcionar
sin red), pero deja de ser la única fuente de verdad — ver el hook de web más
abajo.

### `apps/api`

| Qué                                                        | Dónde                               |
| ---------------------------------------------------------- | ----------------------------------- |
| Proxy de búsqueda de ciudades, calcado de `WeatherService` | `src/geocode/geocode.service.ts`    |
| `GET /geocode/cities?q=&country=`, tras `churches.manage`  | `src/geocode/geocode.controller.ts` |
| Módulo                                                     | `src/geocode/geocode.module.ts`     |

Mismo criterio que el tiempo: sin clave, con tope de 5 s, y si el proveedor
falla se devuelve una lista vacía y no un error — quien busca puede seguir
escribiendo el nombre a mano en el campo de texto de respaldo. Gated tras
`churches.manage` (el mismo permiso que edita la iglesia) para que no sea un
buscador de ciudades abierto a cualquiera con sesión.

### `packages/api-client`

| Qué                                            | Dónde                  |
| ---------------------------------------------- | ---------------------- |
| `useCityGeocode(api, { q, country }, enabled)` | `src/geocode-hooks.ts` |

Clave de consulta `['geocode', 'cities', { q, country }]`, `enabled: q.length

> = 2` — no se dispara con una letra sola, ni con el campo vacío.

### `apps/web`

| Qué                                                                | Dónde                                           |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| El combobox accesible, genérico                                    | `components/ui/combobox.tsx`                    |
| Los 249 países + `useCountryName` (vía `Intl.DisplayNames`)        | `lib/geo/countries.ts`                          |
| Las comunidades vendidas, un fichero por país                      | `lib/geo/regions/<CC>.json` (generado)          |
| Carga perezosa por país + `useRegionOptions`/`useRegionName`       | `lib/geo/regions.ts`                            |
| Selector de país                                                   | `components/church/country-field.tsx`           |
| Selector de comunidad, cascada del país                            | `components/church/region-field.tsx`            |
| Selector de ciudad, busca contra el endpoint nuevo                 | `components/church/city-field.tsx`              |
| `TimezoneSelect` pasa a usar el combobox                           | `components/ui/timezone-select.tsx` (reescrito) |
| Orden de los campos: nombre, país, comunidad, ciudad, zona horaria | `components/church/church-form-fields.tsx`      |
| `holidayScopeLabel` pasa a `useHolidayScopeLabel`, perezoso        | `lib/calendar/holiday.ts`                       |

`holiday-fields.tsx` se sustituye por `country-field.tsx` +
`region-field.tsx` (dos ficheros: cada uno por debajo de la Regla 6, y
`HolidayFields` mezclaba dos selects con lógicas de datos distintas — señal
de partir, Regla 6 §3).

**Generación del dataset**: `scripts/gen-region-data.mjs` descarga
`iso-3166-2.json` una vez, lo valida (Regla 10: nunca se confía sin
comprobar) y escribe los 237 ficheros. No corre en cada instalación ni en
CI — es una herramienta de mantenimiento, como `gen-icons.mjs`, con su
comentario de cuándo volver a ejecutarla (si ISO publica cambios).

## 5. Pasos ordenados

1. `packages/shared`: `COUNTRY_CODES` y `geocodedCitySchema`.
2. `apps/api`: módulo `geocode` (servicio + controlador + test, calcado de
   `weather`), registrado en `app.module.ts`.
3. `packages/api-client`: `useCityGeocode`.
4. `scripts/gen-region-data.mjs` + generar `apps/web/src/lib/geo/regions/*.json`.
5. `apps/web`: `components/ui/combobox.tsx` — input, listbox, teclado,
   `aria-*`, estados de carga y sin resultados.
6. `apps/web`: `lib/geo/countries.ts`, `lib/geo/regions.ts`.
7. `apps/web`: `country-field.tsx`, `region-field.tsx`, `city-field.tsx`.
8. `TimezoneSelect` reescrito sobre el combobox.
9. `church-form-fields.tsx`: nuevo orden y campos nuevos.
10. `lib/calendar/holiday.ts` → `useHolidayScopeLabel`; actualizar
    `day-panel.tsx` y `holiday-mark.tsx`.
11. i18n: claves nuevas (§7) en los seis idiomas.
12. Tests (§8) y comprobación visual en los dos temas, tres anchos y con
    alemán activo.

## 6. Animaciones e interacciones

- El listado del combobox entra con la misma transición corta que ya usan los
  menús existentes (`Dialog`/`Select` del proyecto no tienen una propia
  llamativa a propósito — un desplegable no es el sitio para una animación
  con personalidad, Regla 9 §4: la audacia va en otro elemento de la
  pantalla).
- Estado de carga del combobox de ciudad: mismo `Skeleton`/spinner que ya usan
  otras búsquedas del proyecto, no uno nuevo.
- `prefers-reduced-motion` respetado igual que en el resto de la interfaz.

## 7. i18n

Claves nuevas, sección `church.*` (junto a las que ya existen), y
`countryHint` reescrita porque ya no describe un código de dos letras:

- `church.searchPlaceholder` — el mismo placeholder en los cuatro campos.
- `church.countryNoResults`, `church.regionNoResults`, `church.cityNoResults`,
  `church.timezoneNoResults` — el mensaje del combobox vacío, uno por campo
  porque cada uno dice qué es lo que no coincide.
- `church.cityMinChars` — antes de escribir dos letras, en vez de buscar con
  una.

`regionNone` (ya existía) se reutiliza como opción «sin comunidad» del
combobox; `regionCode` (ya existía) se queda como ayuda del campo de
respaldo cuando un país no tiene dataset. Escritas primero en `es.ts` y
traducidas de verdad en los otros cinco (Regla 2); el test de claves iguales
(`create-i18n.test.ts`) pasa.

## 8. Plan de pruebas

- **`apps/api`**: `geocode.service.test.ts` (calcado de
  `weather.service.test.ts`: éxito, proveedor caído, filtra por país, descarta
  resultados sin zona horaria). Sin e2e de la API: este entorno no tenía
  Docker/Postgres disponibles para levantarla — pendiente de correr
  `rtk pnpm test:e2e` de `apps/api` en un entorno que sí los tenga.
- **`apps/web`**: `combobox.test.tsx` (teclado: flechas, `Enter`, `Escape`;
  filtro; `aria-activedescendant`; opción vacía) y `match.test.ts`. No se
  añadieron tests unitarios aparte para `country-field`/`region-field`/
  `city-field`: la cobertura de comportamiento real la da el e2e nuevo
  (`ajustes-iglesia.spec.ts`) contra la pantalla completa, que es donde
  importa que la cascada funcione de verdad.
- **e2e** (`apps/web/e2e/ajustes-iglesia.spec.ts`): busca un país por nombre,
  comprueba que un país sin comunidades de España las muestra con nombre, y
  que cambiar de país limpia la comunidad elegida. Corre en escritorio y en
  Pixel 7.
- `pnpm check` y `pnpm --filter @navis/web test:e2e` en verde. `pnpm build`
  comprobado, incluida la partición en 233 ficheros propios por país (uno por
  `import.meta.glob`).

## Criterios de aceptación

- [x] País, comunidad, ciudad y zona horaria se buscan escribiendo, no se
      escriben a mano ni se recorren en una lista sin filtro.
- [x] Elegir un país distinto de España muestra los nombres de sus
      comunidades, no solo el código.
- [x] Cambiar de país limpia la comunidad elegida.
- [x] El festivo «Festivo en X» muestra el nombre de la comunidad para
      cualquier país con datos, y el código si no los tiene.
- [x] Ninguna migración de base de datos; ningún dato de país/comunidad viaja
      en el paquete inicial de la aplicación (verificado en `dist/`: cada país
      es su propio fichero, cargado solo al elegirlo).
- [x] Si el proveedor de ciudades falla, el campo de ciudad se puede rellenar
      a mano y el formulario no se rompe (mismo patrón que `WeatherService`:
      lista vacía, no excepción).
- [x] `pnpm check` y `pnpm --filter @navis/web test:e2e` en verde; los dos
      temas y tres anchos comprobados a mano contra el build real. El alemán
      se comprobó en el fichero de traducciones (mismas claves que los otros
      cinco) pero no con una captura de la pantalla en ese idioma.
- [ ] `pnpm --filter @navis/api test:e2e`: no se pudo correr en este entorno
      (sin Docker/Postgres disponibles) — pendiente antes de dar el módulo
      `geocode` por probado de punta a punta contra la base de datos real.
