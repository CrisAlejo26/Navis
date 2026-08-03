# Regla 5 — Que funcione en el móvil de quien lo usa

La aplicación se usa de pie, con una mano y en una pantalla pequeña tan a
menudo como sentado delante de un ordenador. Toda interfaz debe funcionar en
**móvil, tablet y escritorio**.

## 1. Primero el móvil

Escribe la versión estrecha **sin prefijo** y ensánchala con los breakpoints de
Tailwind: `sm:` 640 px · `md:` 768 px · `lg:` 1024 px · `xl:` 1280 px.

En la web el corte que manda es **`md`**: por debajo, navegación inferior; por
encima, barra lateral. Si tu pantalla necesita otro, que sea por una razón que
puedas explicar.

## 2. Los dos patrones que ya están montados

- **Web** (`routes/app-layout.tsx`): `aside` con las siete entradas, oculto con
  `hidden md:flex`; `nav` inferior fija con las cinco primeras, oculta con
  `md:hidden`. El contenido lleva `pb-24` en móvil para que la barra inferior
  no tape lo último.
- **Móvil** (`app/(tabs)/_layout.tsx`): cinco pestañas, y profecías, sueños y
  comunicaciones agrupados en «Más». Más de cinco en una barra inferior quedan
  ilegibles.

Una sección nueva se engancha a estos dos sitios; no se inventa una navegación
propia.

## 3. Layouts que aguantan

- **Flex y grid**, unidades relativas, `min/max-width`. Nada de anchos fijos en
  píxeles que provoquen desbordes horizontales.
- **Rejillas que se recolocan**: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`,
  como el panel de inicio. Una columna en móvil, más columnas al ensanchar.
- **`min-h-dvh`, no `min-h-screen`**: con la barra del navegador móvil, `vh`
  miente.
- **Limita el ancho de lectura** (`max-w-sm`, `max-w-prose`…) en vez de dejar
  que una línea cruce un monitor entero.
- **Imágenes y medios**, `max-w-full`; lo que no quepa (tablas, bloques de
  código, diagramas) hace scroll **dentro de su propio contenedor**, no
  arrastrando la página.

## 4. Lo que se toca

- **Al menos 44 px de lado** en móvil, con espacio entre objetivos. El `Button`
  compartido da `md` = 40 px y `lg` = 48 px: para la acción principal de una
  pantalla táctil, `lg`. Los tamaños pequeños (`sm`, iconos de 32 px) son para
  barras de escritorio.
- **La acción principal, al alcance del pulgar**: abajo y centrada, no arriba a
  la derecha.
- Los iconos sueltos llevan etiqueta accesible (Regla 2); un objetivo de 20 px
  de icono necesita un área táctil mayor a su alrededor.

## 5. En la app nativa

- **Formularios dentro de `KeyboardAvoidingView` + `ScrollView`**, o el teclado
  tapa el botón de enviar. El `behavior="padding"` se pone **solo en iOS**; en
  Android sobra y descoloca.
- **`contentContainerClassName="grow justify-center"`** es el patrón de las
  pantallas de acceso: centra cuando sobra alto y permite scroll cuando no.
- **Zonas seguras**: `SafeAreaProvider` ya está montado en el layout raíz. Las
  pantallas de pestañas ocultan la cabecera y compensan la barra de estado con
  `pt-16`; si una pantalla necesita el inset real, tómalo de
  `useSafeAreaInsets` en lugar de inventar un número.
- **Listas largas con `FlatList`**, no un `map` dentro de un `ScrollView`: con
  cien elementos, la diferencia se nota en el teléfono de quien lo usa.

## 6. Contenido que cambia de tamaño

El texto no mide lo mismo en los seis idiomas: el alemán suele ser el más
largo y es el que rompe pestañas y botones. Deja que el texto fluya, decide
conscientemente dónde truncas y no cuentes con que quepa en una línea.

## 7. Verificación

- Míralo en **tres anchos**: teléfono (~375 px), tablet (~768 px) y escritorio
  (~1280 px). Y comprueba que **no hay scroll horizontal** en ninguno.
- Los e2e de la web ya corren en dos perfiles, Chromium de escritorio y Pixel
  7: si añades pantalla, añade su comprobación.
- En la app nativa, en un dispositivo o emulador real: lo que se ve bien en la
  web no siempre se ve bien en React Native.
- Repite el ancho estrecho con el idioma más largo (Regla 2) y en los dos temas
  (Regla 3).

> Una pantalla que solo funciona bien en escritorio no está terminada.
