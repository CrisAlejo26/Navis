# RFC 0001: Panel de inicio con métricas

- **Estado**: Borrador
- **Fecha**: 2026-08-03
- **Apps afectadas**: api / web / mobile / desktop
- **Depende de**: 0002 (calendario), 0003 (creyentes)

## Problema

Al abrir la aplicación, un pastor quiere saber en diez segundos cómo va su
trabajo: a quién tiene pendiente de visitar, qué hay esta semana y si alguien
lleva demasiado tiempo sin contacto. Hoy esa información está en su cabeza o en
un cuaderno.

## Alcance

Entra: una pantalla de inicio con tarjetas de métricas y accesos directos a lo
que requiere atención.

No entra: informes históricos, gráficas comparativas entre periodos ni
exportación. Eso es un módulo de informes aparte.

## Ya implementado: la cabecera

La parte de arriba del panel **ya está en `main`** y no hay que rehacerla al
implementar las métricas:

- Saludo según la hora (`lib/greeting.ts`, con test) y nombre de pila.
- La fecha completa, con `Intl` y el idioma activo.
- El tiempo de la ciudad que cada cual pone en sus ajustes (`profiles.city`),
  servido por `GET /api/v1/weather` contra Open-Meteo —sin clave— y cacheado un
  cuarto de hora por ciudad en el servidor.

Las tarjetas de esta propuesta van **debajo** de esa cabecera.

## Métricas de la primera versión

| Tarjeta          | Qué muestra                                     | De dónde sale |
| ---------------- | ----------------------------------------------- | ------------- |
| Creyentes        | Total activos y altas del mes                   | RFC 0003      |
| Sin contacto     | Cuántos llevan más de N días sin nota ni visita | RFC 0003      |
| Próximos eventos | Los 5 siguientes del calendario                 | RFC 0002      |
| Cumpleaños       | Los de los próximos 15 días                     | RFC 0003      |
| Notas recientes  | Últimas 5 notas escritas                        | RFC 0003      |

El umbral N de «sin contacto» es configurable por usuario y por defecto son 45
días. Un número inventado por el sistema y no explicado genera desconfianza:
cada tarjeta enlaza a la lista concreta que la produce.

## Modelo de datos

Ninguna entidad nueva. Se leen las de los RFC 0002 y 0003.

Si el cálculo se vuelve lento, la salida es una vista materializada refrescada
cada noche, no duplicar contadores en tablas: los contadores desnormalizados se
desincronizan.

## API

| Método | Ruta                        | Rol mínimo | Descripción                              |
| ------ | --------------------------- | ---------- | ---------------------------------------- |
| GET    | `/api/v1/dashboard/summary` | member     | Todas las tarjetas en una sola respuesta |

Una única llamada, no una por tarjeta: en móvil con mala cobertura, cinco
peticiones en paralelo son cinco oportunidades de fallar.

## Interfaz

- **Web**: `/` (ya existe como marcador de posición en `apps/web/src/routes/dashboard.tsx`).
- **Móvil**: pestaña «Inicio» (`app/(tabs)/index.tsx`).
- Textos nuevos bajo la clave `home.*` en los seis idiomas de `packages/i18n`.
- Las tarjetas usan `Card` y los tokens semánticos: deben leerse igual en claro
  y en oscuro, y caber en un móvil estrecho sin desbordar.

## Consideraciones

- **Privacidad**: el panel muestra nombres de personas. Solo datos del ámbito
  del usuario; nunca métricas de otra congregación.
- **Offline**: la PWA sirve la última respuesta cacheada con `NetworkFirst` y
  marca visiblemente que los datos no son de ahora.
- **Vacío**: una instalación recién hecha no tiene datos. El estado vacío debe
  guiar («añade tu primer creyente»), no mostrar ceros.
- **IA**: más adelante, un resumen en lenguaje natural de la semana. Fuera de
  esta propuesta.

## Alternativas descartadas

- **Panel configurable con widgets arrastrables**: mucho trabajo para un primer
  uso que aún no sabemos cómo va a ser. Primero unas métricas fijas y ver cuáles
  se miran de verdad.

## Criterios de aceptación

- [ ] `GET /api/v1/dashboard/summary` responde en menos de 300 ms con 1000 creyentes.
- [ ] Cada tarjeta enlaza a la lista que la origina.
- [ ] El estado vacío no muestra ceros sino una acción.
- [ ] Se ve correctamente en móvil, tablet y escritorio, en tema claro y oscuro.
- [ ] Los textos están en los seis idiomas.
