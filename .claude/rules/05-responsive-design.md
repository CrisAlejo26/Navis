# Regla 5 — Diseño responsive

Toda interfaz **debe** funcionar y verse correctamente en **móvil, tablet y escritorio**.

- **Mobile-first:** diseñar primero para pantallas pequeñas y escalar hacia arriba con los
  breakpoints de Tailwind (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`).
- **Layouts fluidos:** preferir flex/grid, unidades relativas y `min/max-width` sobre
  tamaños fijos en píxeles; evitar desbordes horizontales.
- **Objetivos táctiles:** botones y elementos interactivos con tamaño y espaciado usables
  en táctil.
- **Contenido adaptable:** texto, imágenes y tablas deben reajustarse sin romper el layout
  en ningún tamaño.
- **Verificación obligatoria:** comprobar cada cambio visual en al menos un ancho de móvil,
  uno de tablet y uno de escritorio antes de darlo por terminado.

> Una pantalla que solo funciona bien en escritorio no está terminada.
