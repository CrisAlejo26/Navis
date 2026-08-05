# RFC 0009: Exportar lo que se ve

- **Estado**: **Implementado** (API y web)
- **Fecha**: 2026-08-05 · implementado el mismo día
- **Apps afectadas**: **api y web** (escritorio la hereda: es la misma web
  dentro de Tauri). Móvil, no: ver «Fuera de alcance».
- **Depende de**: 0003 (creyentes), 0004 (profecías) y 0005 (sueños) para los
  datos, y del RFC 0002 en lo práctico: la lámina del calendario ya resolvió
  rasterizar un trozo de página y escribir un PDF sin librerías, y todo esto se
  monta encima.
- **Lo usa**: el RFC 0010 (listas compartidas), que exporta con este mismo
  juego sin añadir nada.

## Problema

Los datos ya están dentro y bien filtrados: quién pide atención, qué palabras
siguen esperando, cuántas noches se soñó. Y salen de la aplicación **haciendo
una captura de pantalla**, que es exactamente el problema que el RFC 0002 ya
resolvió para el calendario y que aquí sigue sin resolver.

Lo que hace falta va más allá de una imagen. Una lista de creyentes se lleva a
una reunión impresa, se manda por WhatsApp, se pega en un acta y —sobre todo—
se abre en Excel para seguir trabajando con ella: ordenar, sumar, marcar. Hoy
eso significa volver a teclear a mano lo que la pantalla ya tiene delante.

Y hay una condición que lo gobierna todo: **si hay filtros puestos, se exporta
lo filtrado**. Un botón que se lleva la tabla entera cuando en pantalla hay
cuarenta y siete filas de doscientas trece no ahorra trabajo: lo cambia de
sitio.

## Alcance

Entra:

- Exportar el listado de **creyentes**, el de **profecías** y el de **sueños**.
- Cinco formatos: **Excel**, **PDF**, **imagen**, **Markdown** y **CSV**.
- El Excel **con estilos de verdad**: banda de encabezado en el azul de la
  marca, fila fija, filtro automático, anchos calculados, fechas que son
  fechas, colores que salen del dato y una segunda hoja de resumen.
- Respetar los filtros de la URL, y también la **selección** de filas cuando la
  pantalla la tiene (creyentes).
- Los textos, en los seis idiomas, y el fichero en el idioma de quien exporta.

### Fuera de alcance

- **La app móvil.** Como en las RFC 0002 (§8.7), 0003 (§7.9), 0004 y 0005: la
  forma se decide en web. Además, aquí la razón es más dura que la costumbre:
  el rasterizado y el `<canvas>` que hacen la imagen y el PDF son del DOM, y en
  React Native no existen. Llevarlo a móvil no es escribir el JSX otra vez, es
  otra implementación. Cuando toque, será su propio RFC.
- **Exportar la bitácora entera de un creyente** (sus notas, sus audios). Es
  otro documento, con otra forma: no es una tabla, es un historial. Se mira
  cuando alguien lo pida.
- **Exportaciones programadas** («mándame los creyentes sin nota cada lunes»).
  Eso es correo saliente y una tarea periódica, y hoy el proyecto no tiene ni
  una cosa ni la otra. Va con el RFC 0006.
- **Importar.** Leer un Excel de fuera y crear creyentes con él es una
  funcionalidad distinta y bastante más peligrosa —duplicados, columnas que no
  cuadran, deshacer—. No se cuela aquí por parecerse en el nombre.
- **`.ods` y Numbers.** Los dos abren `.xlsx` sin quejarse. Un formato más es
  otro escritor que mantener para el mismo resultado.

## Vocabulario

| Palabra          | Qué es                                                            |
| ---------------- | ----------------------------------------------------------------- |
| **Exportación**  | Un fichero con lo que hay en pantalla, en el formato que se elija |
| **Columna**      | Una columna del fichero, declarada una vez por módulo (D7)        |
| **La hoja**      | El objeto de la vista previa, que cambia de piel según el formato |
| **Lo que se ve** | El filtro puesto en la URL, más la selección si la hay (D1)       |
| **Truncado**     | Cuando el filtro da más filas de las que se dejan salir (D3)      |

## Decisiones tomadas

- **D1 — Se exporta lo que se está viendo, no la tabla.** Los filtros viven en
  la URL (`useTableQuery`) desde el RFC 0003, y la exportación los usa tal cual:
  la misma consulta que pinta la pantalla es la que llena el fichero. Con
  selección de filas puesta, manda la selección, y el diálogo lo dice con
  palabras: «12 seleccionados» frente a «47 de 213 con los filtros puestos».

  El corolario importante: **no hay un botón de "exportar todo"**. Quitar los
  filtros y volver a exportar es un gesto, y es el que deja claro qué se lleva.

- **D2 — El fichero lo escribe el navegador, no el servidor.** Cuatro razones,
  y ninguna es la comodidad:

  1. **El idioma.** Los seis idiomas viven en `packages/i18n` y los consume la
     interfaz. Un Excel generado en la API saldría en español o habría que
     duplicar las traducciones en el servidor (Regla 2).
  2. **El color.** Los acentos de sedes, dones, labores y emociones son datos
     de la iglesia y de la persona, y ya están en el cliente pintándose.
  3. **La imagen y el PDF necesitan un navegador.** El rasterizado por
     `<foreignObject>` de `lib/calendar/rasterize.ts` no tiene equivalente en
     Node sin meter un Chrome headless en el contenedor de la API.
  4. **El VPS.** Generar ficheros es trabajo de CPU y memoria; hacerlo en el
     aparato de quien pulsa el botón no le cuesta nada al servidor.

  Lo que sí pone el servidor son **las filas**, que es lo único que no puede
  saber el cliente porque el listado va paginado (D3).

- **D3 — Un endpoint `/export` por módulo, con tope y aviso.** No vale
  `?limit=2000` sobre el listado: `isPageSize` valida el tamaño de página
  contra una lista cerrada y está bien que siga cerrada, y además **la
  exportación lleva columnas que la fila del listado no tiene** —el cuerpo
  entero de una profecía, la interpretación de un sueño, lo que significó al
  cumplirse—. Son dos formas distintas del mismo dato, así que son dos
  endpoints.

  **Creyentes es la excepción y conviene decirlo**: una persona no tiene ningún
  campo largo que la fila trunque, así que su fila de exportación resultó ser
  la misma del listado y `BelieverExportRow` es un alias de `BelieverListItem`.
  El endpoint se queda igualmente: el día que la ficha crezca con algo que el
  listado no lleve, el sitio donde ponerlo ya existe.

  El tope es `EXPORT_MAX_ROWS = 2000`, en `packages/shared`. Al pasarse, la
  respuesta trae `truncated: true` y la interfaz lo dice antes de descargar
  nada: «Se exportan las primeras 2000. Afina los filtros para llevártelas
  todas.» **Un truncado silencioso es peor que un error**: el fichero parece
  completo y nadie vuelve a mirar.

- **D4 — Cinco formatos, y cada uno tiene un para qué.** Si no se puede
  escribir en una línea para qué sirve, sobra:

  | Formato      | Para qué                                             |
  | ------------ | ---------------------------------------------------- |
  | **Excel**    | Abrirlo y seguir trabajando: ordenar, sumar, marcar  |
  | **PDF**      | Mandarlo por WhatsApp o imprimirlo, sin que se toque |
  | **Imagen**   | Pegarlo en un chat de un tirón                       |
  | **Markdown** | Meterlo en un acta, un documento o un correo         |
  | **CSV**      | Metérselo a otro sistema                             |

  El CSV no estaba pedido y entra porque **sale gratis**: con el extractor de
  filas de D7 escrito, son quince líneas, y es el único que traga cualquier
  otra herramienta. El resto no: `.ods`, `.docx` y `.json` no tienen un para
  qué que no cubra ya uno de estos cinco.

- **D5 — El `.xlsx` se escribe a mano, sin librería.** Un `.xlsx` es un ZIP con
  seis ficheros XML dentro. Con el método `store` —sin comprimir, que Excel
  acepta— hace falta un escritor de ZIP con su CRC32: unas noventa líneas.

  La alternativa era `exceljs` o `xlsx`: entre 400 kB y 1 MB en el paquete, con
  dependencias de Node que hay que apuntalar para que corran en el navegador, y
  para usar un diez por ciento de lo que traen. Este repositorio ya tomó
  exactamente esta decisión con el PDF de la lámina (`lib/calendar/pdf.ts`,
  «cinco objetos y una tabla de posiciones al final») y salió bien.

  El riesgo real no es escribirlo, es **que Excel lo abra**: el formato es
  quisquilloso con el orden de los elementos y con las relaciones. Por eso hay
  un test que descomprime lo generado y comprueba las seis partes, y un
  criterio de aceptación que dice «se abre en Excel y en LibreOffice», que es
  la única prueba que vale de verdad.

- **D6 — El PDF es multipágina, y cada página es la lámina rasterizada.** Un
  PDF de texto de verdad —fuentes incrustadas, saltos de línea, tabla
  paginada— es otro proyecto, y con `WinAnsiEncoding` se rompería en el primer
  nombre que no quepa en Latin-1.

  Así que se hace lo que ya funciona: la tabla se pinta en trozos de N filas en
  un nodo oculto, cada trozo se rasteriza a JPEG con `nodeToJpeg` y cada JPEG es
  **una página** del PDF. `buildPdf` pasa de una página a varias, que es
  añadirle un bucle y una tabla de posiciones más larga.

  Lo que se pierde: el texto no se puede seleccionar ni buscar dentro del PDF.
  Lo que se gana: cualquier alfabeto, el diseño exacto de la aplicación, los
  colores del dato y ochenta líneas en lugar de trescientas cincuenta. Para un
  listado que se manda o se imprime, el cambio compensa. Si algún día hace
  falta buscar dentro, el camino es el CSV o el Excel, que ya están.

- **D7 — Las columnas se declaran una vez por módulo.** En
  `apps/web/src/lib/export/columns.ts` vive el tipo, y cada módulo pone el suyo
  en `lib/<modulo>/export-columns.ts`:

  ```ts
  interface ExportColumn<TRow> {
    key: string;
    /** Traducida: el fichero sale en el idioma de quien exporta. */
    header: (t: TFunction) => string;
    value: (row: TRow, t: TFunction) => ExportCell;
    width?: number;
    align?: 'left' | 'right';
  }

  type ExportCell =
    | { kind: 'text'; text: string }
    | { kind: 'number'; value: number }
    | { kind: 'day'; iso: string } // AAAA-MM-DD, ver D11
    | { kind: 'tag'; text: string; accent: string }; // el color viene del dato
  ```

  Los cinco escritores leen **esta** descripción y ninguno sabe qué es un
  creyente. Es lo que hace que el RFC 0010 exporte listas sin escribir un
  escritor más, y lo que evita cinco veces la misma columna en cinco sitios
  (Regla 1).

- **D8 — El Excel lleva dos hojas: los datos y el resumen.** La segunda cuenta
  lo que hay en la primera —por estado, por sede, por don, por labor, por
  emoción, por año— con **barras dentro de la celda** (`dataBar` de formato
  condicional) en el color del dato. Se lee de un vistazo y es lo que convierte
  un volcado en un informe.

  Y se cuenta **sobre las filas exportadas, en el cliente**, no pidiéndole al
  servidor su resumen: si el resumen viniera de otra consulta, tarde o temprano
  diría 213 en una hoja donde hay 47 filas. El fichero tiene que ser coherente
  consigo mismo por construcción, no por suerte.

- **D9 — En el Excel los colores van en hexadecimal, y es la única excepción.**
  Excel no sabe de tokens, ni de tema claro y oscuro, ni de `oklch`. La banda
  de encabezado es **`#2140CF`**, el azul de la marca (Regla 7), con el texto
  en blanco; los tonos de las etiquetas se calculan mezclando el acento del
  dato con blanco al 15 %, en JS, y no los elige nadie a ojo.

  Un fichero de Excel es siempre claro: no hay tema que seguir. Por eso esto no
  incumple la Regla 3 —no hay dos temas que atender—, pero **sí sale de
  `themeColorsHex` y de `ACCENT_PALETTE`**, que es de donde ya salen los
  colores de la lámina.

- **D10 — Las fechas van con el formato corto del sistema (`numFmtId` 14).**
  Escribir `dd/mm/yyyy` a mano deja el fichero en español para siempre: quien
  lo abra en Alemania querrá `TT.MM.JJJJ`. El formato 14 es el **corto
  integrado** de Excel y se pinta con la configuración regional de quien abre
  el fichero. Y el valor es un número de serie de Excel, no una cadena: así se
  ordena, se filtra por rango y se le puede restar otra fecha.

  Cuidado con el número de serie: cuenta desde el 1899-12-30 y **Excel se cree
  que 1900 fue bisiesto**. La conversión va en un solo sitio, con su test, como
  `iso-day.ts` en la API.

- **D11 — Un día de calendario no se convierte con `new Date(iso)`.** Es la
  trampa que ya está escrita en `CLAUDE.md` por partida doble —`iso-day.ts` en
  la API y `formatDay` en la web—: `new Date('2026-03-14')` es medianoche
  **UTC** y en Bogotá se pinta el 13. La celda `{ kind: 'day' }` existe
  justamente para que ningún escritor tenga la tentación: recibe el texto
  `AAAA-MM-DD` y cada uno lo trata como lo que es.

- **D12 — La exportación lleva lo que la pantalla enseña, y exige lo mismo.**
  El endpoint de creyentes va detrás de `believers.view`, con
  `ActiveChurchGuard`; los de profecías y sueños, filtrados por dueño y sin
  permiso de rol (RFC 0004 D2 y 0005 D2). **No se añade un permiso
  `export.*`**: quien puede ver un dato en pantalla puede copiarlo a mano, así
  que un permiso aparte para exportarlo no protege nada y sí da la falsa
  sensación de que sí.

  Lo que **no** sale nunca es lo que no está en la pantalla de origen: los
  audios, las fotos y el identificador interno. Un `uuid` en una columna es
  ruido para quien lo lee y un dato de más para quien no debería tenerlo.

- **D13 — Elemento firma: la hoja que cambia de piel** (§7.3). Un solo objeto
  en el diálogo —una hoja de papel a escala— que se transforma al elegir
  formato: se le pone la banda azul y la cuadrícula para Excel, sombra de
  varias páginas para PDF, se cuadra para imagen, se vuelve monoespaciada para
  Markdown. No cinco vistas previas: **una que se convierte**.

- **D14 — Una audacia por pantalla** (Regla 9 §4). La hoja es la única. Los
  formatos son pastillas (`Chip`, que ya existe), las acciones son los
  `MenuButton` de la lámina y el resto del diálogo se calla.

### Preguntas abiertas

- **¿Y si alguien exporta doscientas mil filas?** Hoy el tope de 2000 lo hace
  imposible, y con eso basta para una iglesia. El día que no baste, la respuesta
  no es subir el número: es generar en el servidor y mandar un enlace por
  correo, que es otra funcionalidad y otro RFC.
- **¿Se guarda quién exportó qué?** Un registro de exportaciones tiene sentido
  cuando hay datos sensibles saliendo del sistema, y aquí los hay. No entra
  ahora porque nadie lo ha pedido y añade una tabla; se anota para el día que
  alguien pregunte «¿quién se llevó la lista de teléfonos?».
- **¿Merece la pena el `.xlsx` comprimido?** El método `store` deja un fichero
  entre tres y cinco veces más grande. Con 2000 filas son unos pocos cientos de
  kilobytes y no molesta. Si molestara, `CompressionStream('deflate-raw')` está
  en todos los navegadores que soporta el proyecto y es cambiar una función.

## Modelo de datos

**Ninguna tabla nueva, ninguna columna nueva.** Esto es una vista distinta de
lo que ya hay, y esa es la mitad de su gracia.

Lo único que se añade a `packages/shared`:

```
EXPORT_MAX_ROWS = 2000          — el tope, compartido por API y web (D3)
exportQuerySchema                — los filtros del listado + `ids`
ExportResponse<TRow>             — { rows, total, returned, truncated }
```

## API

Tres endpoints, uno por módulo. Todos bajo `/api/v1`.

| Método | Ruta                 | Acceso                                 | Descripción                    |
| ------ | -------------------- | -------------------------------------- | ------------------------------ |
| GET    | `/believers/export`  | `believers.view` + `ActiveChurchGuard` | Las filas del listado, enteras |
| GET    | `/prophecies/export` | sesión, filtrado por dueño             | Lo mismo, de quien pide        |
| GET    | `/dreams/export`     | sesión, filtrado por dueño             | Lo mismo                       |

### 6.1 La consulta

Los **mismos parámetros que su listado**, sin `page` ni `perPage`, más uno:

- `ids` — lista de identificadores. Cuando viene, manda: es la selección de la
  pantalla y lo demás se ignora (D1). Se valida contra el tope igual que el
  resto, y **los identificadores vacíos se filtran antes de la consulta**: un
  `IN ('')` contra una columna `uuid` revienta en Postgres y a SQLite le da
  igual, que es la trampa que ya está en `CLAUDE.md`.

Se reutiliza el filtro que ya existe en cada módulo —`believers-filter.ts` y
sus equivalentes— sin escribir un segundo camino: dos formas de filtrar lo
mismo acaban filtrando distinto.

### 6.2 La respuesta

```
{
  rows: [...],        // hasta EXPORT_MAX_ROWS, con las columnas de la exportación
  total: 213,         // cuántas cumplen el filtro de verdad
  returned: 213,
  truncated: false    // total > EXPORT_MAX_ROWS
}
```

`total` y `returned` van separados a propósito: es lo que permite decir «se
exportan 2000 de 3140» en vez de enseñar 2000 y callarse.

### 6.3 Lo que llevan las filas

| Módulo        | Columnas                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Creyentes** | Nombre, apellidos, estado, sede, labores, dones, teléfono, última nota, días sin nota, nº de notas, alta                      |
| **Profecías** | Título, cuerpo entero, fecha de recepción, estado, fecha de cumplimiento, espera en días, cumplimientos parciales, alta       |
| **Sueños**    | Noche, día de la semana, título, cuerpo entero, emociones, interpretación, estado, fecha de cumplimiento, qué significó, alta |

El **cuerpo entero**, no el `excerpt`: la fila del listado lleva un extracto
porque es una fila, pero un fichero que se lleva el texto recortado sin avisar
es el mismo error que editar desde el listado (RFC 0005 §7.5, y `CLAUDE.md`).

## Interfaz

### 7.1 Dónde se pulsa

- **Creyentes** — en `BelieversToolbar`, junto al selector de vista. Y con
  filas marcadas, en la barra de selección que ya existe
  (`BulkCongregationBar`): «Exportar 12». La barra pasa a tener dos acciones y
  se renombra a `BulkBar`; asignar sede se queda como estaba.
- **Profecías** y **sueños** — en la barra de filtros de `/prophecies/list` y
  `/dreams/list`.

Icono `Download`, tamaño `md`, variante `secondary`: no es la acción principal
de ninguna de esas pantallas, y no debe competir con «Añadir».

### 7.2 El diálogo — `ExportSheet`

Es hermano de `ShareSheet` (RFC 0002 §9) y no su copia: comparten `Dialog`,
`Chip`, `MenuButton` y el juego de `lib/calendar/share.ts` —compartir,
copiar, descargar—, que sale de `lib/calendar/` a `lib/share/` porque a partir
de aquí lo usan cuatro sitios (Regla 1 §5: esto no son dos cosas parecidas, es
la misma).

De arriba abajo:

1. **Qué se lleva.** Una línea, en palabras, no en código: «47 de 213 filas ·
   Estado: activo · Sede: Elda». Los filtros de la URL leídos en el idioma de
   la interfaz. Si hay selección: «12 seleccionados». Si está truncado, la
   línea se tiñe en `warning` con su icono **y** su texto (Regla 3 §7).
2. **El formato**, cinco pastillas con su pista debajo (§7.4).
3. **La hoja** (§7.3).
4. **Las acciones**: `Descargar` (principal, `lg`), `Compartir` —solo si el
   aparato sabe (`canShareFiles`)— y `Copiar`, que en Markdown y CSV copia el
   texto y en imagen copia el PNG.

Con cero filas no se enseña un diálogo vacío: se enseña «No hay nada que
exportar con estos filtros» y el botón de quitarlos (Regla 9 §6).

### 7.3 La hoja (D13)

Una hoja de papel, con su proporción y su sombra, a la escala que quepa. Dentro
van **las primeras ocho filas de verdad**, no un dibujo: se ve el nombre de la
primera persona de la lista.

El texto que la acompaña es honesto en cada caso: «Las primeras 8 de 47 filas».
No dice «así va a quedar» en Excel, porque en Excel va a quedar como lo pinte
Excel.

Al cambiar de formato **no se sustituye la hoja: se le cambia la piel**, con un
fundido de 180 ms sobre `opacity` y `transform` y nada más (Regla 9 §5):

| Formato      | Qué le pasa a la hoja                                                   |
| ------------ | ----------------------------------------------------------------------- |
| **Excel**    | Le entra la banda azul `#2140cf`, la cuadrícula fina y la fila fija     |
| **PDF**      | Se apila: dos hojas asomando detrás, con el «1 de 3» abajo a la derecha |
| **Imagen**   | Se cuadra —una sola hoja, sin apilar— y aparece el borde del recorte    |
| **Markdown** | Cambia a monoespaciada, con las barras verticales y la fila de guiones  |
| **CSV**      | Lo mismo, con las comas y las comillas donde de verdad van a ir         |

Es lo único que se anima en el diálogo, y es lo que se recuerda de él.

A 375 px la hoja se reduce hasta caber y las pastillas pasan a dos filas: no
hay scroll horizontal (Regla 5 §7). Con `prefers-reduced-motion` el cambio de
piel es instantáneo.

### 7.4 La copia

En la voz de la aplicación: qué pasa y para qué sirve, en presente y sin
adornos (Regla 9 §6).

| Clave                 | Español                                               |
| --------------------- | ----------------------------------------------------- |
| `export.title`        | Exportar                                              |
| `export.rows`         | {{count}} de {{total}} filas                          |
| `export.selected`     | {{count}} seleccionados                               |
| `export.truncated`    | Se exportan las primeras {{max}}. Afina los filtros.  |
| `export.xlsx`         | Excel                                                 |
| `export.xlsxHint`     | Con estilos, para abrirlo y seguir trabajando         |
| `export.pdf`          | PDF                                                   |
| `export.pdfHint`      | Para mandarlo o imprimirlo                            |
| `export.image`        | Imagen                                                |
| `export.imageHint`    | Para pegarlo en un chat                               |
| `export.markdown`     | Markdown                                              |
| `export.markdownHint` | Texto plano, para un acta o un correo                 |
| `export.csv`          | CSV                                                   |
| `export.csvHint`      | Para meterlo en otro sistema                          |
| `export.download`     | Descargar                                             |
| `export.empty`        | No hay nada que exportar con estos filtros            |
| `export.failed`       | No se ha podido crear el fichero. Inténtalo otra vez. |
| `export.done`         | Exportado                                             |

Sección propia `export.*`, no claves sueltas colgando de `common` (Regla 2 §4).
Y en los seis idiomas, con el alemán mirado a 375 px, que es donde se rompen
las pastillas.

### 7.5 El nombre del fichero

`navis-creyentes-2026-08-05.xlsx`. Se entiende sin abrirlo, ordena solo por
fecha y no lleva acentos ni espacios. Se reutiliza el limpiador de
`posterFileName`, que ya hace exactamente eso.

Con filtro reconocible, se dice: `navis-creyentes-elda-2026-08-05.xlsx`.

## Cómo queda el Excel

Es la mitad de lo que se ha pedido, así que va con detalle.

### 8.1 La hoja de datos

```
┌──────────────────────────────────────────────────────────┐
│  IGLESIA EL FARO · CREYENTES            5 de agosto 2026 │  ← banda #2140CF,
├──────────────────────────────────────────────────────────┤     texto blanco
│  Estado: activo · Sede: Elda · 47 de 213 filas           │  ← #EEF1FC, 9 pt
├──────────────────────────────────────────────────────────┤
│ NOMBRE │ ESTADO │ SEDE │ LABORES │ … │ DÍAS SIN NOTA     │  ← fila fija,
├────────┼────────┼──────┼─────────┼───┼───────────────────┤     #2140CF blanco,
│ Ana …  │ Activo │ Elda │ Púlpito │ … │                12 │     filtro automático
```

- **Sin cuadrícula** (`showGridLines="0"`): los bordes finos hacen el trabajo y
  el resultado se parece a un documento y no a una hoja de cálculo en bruto.
- **Fila fija** en la del encabezado (`pane` con `state="frozen"`) y **filtro
  automático** en todo el rango: es lo primero que hace cualquiera al abrirlo.
- **Cebra** al 3 % en las filas pares, y borde inferior fino en todas.
- **Anchos calculados** del contenido, entre 8 y 48 caracteres, con
  `wrapText` en las columnas de texto largo.
- **Las etiquetas —estado, dones, labores, emociones— llevan el color de su
  dato**: relleno sólido con el acento mezclado con blanco al 15 % y el texto
  en el acento. Es lo mismo que hace la pantalla, y por el mismo motivo: el
  color entra por el dato (RFC 0005 §7.1.1).
- **Los números son números y las fechas son fechas** (D10). Los días sin nota
  se pueden ordenar y las fechas se pueden filtrar por rango.
- **Congelado el idioma de quien exporta**, encabezados incluidos.

### 8.2 La hoja «Resumen» (D8)

La misma banda arriba, y debajo bloques de conteos con **barra dentro de la
celda** en el color del dato:

```
POR ESTADO                        POR SEDE
Activo            128  ███████    Elda        84  ██████
En seguimiento     41  ██         Alicante    57  ████
Inactivo           44  ██         Sin sede    72  █████
```

Y las tres cuentas que responden a la pregunta de la pantalla de creyentes:
cuántos piden atención, cuántos no tienen ninguna nota y cuántos entraron este
mes. En profecías, el reparto por estado y la espera típica; en sueños, el
reparto por emoción y por día de la semana.

### 8.3 Lo que hay dentro del fichero

```
[Content_Types].xml
_rels/.rels
xl/workbook.xml            — las dos hojas
xl/_rels/workbook.xml.rels
xl/styles.xml              — fuentes, rellenos, bordes y formatos de número
xl/worksheets/sheet1.xml   — datos, con inlineStr (sin sharedStrings)
xl/worksheets/sheet2.xml   — resumen, con el dataBar
```

Repartido en ficheros cortos (Regla 6): `zip.ts`, `xlsx/styles.ts`,
`xlsx/sheet.ts`, `xlsx/workbook.ts`, `xlsx/serial.ts`. Cadenas **en línea** y
no en `sharedStrings`: se ahorra un fichero y una tabla de índices a cambio de
unos kilobytes, y con 2000 filas eso no se nota.

## Ficheros nuevos

```
packages/shared/src/schemas/export.ts     tope, esquema de consulta y respuesta

apps/api/src/believers/believers-export.service.ts
apps/api/src/prophecies/prophecies-export.service.ts
apps/api/src/dreams/dreams-export.service.ts
  (+ una ruta en cada controlador, que solo recibe y responde)

apps/web/src/lib/export/columns.ts        el tipo ExportColumn y ExportCell
apps/web/src/lib/export/rows.ts           de las filas a las celdas
apps/web/src/lib/export/markdown.ts
apps/web/src/lib/export/csv.ts
apps/web/src/lib/export/zip.ts            ZIP «store» + CRC32
apps/web/src/lib/export/xlsx/serial.ts    fecha ISO → número de serie de Excel
apps/web/src/lib/export/xlsx/styles.ts
apps/web/src/lib/export/xlsx/sheet.ts
apps/web/src/lib/export/xlsx/workbook.ts
apps/web/src/lib/export/file-name.ts
apps/web/src/lib/believers/export-columns.ts
apps/web/src/lib/prophecies/export-columns.ts
apps/web/src/lib/dreams/export-columns.ts
apps/web/src/components/export/export-sheet.tsx
apps/web/src/components/export/export-preview.tsx   la hoja (D13)
apps/web/src/components/export/export-page.tsx      el trozo que se rasteriza
apps/web/src/components/export/use-export.ts

apps/web/src/lib/share/                   sale de lib/calendar/: share, pdf,
                                          rasterize y print, ahora compartidos
```

## Consideraciones

- **Privacidad.** Un `.xlsx` de creyentes lleva teléfonos y sale del sistema
  para siempre: no hay forma de retirarlo. La interfaz no lo dramatiza,
  pero el permiso que lo protege es el mismo que protege la pantalla (D12), y
  la pregunta abierta de arriba deja anotado el registro de exportaciones.
- **Sin conexión.** Exportar necesita red: las filas las trae el servidor. La
  PWA carga sin conexión, pero el botón dice lo que pasa en vez de fallar en
  silencio.
- **IA.** Nada. Esto no toca el módulo `ai`.
- **Rendimiento.** 2000 filas rasterizadas por trozos de 40 son 50 imágenes: se
  hace en trozos con `await` entre uno y otro para no bloquear el hilo, y el
  botón queda en estado de carga con el número de página que va. Si tarda más
  de lo razonable, el diálogo lo dice.

## Alternativas descartadas

- **Generar en el servidor y devolver el fichero.** Es lo habitual y aquí es
  peor: se lleva por delante el idioma, el color y el rasterizado (D2). Se
  quedaría solo el CSV, que es justo el formato que menos falta hacía.
- **`exceljs` / `xlsx` (SheetJS).** Un megabyte para usar el diez por ciento,
  con dependencias de Node que apuntalar en el navegador (D5).
- **Un PDF de texto con fuentes incrustadas.** Trescientas cincuenta líneas,
  un problema de codificación en el primer nombre raro, y a cambio texto
  seleccionable que aquí no hace falta (D6).
- **Exportar solo la página que se ve.** Es lo que ya hace una captura de
  pantalla, y es el problema de partida.
- **Un menú de formatos en vez de un diálogo.** Cinco entradas de menú y a
  descargar. Se descarta porque se pierde lo único que hay que dejar claro:
  **qué** se está llevando. La línea de «47 de 213 · Sede: Elda» es la mitad de
  esta funcionalidad.

## Criterios de aceptación

- [ ] Con filtros puestos, el fichero trae exactamente esas filas, y el diálogo
      lo dice con palabras antes de descargar.
- [ ] Con filas marcadas en creyentes, se exportan solo esas.
- [ ] Por encima de 2000 filas se avisa **antes** y el fichero no miente.
- [ ] El `.xlsx` se abre sin avisos en **Excel y en LibreOffice**, con la banda
      azul `#2140cf`, la fila fija, el filtro automático y los anchos puestos.
- [ ] Las fechas del `.xlsx` se ordenan y se filtran como fechas, y se pintan
      con el formato regional de quien abre el fichero.
- [ ] La hoja «Resumen» cuadra con la hoja de datos, fila a fila.
- [ ] El PDF de 300 filas sale con todas sus páginas y se lee en un teléfono.
- [ ] La imagen se copia al portapapeles y se pega en WhatsApp.
- [ ] El Markdown se pega en un documento y la tabla se ve.
- [ ] El fichero sale en el idioma de la interfaz, en los seis.
- [ ] Un usuario no puede exportar profecías ni sueños de otro, y hay un e2e que
      lo intenta.
- [ ] Ninguna pantalla tiene scroll horizontal a 375 px, con el texto en alemán
      y en los dos temas.
- [ ] Los ficheros nuevos siguen dentro del objetivo de la Regla 6.
- [ ] `pnpm check` y `pnpm test:e2e` en verde, con los e2e de la API contra
      Postgres **y** SQLite.
