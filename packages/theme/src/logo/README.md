# Logo de Navis

**Este es el único sitio donde vive el logo.** Para cambiarlo, se sustituyen
estos SVG y se ejecuta `pnpm icons`: de aquí salen el favicon, los iconos de la
PWA, los del móvil y los del escritorio. Ningún otro fichero de imagen del
repositorio se edita a mano.

| Fichero                | Cuándo se usa                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `azul-sin-fondo.svg`   | Sobre fondo claro: pestaña del navegador, cabeceras, documentos                                    |
| `blanco-con-fondo.svg` | Iconos de aplicación: pantalla de inicio, dock, tiendas. Un icono con transparencia ahí se ve roto |
| `blanco-sin-fondo.svg` | Sobre el azul de la marca: primer plano del icono adaptativo de Android, cabeceras oscuras         |
| `Logo.ai`              | Original de Illustrator. No lo consume nada del código; está aquí para no perderlo                 |

El azul de la marca es **`#2140cf`**, tomado del propio logo.

## Dónde acaba cada variante

Lo decide `scripts/gen-icons.mjs`, en su lista `DESTINOS`, con el porqué de
cada elección. Un test compara byte a byte los iconos del repositorio con lo
que genera ese script, así que si alguien edita un PNG a mano, `pnpm check`
falla.
