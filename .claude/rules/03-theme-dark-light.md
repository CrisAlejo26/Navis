# Regla 3 — Los estilos deben funcionar en modo oscuro y modo claro

Todo estilo aplicado a elementos/componentes (divs, cards, botones, etc.) **debe**
verse y funcionar correctamente tanto en **modo claro** como en **modo oscuro**.

- **Usar los tokens de diseño semánticos** definidos en `src/app/globals.css`
  (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`,
  `bg-primary`, etc.). Estos tokens ya cambian de valor entre claro y oscuro
  automáticamente — es la forma preferida.
- **Modo oscuro por clase:** el tema oscuro se activa con la clase `.dark` en `<html>`
  (next-themes + variante `@custom-variant dark` de Tailwind v4). Si se necesita una
  excepción puntual, usar el prefijo `dark:` de Tailwind (`bg-white dark:bg-slate-900`).
- **Prohibido** usar colores fijos sin su contrapartida (p. ej. `bg-white`, `text-black`,
  hex sueltos) que rompan en el otro tema.
- **Verificación obligatoria:** revisar cada cambio visual en **ambos temas** antes de
  darlo por terminado (contraste, bordes, fondos y texto legibles en los dos).

> Ningún estilo se considera completo si solo se ve bien en uno de los dos temas.
