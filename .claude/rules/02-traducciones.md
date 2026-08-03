# Regla 2 — Los seis idiomas, siempre

Toda cadena visible va traducida a **los seis idiomas**: español, inglés,
francés, portugués, alemán e italiano. Nunca se escribe texto suelto en un
componente, ni siquiera «provisional».

## 1. Dónde vive cada cosa

| Qué                                                      | Dónde                                       |
| -------------------------------------------------------- | ------------------------------------------- |
| Las traducciones, un fichero por idioma                  | `packages/i18n/src/locales/`                |
| El paquete de recursos que carga i18next                 | `packages/i18n/src/resources.ts`            |
| Creación de la instancia y elección del idioma inicial   | `packages/i18n/src/create-i18n.ts`          |
| Tipado estricto de `t()`                                 | `packages/i18n/src/i18next.d.ts`            |
| `LOCALES`, `DEFAULT_LOCALE`, `LOCALE_LABELS`, `isLocale` | `packages/shared/src/constants.ts`          |
| Persistencia del idioma y `setLocale`/`getLocale`        | `apps/<app>/src/lib/i18n.ts`                |
| Selector de idioma                                       | `apps/<app>/src/components/language-select` |

## 2. El español es la referencia

`es.ts` define el tipo (`export type Translation = typeof es`) y los demás lo
cumplen con `satisfies Translation`. Consecuencia práctica: si añades una clave
solo en español, **el proyecto no compila** hasta que la traduces en los otros
cinco. Es a propósito.

Además, `i18next.d.ts` engancha ese tipo a i18next: `t('nav.dashboard')`
autocompleta y una clave inexistente es un error de compilación, en web y en
móvil.

## 3. Cómo se usan

```tsx
const { t } = useTranslation();

<Text>{t('nav.believers')}</Text>;
<Text>{t('auth.welcome', { name })}</Text>; // interpolación: {{name}}
```

- `useTranslation` viene de `react-i18next` en web y en móvil: la instancia es
  la misma, creada en `packages/i18n`.
- Fuera de un componente, `i18n.t(...)` sobre la instancia exportada.
- **También se traduce lo que no se ve**: `aria-label`, `alt`, `placeholder`,
  títulos de pantalla y textos de `sr-only`.
- **Nada de claves construidas al vuelo.** Una plantilla del tipo
  ``t(`nav.${seccion}`)`` se salta el tipado; declara una unión de claves, como
  el tipo `NavKey` de `PlaceholderScreen`.

## 4. Cómo se nombran las claves

`seccion.clave`, ambas en camelCase, dentro de la sección que le toque:

`common` · `nav` · `auth` · `theme` · `language` · `settings` · `profile` ·
`home` · `errors` · `pwa`

- **`common.*`** es para lo que reutilizan varias pantallas (`save`, `cancel`,
  `loading`, `retry`…). Antes de añadir un «Guardar» nuevo, mira si ya está.
- **Una funcionalidad nueva, una sección nueva** con su nombre
  (`believers.*`, `calendar.*`), no claves sueltas colgando de `common`.
- La clave describe **el sitio y el papel**, no el texto: `auth.signIn`, no
  `auth.iniciarSesion`.
- Frases enteras, no trozos que se concatenan: el orden de las palabras cambia
  con el idioma. Para las partes variables, interpolación.

## 5. Al añadir textos

1. La clave, primero en `es.ts`, dentro de su sección.
2. La traducción **real** en los otros cinco, con el mismo orden de claves para
   que los ficheros se puedan comparar de un vistazo.
3. Úsala con `t()` en la interfaz; nada de literales.
4. `rtk pnpm check`: el tipado y el test te dirán si te has dejado alguno.

Lo que no vale: dejar el español de relleno en `en.ts`, poner la clave vacía,
o traducir a bulto sin mirar el contexto en el que sale la frase.

## 6. Lo que no se traduce

- **El nombre de la aplicación.** `common.appName` es el mismo en los seis; lo
  reescribe `pnpm rename` (Regla 7). No lo escribas a mano en ningún sitio.
- **Los nombres de los idiomas**: cada uno va en su propio idioma y viven en
  `LOCALE_LABELS`, no en las traducciones.
- **Fechas, horas y números**: salen de `Intl` con el idioma activo
  (`getLocale()`), que ya los localiza bien.
- **Rutas, claves de almacenamiento, identificadores y logs.**
- **Los mensajes de la API y de los esquemas zod** (`shared/src/schemas`) están
  en español y son un respaldo para desarrollo, no la traducción. Cuando el
  mensaje se le enseña a alguien, la interfaz pone su propia clave: así hace
  `login.tsx` con `auth.invalidCredentials`, y `errors.generic` queda como
  último recurso.

## 7. Cómo se elige y se guarda el idioma

Prioridad: **preferencia guardada → idioma del dispositivo → español.**

- La preferencia se guarda en `navis.locale`: `localStorage` en web,
  `AsyncStorage` en móvil.
- En web todo es síncrono, así que el primer render ya sale en su idioma. En
  móvil i18next arranca con el idioma del dispositivo y la preferencia guardada
  se aplica justo después, porque AsyncStorage es asíncrono.
- Cambiar de idioma es instantáneo y funciona sin conexión: los seis paquetes
  van dentro del bundle, no se descargan.
- Web además ajusta `document.documentElement.lang`, y el cliente HTTP envía
  `Accept-Language` con el idioma activo (la API todavía no lo usa).

## 8. Trampas que ya han mordido

- **`es.ts` no lleva `as const`**: sus valores deben ensancharse a `string`
  para que las otras traducciones puedan satisfacer el mismo tipo.
- **Hay un test que compara el juego de claves de los seis ficheros**
  (`create-i18n.test.ts`). Si falla, es que falta una traducción.
- **Plurales**: i18next los resuelve con sufijos (`_one`, `_other`, `_many`) y
  las categorías **no son las mismas en los seis idiomas** — español, francés,
  portugués e italiano tienen `_many`; inglés y alemán, no. El test de claves
  iguales fallaría. Todavía no hay ninguno en el proyecto: si te hace falta,
  ajusta el test en el mismo cambio y déjalo dicho.
- **`initAsync: false`** es deliberado: sin él, el primer render enseña las
  claves en crudo.
- En los tests de móvil el `debug` de i18next se apaga a mano, porque `__DEV__`
  también es `true` en Jest y ensucia toda la salida.

## 9. Verificación

- `rtk pnpm check` — tipos y test de claves.
- Míralo en la aplicación cambiando de idioma con el selector, no solo en el
  fichero.
- Comprueba el texto **más largo** (suele ser el alemán) en un ancho de móvil:
  es donde se rompen los botones y las pestañas (Regla 5).

> Si una cadena no está en los seis idiomas, la tarea no está terminada.
