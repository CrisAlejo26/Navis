# RFC 0011: Los festivos en el calendario

- **Estado**: **Implementado** (api y web)
- **Fecha**: 2026-08-06 · implementado el mismo día
- **Apps afectadas**: **api y web** (escritorio la hereda: es la misma web
  dentro de Tauri). Móvil, no: ver «Fuera de alcance».
- **Depende de**: 0002 (el calendario, de donde cuelga) y 0008 (las iglesias,
  que son las que dicen de dónde son).

## Problema

Un jueves festivo la reunión no se puede dar a la hora de siempre, y eso se
sabe **mirando otro calendario**: el del móvil, el de la pared, o preguntando.
El calendario de Navis enseña quién predica el 8 de diciembre y no que el 8 de
diciembre es fiesta, que es justo el dato con el que se decide adelantarla.

Adelantar la reunión lo hace una persona y seguirá haciéndolo una persona: aquí
no se automatiza ninguna decisión. Lo único que falta es **ver el dato en el
sitio donde se toma**.

## Alcance

Entra:

- Marcar en la rejilla del mes y en el panel del día los festivos
  **nacionales** y los de la **comunidad autónoma** de la iglesia.
- Que se mantengan al día **solos**, sin que nadie tenga que actualizar nada.
- Que la iglesia diga de dónde es: país y, si quiere, comunidad.

No entra —y conviene que se sepa por qué—:

- **Los festivos locales.** Los dos que fija cada ayuntamiento no están en
  ninguna fuente consultable: se publican en el bando del municipio. Prometer
  «municipal» sería prometer una casilla que quedaría siempre vacía.
- **Las fiestas propias de la iglesia** (aniversarios, campañas). Son otra
  cosa: un dato de la iglesia, no un festivo del país. Si hacen falta, van como
  reuniones o como una funcionalidad propia.
- **Móvil.** La app nativa todavía no tiene la rejilla del mes.

## Decisiones

**D1. Los festivos viajan dentro del día del calendario**, no en una consulta
aparte. `CalendarDay` gana `holiday`, y con eso lo tienen la rejilla, la agenda
y el cartel sin pedirlo cada uno por su lado. Una segunda consulta abriría la
puerta a pintar un mes con los festivos de otro tramo.

**D2. La fuente es date.nager.at**, que da los nacionales y los de cada
comunidad (`ES-AN`, `ES-MD`…) para unos ciento diez países, sin clave y sin
registro. Su respuesta se valida con zod en la frontera (`holidays/nager.ts`) y
sale de ahí ya normalizada: el resto del código no sabe de dónde vino.

**D3. Se cachea un año entero por fila, en JSON.** Son unas cincuenta entradas
que siempre se leen juntas y que se reemplazan de golpe. Una fila por festivo
daría una tabla que se consulta quince veces para pintar un mes sin ganar nada.

**D4. Refresco perezoso, sin tarea programada.** Al abrir un mes se mira si el
año está guardado; si no está o se guardó hace más de treinta días, se pide y se
guarda. Un cron anual sería una pieza más que puede fallar en silencio, y el
fallo se descubriría en marzo con el calendario en blanco.

Se comprobó lo que el usuario intuía: la fuente **ya tiene el año siguiente
publicado** con meses de antelación, así que una sola actualización al año basta
de sobra. Los treinta días son margen, no necesidad.

**D5. Si la fuente falla, se sirve lo guardado**, por viejo que sea, y si no hay
nada guardado, ningún festivo y ni un error. Las reuniones no dependen de esto:
un calendario sin marcas es un defecto, un calendario que no carga porque un
servicio de terceros está caído es un calendario roto.

**D6. `HOLIDAYS_API_URL` vacío lo apaga entero.** Es lo que usan los tests e2e
—una suite que depende de un servicio ajeno falla un día sin que nadie haya
tocado nada— y lo que deja la funcionalidad desactivable en una instalación sin
red.

**D7. La comunidad nace sin elegir.** Adivinársela a una iglesia por su ciudad
es acertar a medias, y un festivo de otra comunidad pintado en su calendario es
peor que ninguno. Sin comunidad, solo salen los nacionales.

**D8. El país y la comunidad son de la iglesia, no del calendario.** Los cuatro
calendarios de una iglesia caen en los mismos días.

**D9. Los nombres de las comunidades están escritos en `@navis/shared`.** La
fuente manda el código ISO 3166-2, no el nombre. Solo están las de España, que
es donde hay iglesias; para cualquier otro país el selector enseña el código,
que es un identificador de verdad y no un invento.

**D10. Si un día tiene dos festivos, manda el nacional.** Pasa —uno del país y
otro de la comunidad—, y en una celda de la rejilla solo cabe uno.

## Cómo se ve

En la rejilla, una línea fina bajo el número: un punto rojo —la convención del
calendario de pared— y el nombre del festivo. En vista compacta se queda solo el
punto, y el nombre viaja en el `title` y en la etiqueta accesible: **el color no
informa solo** (Regla 9 §5). Al abrir el día, el festivo va arriba del todo,
antes que las sedes, con su alcance escrito: «Festivo nacional» o «Festivo en
Andalucía».

## Dónde vive

| Qué                                            | Dónde                                               |
| ---------------------------------------------- | --------------------------------------------------- |
| El tipo, el filtro por comunidad, `ES_REGIONS` | `packages/shared/src/schemas/holidays.ts`           |
| La fuente, validada en la frontera             | `apps/api/src/holidays/nager.ts`                    |
| Caché, refresco y respaldo                     | `apps/api/src/holidays/holidays.service.ts`         |
| Dónde se pegan al día                          | `apps/api/src/calendar/schedule.service.ts`         |
| La marca en la rejilla                         | `apps/web/src/components/calendar/holiday-mark.tsx` |
| El país y la comunidad                         | `apps/web/src/components/church/holiday-fields.tsx` |

## Fuera de alcance

Festivos locales y municipales, fiestas propias de la iglesia, la app móvil, y
cualquier automatismo que mueva una reunión: eso lo decide una persona.

## Ampliación: selector geográfico en cascada

**D7 y D9 quedan revisadas.** D7 seguía siendo correcta —la comunidad nace sin
elegir—, pero D9 («la comunidad solo se despliega para España; para cualquier
otro país se escribe el código a mano») era una limitación de partida, no una
decisión definitiva: dejaba a cualquier iglesia fuera de España sin festivos
regionales y con un campo de texto que había que rellenar sabiendo el código
ISO 3166-2 de memoria. País, comunidad y ciudad pasan a ser un único selector
en cascada, y funciona igual para cualquier país. El detalle de la
implementación está en `docs/selector-geografico-plan.md`; aquí solo lo que
cambia del contrato de esta RFC:

- El país deja de ser un campo de texto de dos letras: es un buscador sobre la
  lista ISO 3166-1, con el nombre resuelto por `Intl.DisplayNames` —ya
  traducido a los seis idiomas sin fichero que mantener—.
- La comunidad se busca igual, y ahora con nombre para **cualquier país**, no
  solo España: los datos son un dataset ISO 3166-2 vendido con la licencia ISC
  de su origen, partido en un fichero por país y cargado solo cuando se elige
  ese país (D13 del plan). Sin ellos, sigue funcionando como hasta ahora: el
  código a mano.
- `regionLabel` (`packages/shared`) pasa a resolverse de forma perezosa
  también al pintar «Festivo en X»: la primera vez que aparece un festivo de un
  país sin comunidades ya cargadas, se ve el código un instante y el nombre en
  cuanto llega el fichero de ese país —el mismo país no se vuelve a pedir—.
- **Nada de esto toca la fuente de festivos ni el servidor de festivos**: sigue
  siendo `date.nager.at`, y ya daba nacionales y regionales para unos ciento
  diez países (D2). El problema nunca fue la fuente: era que la interfaz solo
  sabía poner nombre a las comunidades de España.
- **Ninguna migración de base de datos.** El país y la comunidad de la iglesia
  ya eran columnas de texto sin restricción de tamaño; lo que cambia es de
  dónde salen las opciones del formulario, y esos datos son estáticos y no de
  la instalación de nadie.
