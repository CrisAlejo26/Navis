# Regla 7 — Nada de cruces en la identidad visual

**Prohibido usar la cruz** como símbolo en este proyecto: ni en el icono de la
aplicación, ni en el favicon, ni en el splash, ni en ilustraciones, ni como
elemento decorativo en la interfaz.

- **Símbolo de la marca:** el **cayado de pastor**. Es lo que da nombre al
  proyecto y no arrastra la carga de la cruz.
- **Fuente única:** `scripts/brand-shape.mjs`, donde está la geometría. De ahí
  salen con `pnpm icons` **tanto el SVG como todos los PNG** de web, móvil y
  escritorio. El `brand-icon.svg` de `packages/theme` es salida, no entrada: no
  se edita a mano, igual que los PNG.
- **Al añadir ilustraciones o iconos nuevos:** revisa que ninguno sea o insinúe
  una cruz. Los conjuntos de iconos genéricos (lucide, Ionicons) traen varios;
  hay que elegir otro.
- **Si hace falta cambiar el símbolo**, se toca `scripts/brand-shape.mjs` y se
  ejecuta `pnpm icons`. Un test compara byte a byte lo que hay en el
  repositorio con lo que genera el script, así que un PNG editado a mano hace
  fallar la verificación.

> Esta regla es sobre identidad visual, no sobre el contenido: la aplicación es
> para trabajo pastoral y el texto habla de lo que tenga que hablar.
