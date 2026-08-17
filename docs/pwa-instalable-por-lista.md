# Plan: PWA instalable por lista compartida

> **Estado**: Implementado · **Fecha**: 2026-08-17 · **Slug**: `pwa-instalable-por-lista`
>
> **Nota de implementación**: el punto «dónde vive la lógica de swap del
> manifest» cambió al escribir el código (§ más abajo). El plan original
> proponía ampliar el script en línea de `index.html`; al construirlo con
> `pnpm build` se comprobó que `vite-plugin-pwa` inyecta el
> `<link rel="manifest">` **al final** de `<head>`, después de ese script, así
> que la comprobación no lo habría encontrado. La solución real —mejor que la
> planeada— es una llamada síncrona en `apps/web/src/main.tsx`, **antes** de
> `createRoot(...).render(...)`: los `<script type="module">` son diferidos
> por especificación, así que para cuando ese módulo se ejecuta el documento
> ya está parseado entero —el `<link>` del manifest incluido— y sigue ganando
> la misma carrera contra el registro del _service worker_, sin tocar
> `index.html`.

## Descripción

Hoy, si alguien instala Navis como aplicación desde la página pública de una
lista (`/l/<token>` → `/lists/s/<token>`), el icono que queda en su pantalla de
inicio abre la aplicación general (`/`) y, sin sesión, eso es el inicio de
sesión general — exactamente el fallo que se ha reportado. La persona que
instaló la PWA quería el pase de lista de púlpito, y se encuentra con un
formulario de correo y contraseña que no es el suyo (los accesos de lista ni
siquiera son cuentas de la aplicación, D22 de la RFC 0010).

Esta funcionalidad hace que **cada lista publicada tenga su propio manifest de
aplicación**, con su propio `start_url` apuntando a esa lista. Instalada así,
el icono abre directamente `/lists/s/<token>`: la lista si es abierta, o la
puerta de usuario y contraseña (`AccessGate`) si es restringida — nunca el
inicio de sesión general, porque esa ruta ni siquiera pasa por `ProtectedRoute`.
Se añade además un botón «Instalar» explícito en el pie de la página pública,
porque el banner automático del navegador no siempre aparece y quien reparte
una lista de púlpito necesita un gesto que pueda señalar con el dedo.

## Investigación: cómo lo resuelven otros

### El problema técnico, en una frase

Una SPA de Vite tiene **un único `index.html`** para todas sus rutas, y el
manifest de aplicación se enlaza una vez desde ese documento
(`<link rel="manifest">`). El navegador no sabe, al instalar, "desde qué
pantalla de la app" se pulsó instalar — solo sabe qué manifest está enlazado
en ese momento. Por eso el `start_url` es siempre el mismo, sea cual sea la
URL que se estaba mirando.

### Cómo lo resuelven otros productos y qué dice la plataforma

- **Web App Manifest `id`** (Chrome 96+, Safari/iOS 16.4+): desde que existe
  el campo `id`, un mismo origen puede tener **varias PWA instaladas a la
  vez**, cada una con su propio `start_url` y `scope`, siempre que su `id` (o,
  a falta de él, su `start_url`) sea distinto. Es justo el mecanismo que hace
  falta aquí: cada lista es una PWA distinta de "Navis a secas", no una
  variación de la misma. ([Chrome for Developers](https://developer.chrome.com/docs/capabilities/pwa-manifest-id))
- **Manifest generado por el servidor**, no por el cliente. Los artículos que
  documentan manifests dinámicos en SPA (Angular, Next.js) coinciden en que la
  opción robusta es servir el JSON desde el backend con el `Content-Type`
  correcto, y solo cambiar en el cliente **qué URL de manifest está enlazada**
  — no construir el manifest en memoria con un `Blob`, que arrastra
  limitaciones de CSP y de temporización con el _service worker_.
  ([Medium — Angular](https://medium.com/limehome-engineering/create-a-pwa-app-manifest-dynamically-spa-angular-1627260e0390),
  [dev.to](https://dev.to/progressier/create-a-pwa-app-manifest-dynamically-1b4b))
- **El aviso más repetido en toda la investigación**: cambiar el `href` del
  `<link rel="manifest">` **después** de que el _service worker_ se haya
  registrado puede dejar la instalación en un estado inconsistente. La
  recomendación es que el manifest correcto esté enlazado **antes** de que
  nada más corra.
- **iOS Safari no tiene `beforeinstallprompt`**: «Añadir a pantalla de inicio»
  vive en el menú de compartir, y Safari lee el manifest que esté enlazado
  **en el instante en que se pulsa**, sin heurística de elegibilidad previa.
  Esto hace que el enfoque de esta funcionalidad —enlazar el manifest correcto
  pronto y quedarse así— funcione igual de bien en iOS que en Chrome, sin
  necesitar nada específico para Safari salvo el aviso de "dónde está el
  botón", porque ahí no hay API para lanzar el diálogo por programa.
  ([MagicBell — PWA iOS 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide))

### Conclusiones clave para Navis

- El manifest debe generarlo **la API**, en el mismo sitio que ya genera el
  documento de `/l/<token>` para WhatsApp (D14): es el mismo principio —lo que
  necesita variar por lista no lo puede servir un `index.html` estático—.
- El manifest debe enlazarse **antes de que registre el service worker**, y en
  Navis eso se registra en el primer render (`main.tsx` monta
  `PwaUpdatePrompt`, que llama a `useRegisterSW` inmediatamente). Un efecto de
  React dentro de `PublicListPage` llegaría tarde: gana la carrera una llamada
  síncrona en el propio `main.tsx`, **antes** de `createRoot(...).render(...)`,
  que mira `location.pathname` y decide si hay que enlazar el manifest de una
  lista en vez del general.
- No hace falta restaurar el manifest al salir de la página: nadie navega a
  `/lists/s/<token>` con navegación de cliente (no hay ningún enlace interno
  de la aplicación que apunte ahí — se comprobó en el grafo del proyecto), así
  que siempre se llega con una carga de documento completa.
- El `scope` del manifest debe ser la propia ruta de la lista
  (`/lists/s/<token>`), no `/`: es lo que hace que el navegador la trate como
  una aplicación aparte y no como "otra forma de abrir Navis". El `id` es el
  mismo valor, por claridad.
- Los iconos se reutilizan tal cual (los PNG de `/pwa-*.png` que ya sirve la
  web): generar un icono por lista es un salto de complejidad (encaja con la
  Regla 7, que centraliza el logo en un solo generador) que no está pedido y
  que se puede añadir después sin romper nada de este plan.
- El color de la lista (`accent`, D37 de la RFC 0010) **no** entra en el
  manifest en esta primera versión: resolverlo a hexadecimal usa
  `accentHex()`, que vive en `apps/web` e importa de `@navis/theme` — la API
  hoy no depende de ese paquete, y añadir la dependencia entera para un
  detalle cosmético del `theme_color` no está justificado (Regla 1 §4, "no
  abstraer por si acaso"). Queda anotado como mejora futura si algún día hace
  falta desde dos sitios más.

## Solución propuesta

```
Alguien pega /l/<token> en el navegador
        │
        ▼
API: documento con las og: (ya existe, D14) → location.replace('/lists/s/<token>')
        │
        ▼
index.html se carga de cero (navegación completa, documento entero parseado)
        │
        ▼
main.tsx se ejecuta (los <script type="module"> son diferidos):
    si location.pathname empieza por /lists/s/, reescribe el
    href del <link rel="manifest"> a /l/<token>/manifest.webmanifest
    — antes de createRoot(...).render(...)
        │
        ▼
React monta. El service worker se registra viendo YA el manifest correcto.
        │
        ▼
PublicListPage se pinta: lista abierta, o AccessGate si es restringida
        │
        ├─ El navegador (Chrome/Android) puede ofrecer el banner de instalar
        │    solo, porque el manifest cumple los criterios de instalabilidad
        │
        └─ El pie de página (PublicFooter) enseña un botón «Instalar»
             que dispara el mismo prompt a mano (beforeinstallprompt),
             o en iOS, un texto que dice dónde está el gesto de verdad
        │
        ▼
Instalada: el icono en la pantalla de inicio abre /lists/s/<token>
directamente — nunca pasa por ProtectedRoute ni por /login.
```

La API sirve `GET /l/:token/manifest.webmanifest` junto al resto de rutas
públicas de una lista (mismo controlador que ya sirve el documento, la
portada y las fotos). El JSON usa el nombre de la lista y el de la iglesia, un
`start_url` y `scope` iguales a `/lists/s/<token>`, y reutiliza los iconos de
Navis. No hace falta tabla nueva ni columna nueva: todo sale de lo que
`PublicListsService.byToken` ya devuelve.

## Modelo de datos

No hay cambios de esquema. El manifest se construye al vuelo a partir de la
lista y el nombre de la iglesia, igual que el documento de `og:` de D14.

```typescript
// apps/api/src/lists/list-manifest.ts
export interface ListManifestInput {
  origin: string;
  token: string;
  listName: string;
  churchName: string;
}

/** El manifest de aplicación de una lista publicada: un `start_url` propio. */
export function renderListManifest(input: ListManifestInput): object {
  const startUrl = `${input.origin}${listPublicPath(input.token)}`; // /lists/s/<token>

  return {
    id: startUrl,
    name: `${input.listName} · ${input.churchName}`,
    short_name: input.listName.slice(0, 30),
    start_url: startUrl,
    scope: startUrl,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fcfcfa',
    theme_color: '#fcfcfa',
    icons: [
      {
        src: `${input.origin}/pwa-192x192.png`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `${input.origin}/pwa-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: `${input.origin}/pwa-maskable-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
```

## Plan de archivos

### Archivos nuevos

| Archivo                                                 | Propósito                                                                              |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `apps/api/src/lists/list-manifest.ts`                   | Construye el JSON del manifest de una lista (función pura, con su test)                |
| `apps/api/src/lists/list-manifest.test.ts`              | Prueba unitaria: `start_url`/`scope`/`id` correctos, nombre truncado, etc.             |
| `apps/web/src/lib/lists/public-manifest.ts`             | `linkPublicListManifest()`: reescribe el `<link rel="manifest">` antes de montar React |
| `apps/web/src/lib/lists/public-manifest.test.ts`        | Prueba unitaria del swap, con jsdom                                                    |
| `apps/web/src/lib/pwa-install.ts`                       | Hook `usePwaInstallPrompt()`: captura `beforeinstallprompt`, expone `promptInstall()`  |
| `apps/web/src/lib/pwa-install.test.tsx`                 | Prueba unitaria del hook, con `renderHook`                                             |
| `apps/web/src/components/lists/install-list-button.tsx` | Botón «Instalar» del pie público, con su variante de aviso en iOS                      |
| `apps/web/e2e/lista-manifest.spec.ts`                   | e2e: el manifest enlazado en `/lists/s/<token>` es el propio de esa lista              |

### Archivos a modificar

| Archivo                                           | Cambio necesario                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/lists/public-share.controller.ts`   | Nuevo `@Get(':token/manifest.webmanifest')` que llama a `renderListManifest` y pone el `Content-Type` correcto |
| `apps/web/src/main.tsx`                           | Llama a `linkPublicListManifest()` antes de `createRoot(...).render(...)`                                      |
| `apps/web/src/components/lists/public-footer.tsx` | Añade `<InstallListButton>` junto a los botones de descarga                                                    |
| `packages/i18n/src/locales/*.ts` (los seis)       | Las claves nuevas de la tabla de abajo                                                                         |

### Claves i18n nuevas

| Clave                  | es                                                     | en (referencia)                           |
| ---------------------- | ------------------------------------------------------ | ----------------------------------------- |
| `lists.installApp`     | Instalar como aplicación                               | Install as an app                         |
| `lists.installAppHint` | Toca «Compartir» y luego «Añadir a pantalla de inicio» | Tap "Share" and then "Add to Home Screen" |

## Pasos de implementación

1. **`renderListManifest` y su test**: función pura, sin tocar nada más. Es lo
   que hace falta para poder escribir el endpoint y probarlo sin depender de
   toda la aplicación levantada.
2. **El endpoint en `PublicShareController`**: `GET /l/:token/manifest.webmanifest`,
   reutilizando `this.lists.byToken(token)` como ya hace `page()`. Cabeceras:
   `Content-Type: application/manifest+json` y el mismo `x-robots-tag` que el
   resto de rutas de `/l/` (D10 — un manifest de una lista tampoco se indexa).
   En caché ligera (`cache-control: public, max-age=300`, como `card.png`): el
   nombre de la lista no cambia cada minuto.
3. **El swap del manifest, en `main.tsx`**: `linkPublicListManifest()` mira
   `location.pathname` y, si empieza por `/lists/s/`, reescribe el `href` del
   `<link rel="manifest">`. Se llama justo antes de `createRoot(...).render(...)`
   — ver la nota de implementación al principio de este documento sobre por
   qué no es un script de `index.html`, que era el plan original.
4. **`usePwaInstallPrompt` y el botón**: captura `beforeinstallprompt`
   (`event.preventDefault()` y se guarda), expone si hay un _prompt_
   disponible y una función para lanzarlo. Si `matchMedia('(display-mode:
standalone)').matches` es `true`, no se enseña nada: ya está instalada. En
   iOS (`/iPad|iPhone|iPod/.test(navigator.userAgent)` sin `MSStream`, que no
   dispara nunca `beforeinstallprompt`), se enseña el aviso con el texto de
   `lists.installAppHint` en vez del botón.
5. **Engancharlo en `PublicFooter`**: al lado de los botones de descarga, fuera
   de la condición de `list.allowDownload` — el botón de instalar no depende
   de ese permiso.
6. **e2e**: sobre una lista pública mockeada (el mismo patrón que
   `listas-publicas.spec.ts`, con el service worker bloqueado), comprobar que
   el `<link rel="manifest">` de `/lists/s/<token>` apunta a
   `/l/<token>/manifest.webmanifest`, y que en cualquier otra pantalla sigue
   siendo `/manifest.webmanifest`.

## Decisiones de diseño

| Decisión                                              | Elegida                                                 | Alternativas descartadas                                                                                    | Razón                                                                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dónde vive la lógica de swap del manifest             | Llamada síncrona en `main.tsx`, antes de `render()`     | Script en línea de `index.html` (plan original); efecto de React en `PublicListPage`; `Blob:` en el cliente | Gana la misma carrera contra el registro del _service worker_ sin depender de en qué orden `vite-plugin-pwa` inyecta el `<link>` en el HTML final |
| Quién genera el JSON del manifest                     | La API, en `PublicShareController`                      | Generarlo en el cliente con un `Blob:`                                                                      | Mismo principio que D14: lo que varía por lista lo sirve el servidor; evita líos de CSP con `blob:`                                               |
| `scope`/`id`                                          | `/lists/s/<token>` (la propia ruta pública de la lista) | `/` (el de la app general)                                                                                  | Es lo que hace que el navegador la trate como una PWA distinta y no como "otra forma de abrir Navis" (manifest `id`, Chrome 96+/iOS 16.4+)        |
| Color del manifest (`theme_color`/`background_color`) | Fijo, el de Navis (`#fcfcfa`)                           | El acento de la lista (D37)                                                                                 | Requeriría que la API dependiera de `@navis/theme` solo para esto; no está pedido y se puede añadir después sin romper nada                       |
| Iconos                                                | Los mismos PNG de Navis, reutilizados                   | Un icono generado por lista (color de acento, inicial del nombre)                                           | Fuera de alcance de lo pedido; la Regla 7 centraliza la generación de iconos en un solo sitio y esto la duplicaría                                |
| Botón de instalar explícito                           | Sí, en el pie de la página pública                      | Confiar solo en el banner automático del navegador                                                          | El banner de Chrome no siempre aparece (depende de heurísticas de motor), y en iOS no existe ningún banner: hace falta un gesto visible           |

## Checklist antes de empezar

- [x] `renderListManifest` tiene su test unitario y vive junto al resto de
      `apps/api/src/lists/*.ts`
- [x] El nuevo endpoint no exige sesión (`@Public()`, como el resto del
      controlador) y respeta D10 (`x-robots-tag: noindex, nofollow`)
- [x] El swap del manifest se ha probado contra el HTML que genera
      `pnpm build`, no solo contra el servidor de desarrollo (así se descubrió
      que el plan original de tocar `index.html` no funcionaba)
- [x] Los seis idiomas tienen las dos claves nuevas
- [x] El botón de instalar funciona en 375 px y no rompe el `flex-wrap` del
      pie existente
- [x] Funciona en los dos temas (el manifest usa un color fijo, pero el botón
      y el aviso de iOS son interfaz normal y sí tienen que cumplir la Regla 3)
- [x] Ningún cambio toca `ActiveChurchGuard` ni las tablas de accesos: esto es
      pura capa de instalación, no cambia quién puede ver qué

## Preguntas abiertas

- [ ] **¿El botón de instalar se enseña siempre, o solo cuando la lista es
      restringida?** Una lista abierta ya se ve sin instalar nada; quien más
      se beneficia de un icono propio es quien tiene que volver a teclear
      usuario y contraseña cada vez. Se puede lanzar mostrándolo siempre y
      medir, o limitarlo desde el principio a `visibility === 'restricted'`.
      **Se implementó mostrándolo siempre**, por simplicidad; queda abierto si
      conviene acotarlo más adelante.
- [ ] **¿Hace falta un aviso de "esto no es una cuenta de Navis"** la primera
      vez que alguien instala una lista, para que no le extrañe no ver el
      resto de la aplicación al abrir el icono? La propia RFC 0010 (D22) ya
      insiste en que un acceso de lista no es una cuenta; puede que baste con
      que el `name` del manifest lleve el nombre de la iglesia y no diga
      «Navis» a secas, que es lo que ya hace este plan.
- [ ] **Verificación en dispositivo real**, no solo en Playwright: Playwright
      no puede completar una instalación de PWA de verdad. Antes de dar esto
      por terminado del todo hace falta probarlo a mano en Chrome/Android y en
      Safari/iOS, como ya pide la Regla 4 para todo lo que se ve. Sigue
      pendiente en el momento de escribir esta nota.
