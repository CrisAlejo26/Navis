# Regla 2 — Traducciones para todos los idiomas de la app

Toda cadena de texto visible para el usuario **debe** estar traducida a **todos** los
idiomas configurados en la aplicación. Nunca hardcodear texto en los componentes.

- **Fuente de verdad de los idiomas:** `src/i18n/routing.ts` (array `locales`).
  Actualmente: **`es`, `en`, `it`, `pt`, `de`, `fr`** (6 idiomas). Si se añade o quita un
  idioma allí, esta regla se aplica al nuevo conjunto automáticamente.
- **Archivos de traducción:** `messages/<locale>.json`. Al añadir una clave, agregarla en
  **los 6 archivos** (`es.json`, `en.json`, `it.json`, `pt.json`, `de.json`, `fr.json`)
  con la traducción real de cada idioma — no dejar claves vacías ni en español como
  placeholder.
- **Uso en código:** consumir las cadenas con `next-intl` (`useTranslations` /
  `getTranslations`), nunca con literales en JSX.
- **Verificación:** comprobar que todas las claves existen en todos los locales y que
  ninguno se queda atrás (mismo conjunto de claves en cada archivo).

> Si una cadena no puede traducirse a los 6 idiomas, no se considera terminada.
