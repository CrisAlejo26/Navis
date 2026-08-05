# Profecías en el navegador — guion de pruebas manuales

Guion para comprobar **a mano** la sección de profecías (RFC 0004) en un
navegador. Está escrito para que lo ejecute otra persona —o otro agente— sin
haber tocado el código: cada prueba dice qué hacer, qué tiene que pasar y qué
significa si falla.

> **Por qué existe.** Lo que se puede probar sin navegador ya está probado: 28
> tests unitarios de la API, 16 e2e de endpoints, 26 de la interfaz y el
> `pnpm build`. Lo que queda aquí es lo que **solo se ve mirando**: contraste,
> movimiento, anchos, foco y el idioma más largo.

## 0. Antes de empezar

### Qué hace falta

1. La base de datos migrada:

   ```bash
   pnpm db:migrate
   ```

   Sin esto, `GET /api/v1/prophecies/stats` devuelve **500** y la portada se
   queda en blanco: las tablas `prophecies` y `prophecy_fulfillments` no
   existen.

2. La API y la web levantadas (`pnpm dev`), y **dos cuentas distintas** —hacen
   falta para la prueba 8, que es la más importante de todas—.

3. Sesión iniciada con la primera cuenta.

### Datos de partida

Crea estas cuatro profecías desde la propia interfaz, que de paso prueba el alta.
Las fechas están elegidas para que salgan los tres estados y para que la
travesía tenga un tramo largo que dibujar:

| Título               | Recibida   | Cumplimientos parciales            | Cumplida   |
| -------------------- | ---------- | ---------------------------------- | ---------- |
| El ministerio        | 2019-03-14 | —                                  | —          |
| La casa junto al río | 2021-06-01 | «Apareció el terreno» (2023-02-10) | —          |
| Visión del camino    | 2024-01-20 | «Se abrió la puerta» (2024-09-05)  | 2025-11-30 |
| La espera corta      | (hoy)      | —                                  | —          |

Con esto: una en espera desde hace años, una en camino, una cumplida y una
recién apuntada.

---

## 1. La portada

**Ir a** `/prophecies`.

- [ ] La cabecera dice **«4 profecías · 3 esperan · 1 cumplidas»** (la frase, no
      cuatro tarjetas sueltas con un número).
- [ ] Hay **seis tarjetas**: Todas, En espera, En camino, Cumplidas este año,
      Espera típica y Tasa de cumplimiento.
- [ ] La tarjeta **«Todas»** lleva debajo una barra de tres colores con el
      reparto por estado.
- [ ] La tarjeta **«En espera»** nombra debajo **«El ministerio»**, que es la
      que más lleva esperando.
- [ ] La tarjeta grande de la **tasa** enseña un anillo con el porcentaje dentro
      y, al lado, «1 / 4».
- [ ] La tarjeta **«Todas»** lleva al pie **«Ver mis profecías»** con una flecha
      que avanza al pasar el ratón por encima. **No** hay ningún enlace suelto
      bajo el gráfico: esa llamada vive en la tarjeta.
- [ ] Debajo hay un gráfico de barras **«Cumplimiento mes a mes»** con **doce**
      columnas, incluidas las de los meses vacíos.
- [ ] El eje del gráfico usa **`05/26`**, no «mayo de 2026»: doce nombres de mes
      no caben y se solaparían.
- [ ] Al pasar por encima de una barra, el tooltip **sí** dice el mes con su
      nombre entero.
- [ ] Las seis tarjetas entran **escalonadas** al cargar, y el gráfico después.

**Qué significa si falla:** si el gráfico enseña menos de doce meses, se están
perdiendo los meses sin datos y la forma miente (§6.2).

### 1.1 El anillo se llena al entrar

- [ ] Recarga la página y mira el anillo: **crece desde cero** hasta su valor en
      algo más de medio segundo.
- [ ] Cambia de pestaña y vuelve: **no** se vuelve a animar. Solo la primera
      pintura.

### 1.2 La portada vacía

Con una cuenta **sin ninguna profecía** (la segunda cuenta sirve):

- [ ] **No** salen seis tarjetas a cero. Sale un texto —«Todavía no has apuntado
      ninguna profecía»— con el botón de añadir.

**Qué significa si falla:** cero por ciento y «todavía no hay nada» son cosas
distintas; enseñar ceros da a entender que se ha medido algo (§6.2).

---

## 2. Las tarjetas navegan

Desde `/prophecies`, pulsa cada tarjeta y comprueba la URL a la que llega:

| Tarjeta              | URL esperada                                  |
| -------------------- | --------------------------------------------- |
| Todas                | `/prophecies/list`                            |
| En espera            | `/prophecies/list?state=espera`               |
| En camino            | `/prophecies/list?state=camino`               |
| Cumplidas este año   | `/prophecies/list?state=cumplida&window=year` |
| Espera típica        | `/prophecies/list?sort=received&order=asc`    |
| Tasa de cumplimiento | `/prophecies/list?state=cumplida`             |

- [ ] Al llegar, el listado ya está filtrado y la pastilla correspondiente
      aparece encendida.
- [ ] **El botón de atrás** vuelve a la portada.

---

## 3. La travesía (el elemento firma)

**Ir a** `/prophecies/list` con la vista **Travesía** (es la de serie).

- [ ] Arriba hay un eje rotulado por años, de **2019** hasta el año actual.
- [ ] Cada profecía es una línea horizontal que **empieza** en su año de
      recepción.
- [ ] «La casa junto al río» tiene **un punto** a mitad del trayecto (el
      cumplimiento parcial de 2023).
- [ ] «Visión del camino» tiene un punto **y termina en un rombo** el día que se
      cumplió.
- [ ] «El ministerio» y «La espera corta» **no terminan**: se desvanecen hacia
      el borde derecho.
- [ ] A la derecha de cada fila hay un texto: «X días esperando» o «esperó X
      días» según el caso.

### 3.1 Se dibuja al entrar

- [ ] Recarga: los trayectos crecen de izquierda a derecha, **escalonados** —no
      todos a la vez—.
- [ ] Cada **fila** además sube y aparece, también escalonada: son dos capas de
      la misma cascada.

> **Si no ves ninguna animación en toda la sección**, lo primero que hay que
> mirar no es el código: es si quedó activada la emulación de
> **`prefers-reduced-motion: reduce`** en las herramientas de desarrollo (la de
> la prueba 11). Con ella puesta, todo aparece ya colocado a propósito.

### 3.2 Se lee sin ver

- [ ] Con un lector de pantalla (o inspeccionando el DOM), cada fila tiene un
      texto oculto del tipo «Recibida el 14 de marzo de 2019, En espera, 2617
      días».
- [ ] El trazado va `aria-hidden`: el lector **no** lo enumera.

**Qué significa si falla:** la travesía sería decoración inaccesible en vez de
un dato (§7.5).

---

## 4. Las otras tres vistas

El conmutador está arriba a la derecha de la barra de filtros (de `sm` para
arriba).

- [ ] **Tabla**: columnas Profecía, Recibida, Estado, Cumplimientos, Espera y
      acciones. Las cabeceras de Profecía, Recibida y Espera **ordenan** al
      pulsarlas.
- [ ] **Fichas**: rejilla; una columna en móvil, dos en tablet, tres en
      escritorio. El extracto se corta a tres líneas.
- [ ] **Las filas de la tabla y las fichas entran escalonadas** al cargar y al
      cambiar de página.
- [ ] **Año**: los doce meses en cuadrícula por año, con un punto por profecía
      recibida y un rombo por cumplida. **Los meses vacíos se ven vacíos.**
- [ ] Cambiar de vista es un **fundido**, sin desplazamiento lateral.

### 4.1 La vista se recuerda

- [ ] Elige **Fichas**, recarga la página: sigue en Fichas.
- [ ] Copia la URL y ábrela en otra pestaña: **también** sale en Fichas (la
      vista va en `localStorage`, no en la URL).
- [ ] Comprueba en `localStorage` que existe la clave `navis.propheciesView`.

**Qué significa si falla:** la forma de verlo es preferencia de quien mira, no
del enlace que se comparte (D11).

---

## 5. Filtros y búsqueda

Los filtros van en **dos grupos rotulados**, no en dos filas sueltas de
pastillas:

- [ ] Hay un grupo **«Estado»** y otro **«Recibida»**, cada uno con su rótulo en
      versalitas encima.
- [ ] De `lg` para arriba los dos grupos van **en línea**, separados por un
      filete vertical; por debajo se apilan.
- [ ] El botón **«Quitar los filtros»** aparece **solo cuando hay alguno
      puesto**, y al pulsarlo los quita todos.
- [ ] En el panel lateral de móvil ese botón sale **una sola vez**, no dos.

- [ ] Pulsa **«En espera»**: la URL pasa a `?state=espera` y el listado se
      reduce.
- [ ] Pulsa también **«En camino»**: la URL lleva los dos —`?state=espera&state=camino`—
      y salen las de ambos estados.
- [ ] Pulsa **«Este año»**: se añade `window=year`.
- [ ] **Atrás** deshace el último filtro, no toda la navegación.
- [ ] Copia la URL filtrada, ábrela en otra pestaña: **sale el mismo listado**.

### 5.1 La búsqueda va al servidor

- [ ] Busca **`vision`** (sin tilde): encuentra **«Visión del camino»**.
- [ ] Busca una palabra que solo esté en el **cuerpo** de una profecía, no en su
      título: la encuentra igual.
- [ ] Pon el listado en la página 2 y busca algo de la página 1: lo encuentra.

**Qué significa si falla:** si solo encuentra lo que ya está cargado, la
búsqueda se está resolviendo en el cliente y miente sobre lo que hay (D13).

---

## 6. Apuntar, editar y cumplir

### 6.1 Apuntar

- [ ] Pulsa **«Apuntar una profecía»**: el foco está en **Título** al abrir.
- [ ] El área de texto es **grande** (unas doce filas) y se puede agrandar
      arrastrando, pero **no** a lo ancho.
- [ ] El área de texto ocupa **todo el ancho del diálogo**: no se queda más
      estrecha que el campo de título ni deja un hueco a la derecha.
- [ ] Los campos de **fecha** sí son estrechos: un campo de día estirado a todo
      lo ancho se lee como un fallo de maquetación.
- [ ] La consola del navegador **no** enseña ningún aviso de HTML inválido
      («cannot be a descendant of», «cannot contain a nested»).
- [ ] Guarda: sale un aviso **«Profecía apuntada»** y aparece en el listado sin
      recargar.

### 6.2 El interruptor de cumplida

- [ ] En el formulario, enciende **«Ya se cumplió»**: aparece un campo de fecha
      **ya relleno con hoy**.
- [ ] Apágalo: el campo desaparece.
- [ ] Enciéndelo y pon una fecha **anterior** a la de recepción. Al guardar
      sale: **«No puede haberse cumplido antes de recibirse»**.

### 6.3 Cumplimientos parciales

- [ ] En «El ministerio», pulsa **«Anotar un cumplimiento»**. El foco está en el
      texto.
- [ ] Guarda uno con fecha de este año: la profecía pasa sola a **«En camino»**.
- [ ] Vuelve a la travesía: ahora tiene **un punto** en su trayecto.
- [ ] Anota otro con fecha **anterior a 2019-03-14**: sale **«Eso es anterior a
      la fecha en que la recibiste»**.

### 6.4 Cerrar y reabrir no pierde nada

- [ ] Marca «La casa junto al río» como cumplida. Pasa a **Cumplida** y su
      trayecto se cierra con un rombo.
- [ ] Abre su ficha: **el cumplimiento parcial de 2023 sigue ahí**.
- [ ] Edítala y **apaga** el interruptor. Vuelve a **«En camino»** —no a «En
      espera»— y el cumplimiento **sigue ahí**.

**Qué significa si falla:** que se cerrara entera no borra lo que se fue
cumpliendo por el camino (D6).

### 6.5 Editar desde el listado no recorta el texto

- [ ] En el listado (vista Tabla), pulsa el lápiz de una profecía **larga**.
- [ ] El área de texto trae **el texto completo**, no el extracto de tres
      líneas.
- [ ] Guarda sin tocar nada y abre la ficha: el texto **sigue entero**.

**Qué significa si falla:** es pérdida de datos silenciosa. La fila del listado
solo trae un extracto; el formulario tiene que pedir la profecía entera.

---

## 7. La ficha

**Ir a** `/prophecies/:id` pulsando el título de una profecía.

- [ ] Dos columnas de `lg` para arriba: identidad a la izquierda, texto y
      cumplimientos a la derecha.
- [ ] La columna izquierda es **pegajosa** al desplazar.
- [ ] La frase de la espera dice «Recibida el … · X días esperando», o «Cumplida
      el … · esperó X días» si está cerrada.
- [ ] El texto de la profecía **respeta los saltos de línea** y no cruza la
      pantalla entera: se corta a un ancho de lectura.
- [ ] Los cumplimientos van **de más reciente a más antiguo**, unidos por un
      filete vertical con un punto por cada uno.
- [ ] En una profecía sin cumplimientos sale el texto de invitación, no un hueco.
- [ ] Borrar la profecía **vuelve al listado**; borrar un cumplimiento **se queda
      en la ficha**.

### 7.1 Marcar como cumplida sin dar cuatro vueltas

- [ ] Mientras la profecía sigue abierta, la **acción principal** de la columna
      izquierda es **«Ya se cumplió»** (48 px, con su ancla).
- [ ] Al pulsarla se abre un diálogo pequeño con **un solo campo**: la fecha, ya
      puesta con hoy. **No** aparece el formulario grande con el texto.
- [ ] Al guardar, la profecía pasa a **Cumplida** y sale el aviso «Marcada como
      cumplida».
- [ ] Con la profecía ya cumplida, ese botón **desaparece** y en su sitio hay
      **«Volver a abrirla»**.
- [ ] Pulsa «Volver a abrirla»: vuelve a su estado anterior y **los
      cumplimientos parciales siguen ahí**.
- [ ] Si pones una fecha anterior a la de recepción, el diálogo lo rechaza sin
      llegar a guardar.

### 7.2 Las cuatro formas de leerla

Arriba a la derecha de la columna hay un conmutador con cuatro opciones.

- [ ] **Bitácora**: el texto arriba y los cumplimientos debajo, en secuencia,
      unidos por un filete vertical.
- [ ] **Lectura**: solo el texto, **más grande y más aireado**, sin la lista de
      cumplimientos. Es la de releer.
- [ ] **Recorrido**: el trayecto de **esta** profecía en el tiempo, con su eje
      de años y una marca por cumplimiento; debajo, cada uno con su fecha a la
      izquierda. Aquí **no** se enseña el texto de la profecía.
- [ ] **Fichas**: cada cumplimiento en su tarjeta, en dos columnas de `sm` para
      arriba, y el texto de la profecía encima.
- [ ] Cambiar de vista es un **fundido**, sin desplazamiento.
- [ ] En **Bitácora**, los cumplimientos aparecen **de arriba abajo**, uno tras
      otro, no todos de golpe.
- [ ] En **Recorrido**, el trayecto se dibuja y los cumplimientos entran
      escalonados debajo.
- [ ] Elige **Recorrido**, recarga: sigue en Recorrido.
- [ ] Comprueba en `localStorage` que existe la clave `navis.prophecyView`.

**Qué significa si falla:** cada vista responde a una pregunta distinta; si dos
se parecen demasiado, sobra una.

---

## 8. La privacidad — la prueba que no se puede saltar

Esta es la más importante: es la única barrera de acceso que tiene el módulo
(D1). Hacen falta **dos cuentas**.

1. Con la cuenta A, abre una profecía y **copia su identificador** de la URL.
2. Cierra sesión. Entra con la cuenta B.

- [ ] `/prophecies` de B enseña la portada **vacía**, no las de A.
- [ ] `/prophecies/list` de B está **vacío**.
- [ ] Pega la URL `/prophecies/<id-de-A>`: **no** se ve la profecía de A.
- [ ] En la pestaña de red, esa petición devuelve **404**, no 403 ni 200.

**Qué significa si falla:** es una fuga de datos privados. Un 403 tampoco vale:
confirmaría que esa profecía existe.

### 8.1 Con un rol sin permisos

- [ ] Entra con una cuenta cuyo rol **no** tenga casi ningún permiso (por
      ejemplo, `creyente`).
- [ ] **«Profecías» aparece en la navegación** y la sección se abre con
      normalidad.

**Qué significa si falla:** los permisos `prophecies.*` se han vuelto a colar en
algún sitio. Se retiraron a propósito (D2): son de cada usuario, no del rol.

### 8.2 No depende de la iglesia

- [ ] Si tienes más de una iglesia, cambia de iglesia en el selector de arriba.
- [ ] Las profecías **no cambian**: siguen siendo las mismas.

---

## 9. Los tres anchos

Con las herramientas de desarrollo, en modo dispositivo:

### 375 px (teléfono)

- [ ] **No hay scroll horizontal** en ninguna pantalla.
- [ ] El listado sale como **fichas**, nunca como tabla.
- [ ] Los filtros están detrás de un botón **«Filtros (2)»** que dice cuántos
      hay puestos, y se abren en un panel lateral.
- [ ] El botón **«Apuntar una profecía»** se ve entero y mide al menos 44 px de
      alto.
- [ ] El diálogo de alta **cabe en la pantalla** y hace scroll por dentro; no
      se sale por los lados.

### 768 px (tablet)

- [ ] Dos columnas en las tarjetas de la portada y en las fichas.
- [ ] La tabla oculta la columna **Cumplimientos**.
- [ ] El conmutador de vistas ya se ve.

### 1280 px (escritorio)

- [ ] Tres columnas en las tarjetas.
- [ ] La ficha en sus dos columnas.
- [ ] Todas las columnas de la tabla visibles.

---

## 10. Los dos temas

Con el selector de tema, en **claro** y en **oscuro**, repite en cada uno:

- [ ] Las tres pastillas de estado se leen, y cada una tiene **su icono** además
      de su color.
- [ ] Las barras del gráfico mensual se distinguen del fondo de la tarjeta.
- [ ] El anillo de la tasa se distingue de su pista.
- [ ] Los puntos y el rombo de la travesía se ven sobre la línea.
- [ ] Recorre la pantalla **con el tabulador**: el foco se ve siempre, en los
      dos temas.

### 10.1 El tema del sistema

- [ ] Pon el tema en **«Sistema»** y cambia el del sistema operativo con la
      aplicación abierta: los gráficos **cambian de color al momento**.

**Qué significa si falla:** los colores de recharts se capturaron una vez al
cargar en vez de leerse en cada render (D8).

---

## 11. Movimiento reducido

En las herramientas de desarrollo, activa `prefers-reduced-motion: reduce`
(en Chrome: _Rendering_ → _Emulate CSS media feature prefers-reduced-motion_).

- [ ] Recarga `/prophecies`: el anillo **aparece ya lleno**, sin animarse.
- [ ] Recarga `/prophecies/list`: los trayectos **aparecen dibujados**, sin
      crecer.
- [ ] Las seis tarjetas de la portada **aparecen ya colocadas**, sin subir ni
      escalonarse.
- [ ] En la ficha, la columna de identidad y los cumplimientos **aparecen sin
      animarse**.
- [ ] Cambiar de vista —tanto en el listado como en la ficha— **no** hace
      fundido.
- [ ] La flecha de «Ver mis profecías» **no** se desplaza al pasar por encima.
- [ ] **Nada** se mueve en ninguna de las tres pantallas.

**Qué significa si falla:** es un problema de accesibilidad, no un detalle
(Regla 9 §5).

---

## 12. El idioma más largo

Cambia el idioma a **alemán**, que es el que rompe las cosas, y repite a
**375 px**:

- [ ] Las pastillas de estado (`Offen`, `Unterwegs`, `Erfüllt`) no se salen ni
      se solapan.
- [ ] Las etiquetas de las tarjetas (`Dieses Jahr erfüllt`, `Erfüllungsquote`)
      caben o parten en dos líneas limpiamente.
- [ ] El botón **«Eine Prophetie festhalten»** no desborda su tarjeta.
- [ ] Sigue sin haber scroll horizontal.

Y de paso, en cualquier idioma:

- [ ] Las fechas salen en el formato de ese idioma.
- [ ] Los números de más de mil llevan **el separador de miles** de ese idioma.
- [ ] **No** se ve ninguna clave en crudo del tipo `prophecies.algo`.

---

## 13. Rendimiento del trozo de gráficos

- [ ] Abre la pestaña de **red**, filtra por JS y carga `/prophecies/list`
      **directamente** (no pasando por la portada).
- [ ] **No** se descarga ningún fichero `charts-*.js`.
- [ ] Ahora ve a `/prophecies`: **entonces sí** se descarga.

**Qué significa si falla:** recharts habría entrado en el bundle inicial y toda
la aplicación pagaría ~370 kB por una pantalla (D8).

---

## Al terminar

Apunta lo que haya fallado con: qué prueba, qué navegador, qué ancho, qué tema y
qué idioma. Si algo se ve mal pero no está en este guion, apúntalo igual — este
documento se queda corto a propósito en todo lo que ya cubren los tests
automáticos.

Lo que se encuentre aquí y sea reproducible **merece un test**: si es de la API,
en `apps/api/test/prophecies.e2e-spec.ts`; si es de interfaz, junto a su
componente; y si necesita un navegador de verdad, es la señal de que toca
escribir por fin la suite de Playwright de esta sección.
