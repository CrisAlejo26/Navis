# Tarjetas de creyentes en móvil — altura uniforme y gestos

> **Estado: implementado** (2026-09-16). `SwipeableRow`, esqueleto fijo,
> `NoteComposer`, wiring y tests: hechos. Lo único pendiente de revisar a ojo
> es el ajuste de las pastillas en pantallas estrechas.
>
> **Rev. 2 — anatomía de Dreamkeeper**: a petición del usuario, el carril de
> clasificación se rediseñó sobre `components/pastor/believer-card.tsx` de
> Dreamkeeper: dones y labores como **pastillas de recuento** (icono +
> cantidad, tintadas con el acento del primer elemento) y las **etiquetas**
> con su nombre. La etiqueta de iglesia de Dreamkeeper no se copia — en Navis
> la sede ya vive en la línea del teléfono. Sin nada clasificado, una línea
> tenue («Sin clasificar todavía», clave `believers.noClassification`); las
> claves `noGifts`, `noMinistries` y `noTags` se retiraron de los seis
> idiomas. Se conserva el chevron de Dreamkeeper y la sonda a lo ancho de
> Navis al pie.

Rediseño solo de interfaz (móvil). Sin RFC: no toca entidad, API ni cliente.

## Objetivo y alcance

En el listado móvil de creyentes las tarjetas tienen alturas distintas según
los datos que trae cada persona: quien no tiene dones, labores ni etiquetas
queda en una tarjeta mínima y el listado parece una escalera. Además no hay
acciones rápidas: todo pasa por entrar a la ficha.

- **Entra**: esqueleto de altura fija en `BelieverCard`, acciones por gesto
  (derecha = añadir nota, izquierda = editar) siguiendo el patrón de
  `swipeable-row.tsx` de taskia, claves i18n y tests.
- **No entra**: la web (sus tarjetas de listado ya viven en otro diseño),
  la ficha de detalle, acciones de borrado por gesto (el borrado es una
  decisión, no un gesto — está en la ficha con confirmación) ni cambios de
  datos.

## Hallazgos

- **taskia** (`D:\Proyectos_personales\taskia\mobile`): `Swipeable` de
  `react-native-gesture-handler` con `friction: 2`, umbrales a 72 px, sin
  overshoot, acciones tintadas a fondo con icono + etiqueta y cierre
  automático al soltar. Se copia el mecanismo; los colores salen de los
  tokens de Navis.
- El gesto positivo (derecha, verde de éxito) va a **añadir nota**: es la
  pregunta de la pantalla (§7.2, «¿con quién no he hablado?»). El izquierdo
  (azul primario) a **editar**. Confirmado por el usuario.

## Dirección de diseño

- La tarjeta ya tenía una jerarquía pensada (§7.4): avatar + nombre, tres
  familias de clasificación con formas distintas y la sonda al pie. Se
  **conserva**: lo que cambia es que las tres familias pasan a ocupar
  **siempre una línea** — sin datos, una línea tenue con el nombre de lo que
  falta («Todavía ningún don anotado», «Sin labores», «Sin etiquetas»).
- Las pastillas se recortan a 2 visibles + «+N» para que una línea baste
  (`flex-nowrap`); el detalle enseña todas.
- El contador de notas baja a la fila de la sonda, siempre visible y atenuado
  a cero — antes desaparecía y cambiaba la altura.
- Gestos con el mismo radio que la tarjeta (`rounded-2xl`), etiqueta e icono
  como en taskia.

## Arquitectura

- `apps/mobile/src/components/ui/swipeable-row.tsx` — **nuevo**, genérico:
  acción izquierda y derecha con su color y etiqueta.
- `apps/mobile/src/components/believers/believer-card.tsx` — esqueleto fijo
  y `SwipeableRow` alrededor; desactivado en modo selección.
- `apps/mobile/src/components/believers/note-composer.tsx` — **nuevo**: la
  hoja de nota nueva cableada a `useCreateNote`/`useAddAudio` (los hooks
  fijan el creyente al montarse, así que va con `key` por creyente).
- `apps/mobile/app/(tabs)/believers.tsx` — estado `quickNote`/`quickEdit`,
  hoja de edición con el item del listado (`BelieverFormSheet` ya acepta
  `BelieverListItem`).
- `packages/i18n/src/locales/*` — `believers.noMinistries`, `noTags`,
  `swipeNote`, `swipeEdit`.

## Pasos

1. i18n (es define el tipo; después los cinco restantes).
2. `SwipeableRow` en `ui/`.
3. Esqueleto fijo en `BelieverCard`.
4. `NoteComposer` + wiring en la pantalla.
5. Mock de `Swipeable` en `jest.setup.js` (patrón del repo: el mock crece con
   lo que se ejercita) y tests.

## Animaciones

- La tarjeta conserva su `FadeInDown` de entrada.
- El gesto lo anima `Swipeable` (friction 2, sin overshoot); al soltar sobre
  el umbral la acción se ejecuta y la fila se cierra en el mismo tick, como
  en taskia.

## Plan de pruebas

- `believer-card.test.tsx` **nuevo**: tarjeta con datos llenos y otra vacía
  muestran los mismos carriles (placeholders incluidos); los gestos invocan
  la acción que toca y no se disparan en modo selección.
- `pnpm --filter @navis/mobile test` y `pnpm --filter @navis/mobile
typecheck`; al final `pnpm check`.
