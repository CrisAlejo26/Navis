# Regla 2 — Los seis idiomas, siempre

Toda cadena visible para quien usa la aplicación va traducida a **los seis
idiomas**: español, inglés, francés, portugués, alemán e italiano. Nunca se
escribe texto suelto en un componente.

## Dónde viven

`packages/i18n/src/locales/`, un fichero por idioma: `es.ts`, `en.ts`, `fr.ts`,
`pt.ts`, `de.ts`, `it.ts`.

**El español es la referencia.** `es.ts` define el tipo (`export type
Translation = typeof es`) y los demás lo cumplen con `satisfies Translation`.
Consecuencia práctica: si añades una clave solo en español, **el proyecto no
compila** hasta que la traduces en los otros cinco. Es a propósito.

Dos detalles que ya han mordido:

- `es.ts` **no lleva `as const`**: sus valores deben ensancharse a `string`
  para que las otras traducciones puedan satisfacer el mismo tipo.
- Hay un test que comprueba que los seis ficheros tienen exactamente el mismo
  juego de claves. Si falla, es que falta una traducción.

## Cómo se usan

```tsx
const { t } = useTranslation();
<Text>{t('nav.believers')}</Text>;
```

`useTranslation` viene de `react-i18next` en web y en móvil: la instancia es la
misma, creada en `packages/i18n`.

## Al añadir textos

1. La clave, primero en `es.ts`, dentro de la sección que le toque.
2. La traducción **real** en los otros cinco. Nada de dejar el español de
   relleno ni la clave vacía.
3. `rtk pnpm check`: el tipado y el test te dirán si te has dejado alguno.

Lo que **no** se traduce: fechas, horas y números, que salen de `Intl` con el
idioma activo y ya están bien localizados.

> Si una cadena no está en los seis idiomas, la tarea no está terminada.
