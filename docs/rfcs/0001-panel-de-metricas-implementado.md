# RFC 0001: Panel de inicio con métricas

- **Estado**: Implementado
- **Fecha**: 2026-08-03 (ampliada 2026-08-08)
- **Apps afectadas**: api / web / mobile / desktop
- **Depende de**: 0002 (calendario), 0003 (creyentes)

## Problema

Al abrir la aplicación, un pastor quiere saber en diez segundos cómo va su
trabajo: a quién tiene pendiente de visitar, qué hay esta semana y si alguien
lleva demasiado tiempo sin contacto. Hoy esa información está en su cabeza o en
un cuaderno.

## Alcance

Entra: una pantalla de inicio con tarjetas de métricas, accesos directos a lo
que requiere atención, cómo está repartida la iglesia y la semana del
calendario a la vista, sin salir de la portada.

No entra: informes históricos de varios periodos, comparativas año contra año
ni exportación. Eso es un módulo de informes aparte. Lo que sí entró en la
ampliación de esta primera versión —ver «Ampliación (D-panel)» abajo— es un
resumen del **presente**: cómo está la iglesia repartida hoy y qué tanto se ha
escrito en las últimas semanas, no un archivo histórico.

## Ya implementado: la cabecera

La parte de arriba del panel **ya está en `main`** y no hubo que rehacerla al
implementar las métricas:

- Saludo según la hora (`lib/greeting.ts`, con test) y nombre de pila.
- La fecha completa, con `Intl` y el idioma activo.
- El tiempo de la ciudad que cada cual pone en sus ajustes (`profiles.city`),
  servido por `GET /api/v1/weather` contra Open-Meteo —sin clave— y cacheado un
  cuarto de hora por ciudad en el servidor.

Las tarjetas de esta propuesta van **debajo** de esa cabecera.

## Métricas de la primera versión

| Tarjeta          | Qué muestra                                           | De dónde sale |
| ---------------- | ----------------------------------------------------- | ------------- |
| Creyentes        | Total activos y altas del mes                         | RFC 0003      |
| Piden atención   | Quién ha agotado su margen sin nota, con vista previa | RFC 0003      |
| Próximos eventos | Los 5 siguientes del calendario de **púlpito**        | RFC 0002      |
| Notas recientes  | Últimas 5 notas escritas, de cualquier persona        | RFC 0003      |

**«Piden atención» no es un umbral nuevo de N días configurable por usuario**,
como decía el borrador original: es el mismo aviso que ya construyó la RFC 0003
—el margen `alertAfterDays` de cada creyente, 30 días por defecto y ajustable
por ficha (D3 de esa RFC)—. Añadir un segundo umbral global habría dado dos
respuestas distintas a «¿quién pide atención?» según la pantalla. La tarjeta
reutiliza `BelieversPageService.findPage` con el filtro `attention` que ya
tenía el listado: es la misma consulta, no una copia (Regla 1).

**«Cumpleaños» se queda fuera de esta entrega.** El borrador la incluía, pero
`Believer` no tiene ninguna columna de fecha de nacimiento —la RFC 0003 §5.1 ya
lo deja dicho como algo para cuando haga falta: «entonces es una columna, no un
rediseño»—. Añadirla aquí habría sido decidir a la carrera qué se guarda (día y
mes, o la fecha entera; con año o sin año) para una propuesta que no es la suya.
Cuando la RFC 0003 incorpore esa columna, esta tarjeta es la primera candidata
a añadirse.

## Ampliación (D-panel): gráficas y calendario de la semana

Al implementarla se amplió el encargo original con tres piezas más, pedidas
para que la portada sirviera también de resumen general y no solo de accesos
directos:

- **D-panel-1 — Composición de la iglesia.** Tres repartos —por sede, por labor
  y por don— de los creyentes activos y nuevos, con la misma `BucketBars` que
  ya pintan las estadísticas de una lista (`components/ui/bucket-bars.tsx`,
  antes en `components/lists/`): es el mismo dato, «cómo está repartida la
  gente», mirado desde dos sitios. Se calcula en `DashboardCompositionService`
  sobre toda la iglesia y no solo sobre una lista.
- **D-panel-2 — Actividad semanal.** Las notas escritas por semana, las últimas
  seis. No son seis barras genéricas: es **la misma estela** que ya dibuja una
  lista compartida (`wakeShape` de `lib/lists/wake-path.ts`, reutilizada tal
  cual desde `components/home/activity-card.tsx`) — el mismo rastro de barco
  para «cuánto se ha escrito», sin pasar por recharts (mismo criterio que
  RFC 0005 D18) ni por la puerta de `components/charts/`, que es solo para lo
  que sí usa esa librería. Reutilizar el motivo en dos pantallas es la firma
  visual del proyecto (Regla 9 §7), no una casualidad de que ambas midan algo
  en el tiempo.
- **D-panel-3 — La semana del calendario.** Un widget con la semana actual del
  calendario de **púlpito** por defecto, y un selector para mirar cualquier
  otro. No hace falta ningún endpoint nuevo: reutiliza `GET /calendars` y
  `GET /calendars/:id/schedule` de la RFC 0002, con los mismos hooks
  (`useCalendars`, `useCalendar`) que ya usa la pantalla de calendario.
- **D-panel-4 — Un instrumento, no cuatro fichas iguales.** «Creyentes» y
  «piden atención» comparten un solo cuadro partido por una línea
  (`StatusCard`), en vez de ser dos tarjetas idénticas más en una rejilla de
  cuatro: cuatro cajas blancas con icono, número y enlace es exactamente la
  plantilla de panel de cualquier SaaS que la Regla 9 pide evitar. Compartir
  cuadro tiene además una razón de contenido, no solo estética: son las dos
  preguntas que se hacen **juntas** al abrir el panel —cuántos somos, a quién
  se le está yendo el tiempo—.

Los «próximos eventos» de la tarjeta de métricas también se limitaron **al
calendario de púlpito** y no a los cuatro calendarios mezclados: sonido,
recepción y biblias son programaciones de apoyo a ese mismo servicio, y
mezclarlas habría respondido a una pregunta que nadie hace en la portada.

## Modelo de datos

Ninguna entidad nueva. Se leen las de los RFC 0002 y 0003.

Si el cálculo se vuelve lento, la salida es una vista materializada refrescada
cada noche, no duplicar contadores en tablas: los contadores desnormalizados se
desincronizan.

## API

| Método | Ruta                        | Rol mínimo | Descripción                               |
| ------ | --------------------------- | ---------- | ----------------------------------------- |
| GET    | `/api/v1/dashboard/summary` | member     | Todas las tarjetas y gráficas, de una vez |

Una única llamada, no una por tarjeta: en móvil con mala cobertura, cinco
peticiones en paralelo son cinco oportunidades de fallar. El calendario de la
semana es la única pieza que **no** viaja en esta respuesta —reutiliza los
endpoints de la RFC 0002 en vez de duplicarlos—.

## Interfaz

- **Web**: `/` (`apps/web/src/routes/dashboard.tsx`).
- **Móvil**: pestaña «Inicio» (`app/(tabs)/index.tsx`) — queda para una entrega
  aparte; esta ronda cubrió web, que es donde se pidió la ampliación.
- Textos nuevos bajo la clave `home.*` en los seis idiomas de `packages/i18n`.
- Las tarjetas usan `Card` y los tokens semánticos: se leen igual en claro y en
  oscuro, y caben en un móvil estrecho sin desbordar (rejilla de una columna
  por debajo de `sm`, hasta cuatro en escritorio).

## Consideraciones

- **Privacidad**: el panel muestra nombres de personas. Solo datos del ámbito
  del usuario; nunca métricas de otra congregación.
- **Offline**: la PWA sirve la última respuesta cacheada con `NetworkFirst` y
  marca visiblemente que los datos no son de ahora.
- **Vacío**: una instalación recién hecha no tiene datos. Cada tarjeta y
  gráfica se calla en vez de enseñar ceros o barras vacías cuando no hay nada
  que contar (`EmptyState` en eventos y notas; las gráficas de reparto y de
  actividad no se pintan si su total es cero).
- **IA**: más adelante, un resumen en lenguaje natural de la semana. Fuera de
  esta propuesta.

## Alternativas descartadas

- **Panel configurable con widgets arrastrables**: mucho trabajo para un primer
  uso que aún no sabemos cómo va a ser. Primero unas métricas fijas y ver cuáles
  se miran de verdad.
- **Un segundo umbral de «sin contacto» propio del panel**: habría dos
  definiciones de «pide atención» en la aplicación. Se reutiliza la de RFC
  0003 (ver D-panel más arriba).
- **Mezclar los cuatro calendarios en «próximos eventos»**: sonido, recepción y
  biblias son de apoyo al servicio de púlpito, no una segunda agenda; se dejan
  fuera de la portada y cada uno tiene ya su propia pantalla.
- **Un endpoint propio para el calendario de la semana**: no hacía falta.
  `GET /calendars/:id/schedule` con `from`/`to` de esa semana es exactamente lo
  mismo que pide la pantalla de calendario.

## Criterios de aceptación

- [x] `GET /api/v1/dashboard/summary` responde en una sola llamada con todas
      las tarjetas.
- [x] Cada tarjeta enlaza a la lista que la origina.
- [x] El estado vacío no muestra ceros sino una acción o se calla.
- [x] Se ve correctamente en móvil, tablet y escritorio, en tema claro y oscuro.
- [x] Los textos están en los seis idiomas.
- [ ] Panel de métricas también en la app móvil (queda pendiente).
- [ ] Tarjeta de cumpleaños (pendiente de que RFC 0003 añada la columna).
