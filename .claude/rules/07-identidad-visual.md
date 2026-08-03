# Regla 7 — La identidad visual: el barco, y nada de cruces

**Prohibido usar la cruz** como símbolo en este proyecto: ni en el icono de la
aplicación, ni en el favicon, ni en el splash, ni en ilustraciones, ni como
elemento decorativo en la interfaz.

El símbolo de la marca es el **barco** de Navis (_navis_ es «nave» en latín).

> Esta regla es sobre identidad visual, no sobre el contenido: la aplicación es
> para trabajo pastoral y el texto habla de lo que tenga que hablar.

## 1. Las fuentes únicas

Todo lo demás es **salida** y no se edita a mano.

| Qué                                    | Fuente                        | Se cambia con    |
| -------------------------------------- | ----------------------------- | ---------------- |
| Nombre, slug, scope, dominio y esquema | `brand.json`                  | `pnpm rename`    |
| El logo                                | `packages/theme/src/logo/`    | `pnpm icons`     |
| Los colores de la interfaz             | `packages/theme/src/tokens.*` | a mano (Regla 3) |

## 2. Las variantes del logo

| Fichero                | Cuándo se usa                                                         |
| ---------------------- | --------------------------------------------------------------------- |
| `azul-sin-fondo.svg`   | Sobre fondo claro: pestaña del navegador, cabeceras, documentos       |
| `blanco-sin-fondo.svg` | Sobre el azul de la marca: iconos de aplicación, cabeceras oscuras    |
| `blanco-con-fondo.svg` | Referencia del diseñador. **El build no la usa**: compone el fondo él |
| `Logo.ai`              | Original de Illustrator, guardado para no perderlo                    |

## 3. De dónde sale cada icono

`pnpm icons` los genera todos desde esos SVG, según la lista `DESTINOS` de
`scripts/gen-icons.mjs`: favicon, los PNG de la PWA (normal y _maskable_), el
apple-touch, los de Expo (icono, adaptativo, splash) y, llamando a `tauri
icon`, los de escritorio. También las versiones de
`packages/theme/src/logo/encuadrado/`, que son las que consume la interfaz.

**El encuadre no es el del SVG**: los originales traen mucho margen y el barco
está descentrado, así que `scripts/brand-logo.mjs` mide el dibujo y lo recentra
con la ocupación que pide cada destino —todo el cuadro en el favicon, 0,72 en
los iconos de aplicación, menos en los maskable y adaptativos, donde el sistema
recorta—. Si mañana llega un logo con otros márgenes, se ajusta solo.

## 4. El logo en la interfaz

En la web se usa **el componente `Logo`**, que es el único punto de entrada:
`variante="auto"` (lo normal) deja que mande el tema, y hay `azul` y `blanco`
para forzarlo. Son dos `<img>` con una escondida por CSS a propósito: un solo
`src` dinámico parpadea al cambiar de tema mientras carga la otra imagen.

No importes los SVG sueltos ni copies el archivo a `public/` de otra app.

## 5. El color

El azul de la marca es **`#2140cf`**, tomado del propio logo, y es el que se
usa como fondo de los iconos. En la interfaz vive en el token **`--brand`**
(`bg-brand`), que no cambia con el tema porque la marca no cambia.

El azul de los **controles** es el token `primary`, y es el mismo azul: en tema
claro vale exactamente `#2140cf`; en oscuro sube un punto para cumplir
contraste (Regla 3). Ninguno de los dos se escribe a ojo: salen del token.

## 6. Al añadir iconos o ilustraciones

- Los conjuntos genéricos traen cruces —lucide en web, Ionicons en móvil—:
  revisa el que elijas y, si lo es o lo insinúa, coge otro.
- Cuidado con lo que **parece** una cruz sin serlo: un «+» decorativo grande,
  dos barras cruzadas, un marco partido en cuatro. Si al mirarlo de lejos se
  lee como cruz, no vale.
- Un icono nunca va solo: etiqueta accesible o texto al lado (Reglas 2 y 5).

## 7. Cambiar el logo o el nombre

- **Logo**: sustituye los SVG de `packages/theme/src/logo/`, ejecuta
  `pnpm icons` y después `pnpm check`. Nada de retocar un PNG.
- **Nombre**: `pnpm rename <NuevoNombre>` (o `--dry-run` para ver qué tocaría).
  Cambia el nombre visible, el slug, el scope de los paquetes, el identificador
  nativo, el esquema de enlaces, el crate de Rust, las claves de
  almacenamiento y los proyectos de compose. Lo que **no** puede hacer solo, y
  te recuerda al terminar: la carpeta del proyecto, el repositorio, el dominio
  y la carpeta del servidor.

## 8. Trampas

- **Un test compara byte a byte** los iconos del repositorio con lo que genera
  el script: un icono editado a mano hace fallar `pnpm check`.
- **El `.icns` de Tauri no es reproducible**: sale distinto en cada ejecución.
  Si aparece como único cambio, es ruido.
- **`pnpm rename` recorre `git ls-files`**, así que lo ignorado por git no lo
  vería: por eso trata aparte `.env*` y `data/`, y apunta el slug abandonado en
  `docker/marcas-anteriores.txt` para que `scripts/limpiar-docker.sh` pueda
  limpiar el servidor.
- **`brand.json` no se edita a mano**: si el nombre y el resto de derivados se
  desincronizan, los tests de marca lo cantan.

> El logo sale de un solo sitio, se genera con un comando y no lleva cruces.
