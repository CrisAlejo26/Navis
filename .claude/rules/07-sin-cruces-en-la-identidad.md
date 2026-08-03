# Regla 7 — Nada de cruces en la identidad visual

**Prohibido usar la cruz** como símbolo en este proyecto: ni en el icono de la
aplicación, ni en el favicon, ni en el splash, ni en ilustraciones, ni como
elemento decorativo en la interfaz.

- **Símbolo de la marca:** el **cayado de pastor**. Es lo que da nombre al
  proyecto y no arrastra la carga de la cruz.
- **Fuente única:** `packages/theme/src/brand-icon.svg`. Los PNG de todas las
  plataformas se generan desde ahí con `pnpm icons`; no se dibuja un icono a
  mano en ninguna app.
- **Al añadir ilustraciones o iconos nuevos:** revisa que ninguno sea o insinúe
  una cruz. Los conjuntos de iconos genéricos (lucide, Ionicons) traen varios;
  hay que elegir otro.
- **Si hace falta cambiar el símbolo**, se cambia el SVG de origen y se
  regeneran los PNG. Nunca se toca un PNG suelto: acaban desincronizados.

> Esta regla es sobre identidad visual, no sobre el contenido: la aplicación es
> para trabajo pastoral y el texto habla de lo que tenga que hablar.
