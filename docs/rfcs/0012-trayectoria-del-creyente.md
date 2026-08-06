# RFC 0012: La trayectoria de un creyente

- **Estado**: **Implementado** (api y web)
- **Fecha**: 2026-08-06 · implementado el mismo día
- **Apps afectadas**: **api y web** (escritorio la hereda). Móvil, no.
- **Depende de**: 0003 (la ficha del creyente, que es la que crece).

## Problema

La ficha dice **qué** tiene una persona —sus dones, sus labores— y no dice
**cuándo**. Y el cuándo es la mitad del dato: no es lo mismo alguien que recibió
el Espíritu Santo hace veinte años que quien lo recibió el mes pasado, ni quien
lleva desde 2012 en la ofrenda que quien empezó en marzo.

Ese dato existe: está en el formulario de altas de la iglesia, en un Excel de
dos hojas. Hasta hoy no cabía en ningún sitio de Navis, así que se quedaba en el
Excel y la ficha nacía a medias.

## Alcance

Entra, todo **opcional**:

- **Cuándo llegó** a la iglesia y **por qué sede** entró.
- **Cuándo recibió cada don** y **cuándo empezó cada labor**.
- Tres cuentas: **Biblias leídas**, **vivencias leídas** e **institutos
  bíblicos**.
- Dos labores que faltaban en el catálogo: **vigilancia** y **micrófono**.
- Un comando para **importar el listado** desde el `.xlsx`.

No entra:

- **La tabla del listado no cambia.** Se pidió expresamente que se quedara como
  está: lo nuevo se ve en la ficha, que es donde se lee a una persona.
- **Quién autorizó** cada don o labor. Está en el Excel y se decidió no
  guardarlo.
- El resto de columnas del formulario —ciudad de nacimiento, documento,
  nacionalidad, idiomas—: no las pidió nadie y son datos personales que sin uso
  solo son responsabilidad.

## Decisiones

**D1. `ministries` sigue siendo una lista de `slug`, y las fechas van en un
mapa aparte.** Es la decisión que sostiene todo lo demás. `ministries` y
`giftIds` responden **qué** tiene esa persona, y eso lo consultan el calendario,
las listas, las etiquetas y la tabla; meterles la fecha dentro obligaría a tocar
quince sitios para que la ficha enseñe un dato que solo se mira en la ficha. Los
mapas `ministryDates` y `giftDates` dicen **cuándo**, y lo que no está en ellos
no tiene fecha, que es lo normal.

**D2. Manda la lista, no el mapa.** Al guardar, una fecha cuya clave no esté en
`ministries` o en `giftIds` se descarta. Así no puede quedar la fecha de una
labor que la persona ya no hace. Hay un e2e que lo fija.

**D3. Se guarda el día 1 del mes.** Se pregunta el mes —nadie recuerda el día en
que empezó con el sonido— y la interfaz pinta «mayo de 2012», nunca «1 de mayo».
Escribir el día sería inventarse una precisión que el dato no tiene.

**D4. Las cuentas que faltan no son cero.** Un creyente sin `bibleReadings` no
ha leído la Biblia cero veces: es que nadie lo ha apuntado. Por eso son nulables
y **la cifra que falta no se pinta**.

**D5. La sección desaparece si está vacía.** Sin ninguna fecha y sin ninguna
cuenta, la trayectoria no sale. Una sección vacía prometiendo datos que nadie ha
rellenado es peor que no tenerla.

**D6. Vigilancia y micrófono se añaden en una migración**, no solo a la
constante: `MinistriesService.ensureFor` únicamente siembra cuando el catálogo
está **vacío**, así que una iglesia que ya lo tuviera no las vería nunca.

## El importador

`apps/api/src/scripts/importar-creyentes.ts`, con su lector de `.xlsx` propio
—como el escritor de la web, sin librería—.

```bash
pnpm --filter @navis/api build
pnpm --filter @navis/api believers:import <fichero.xlsx> --iglesia <slug> [--seco]
```

**D7. Escribe a través de `BelieversService`**, levantando la aplicación con
`createApplicationContext`, y no con SQL a mano. El nombre de búsqueda, las
tablas puente y la validación son así exactamente los mismos que cuando alguien
da de alta a una persona desde la pantalla. Un importador con su propio camino
de escritura es un segundo sitio donde se decide qué es un creyente válido.

**D8. Es idempotente y no borra a nadie.** Casa por nombre normalizado dentro de
la iglesia y actualiza a quien ya esté. Quien esté en la base y no en el fichero
se queda: un listado es lo que alguien apuntó un día, no la verdad completa de
la iglesia.

**D9. Las dos hojas se cruzan por las palabras del nombre.** El teléfono está en
«FASE 1» y la trayectoria en «FASE 2», y hubo que probar tres formas:

| Cómo                | Aciertos de 39 | Por qué falla                                         |
| ------------------- | -------------- | ----------------------------------------------------- |
| Nombre exacto       | 27             | «Bedoya urrea» / «Urrea Bedoya», «Alzate» / «Alazate» |
| Número de documento | 27             | Una hoja trae la cédula colombiana y la otra el NIE   |
| Palabras del nombre | **38**         | —                                                     |

Hacen falta **dos palabras en común** y **no puede haber empate**: si lo hay, no
se casa a nadie, porque colgarle el teléfono de otro a alguien es peor que
dejarlo vacío. Quien se queda sin pareja sale por pantalla con su nombre.

**D10. El nombre se parte por los dos últimos.** En español lo normal son dos
apellidos. Es una heurística y falla con quien tiene uno solo —«Magda Alejandra
Osorio» sale como «Magda» + «Alejandra Osorio»—; se acepta porque la ficha se
corrige a mano en un segundo y la alternativa, dejarlo todo en el nombre, rompe
el orden alfabético del listado.

## Dónde vive

| Qué                                  | Dónde                                                    |
| ------------------------------------ | -------------------------------------------------------- |
| El contrato y los mapas de fechas    | `packages/shared/src/schemas/believers.ts`               |
| Las columnas y las dos tablas puente | `apps/api/src/believers/believer*.entity.ts`             |
| Guardar las fechas con su lista      | `apps/api/src/believers/believer-links.service.ts`       |
| El importador y su lector de `.xlsx` | `apps/api/src/scripts/`                                  |
| La línea de tiempo de la ficha       | `apps/web/src/components/believers/believer-journey.tsx` |
| Los campos del formulario            | `apps/web/src/components/believers/journey-fields.tsx`   |
