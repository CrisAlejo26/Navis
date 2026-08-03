# RFC 0002: Calendario de programaciones

- **Estado**: Borrador
- **Fecha**: 2026-08-03
- **Apps afectadas**: api / web / mobile / desktop
- **Depende de**: —

## Problema

La agenda pastoral vive hoy repartida entre un grupo de WhatsApp, un cuaderno y
la memoria: cultos, ensayos, visitas, reuniones de liderazgo y turnos de
servicio. Cuando algo cambia, no hay una única fuente de verdad y alguien se
queda sin enterarse.

## Alcance

Entra: crear eventos con fecha, lugar y responsables, verlos en mes/semana/día,
y eventos que se repiten.

No entra: sincronización bidireccional con Google Calendar, invitaciones por
correo y confirmaciones de asistencia. Se contempla una exportación de solo
lectura en iCal, que cubre el 80 % del caso con una fracción del trabajo.

## Modelo de datos

```
Event
├── id: uuid
├── title: text                — «Culto de domingo»
├── description: text | null
├── type: enum                 — culto | ensayo | visita | reunion | otro
├── startsAt: timestamptz
├── endsAt: timestamptz | null
├── allDay: boolean
├── location: text | null
├── recurrenceRule: text | null — RRULE de la RFC 5545
├── color: text | null
├── createdBy → user(id)
└── ← EventAssignment[]

EventAssignment                — quién hace qué en ese evento
├── eventId → Event(id)
├── believerId → Believer(id)  — ver RFC 0003
├── role: text                 — «predica», «alabanza», «sonido»
└── notes: text | null
```

Las repeticiones se guardan como `RRULE` y se expanden al consultar, no como
filas por ocurrencia: así, cambiar «todos los domingos» no obliga a reescribir
cientos de registros. Una excepción concreta (un domingo que se mueve) sí genera
una fila propia que apunta a la serie.

Todas las fechas se guardan en UTC. La zona horaria de presentación es la del
perfil (`profiles.timezone`), que ya existe.

## API

| Método | Ruta                        | Rol mínimo | Descripción                                           |
| ------ | --------------------------- | ---------- | ----------------------------------------------------- |
| GET    | `/api/v1/events?from=&to=`  | member     | Eventos del rango, con las repeticiones ya expandidas |
| POST   | `/api/v1/events`            | leader     | Crear                                                 |
| PATCH  | `/api/v1/events/:id`        | leader     | Editar (con `scope=one\|future\|all` si es una serie) |
| DELETE | `/api/v1/events/:id`        | leader     | Borrado lógico                                        |
| GET    | `/api/v1/events/export.ics` | member     | Exportación iCal de solo lectura                      |

`from` y `to` son obligatorios y el rango máximo es de un año: sin ese límite,
una petición sin filtros expandiría repeticiones infinitas.

## Interfaz

- **Web**: `/calendar` con vistas de mes, semana y día.
- **Móvil**: pestaña «Calendario»; agenda vertical por defecto, que es lo que
  funciona en una pantalla estrecha, con la rejilla mensual como alternativa.
- Textos nuevos bajo `calendar.*` en los seis idiomas.
- Los nombres de meses y días salen de `Intl`, no de las traducciones: ya están
  bien localizados y sin acceso a esa API no habría formato correcto igualmente.

## Consideraciones

- **Privacidad**: una visita pastoral puede ser delicada. `type: visita` admite
  marcarse como privada y entonces solo la ve quien la creó.
- **Offline**: la app cachea el mes actual y el siguiente. Crear sin conexión
  queda fuera de esta propuesta.
- **IA**: detectar huecos y proponer cuándo encajar una visita. Más adelante.

## Alternativas descartadas

- **Filas por ocurrencia**: simplifica las consultas pero convierte cualquier
  edición de una serie en una migración de datos.
- **Integración completa con Google Calendar**: OAuth, refresco de tokens y
  resolución de conflictos. Demasiado para la primera versión.

## Criterios de aceptación

- [ ] Un evento semanal se ve en las semanas correspondientes sin crear filas por ocurrencia.
- [ ] Editar una ocurrencia no altera el resto de la serie.
- [ ] Las horas se muestran en la zona del perfil, aunque el servidor esté en otra.
- [ ] El fichero `.ics` lo abre Google Calendar sin avisos.
- [ ] Los textos están en los seis idiomas y la vista funciona en móvil y escritorio.
