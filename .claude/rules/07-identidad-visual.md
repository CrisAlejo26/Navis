# Regla 7 — Nada de cruces en la identidad visual

**Prohibido usar la cruz** como símbolo en este proyecto: ni en el icono de la
aplicación, ni en el favicon, ni en el splash, ni en ilustraciones, ni como
elemento decorativo en la interfaz.

- **Símbolo de la marca:** el **barco** de Navis (_navis_ es «nave» en latín).
- **Fuente única:** `packages/theme/src/logo/`, con las tres variantes
  oficiales. De ahí salen con `pnpm icons` el favicon y todos los iconos de
  web, móvil y escritorio, que son SALIDA: no se editan a mano. Qué variante va
  en cada sitio está documentado en el README de esa carpeta.
- **Al añadir ilustraciones o iconos nuevos:** revisa que ninguno sea o insinúe
  una cruz. Los conjuntos de iconos genéricos (lucide, Ionicons) traen varios;
  hay que elegir otro.
- **Si hace falta cambiar el logo**, se sustituyen los SVG de esa carpeta y se
  ejecuta `pnpm icons`. Un test compara byte a byte lo que hay en el
  repositorio con lo que genera el script, así que un icono editado a mano hace
  fallar la verificación.

> Esta regla es sobre identidad visual, no sobre el contenido: la aplicación es
> para trabajo pastoral y el texto habla de lo que tenga que hablar.

El azul de la marca es **`#2140cf`**.
