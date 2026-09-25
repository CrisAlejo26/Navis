# Plan — Varios creyentes por fase en el calendario

Hoy una fase (`meeting_slots`) tiene **una** columna `believer_id`. Se quiere
poder poner a varias personas en la misma fase (p. ej. «Testimonios»: tres
hermanos). Este plan lo hace sin romper lo existente.

## Decisiones (propuestas, a confirmar)

1. **Tabla de unión `meeting_slot_believers`** (`slot_id`, `believer_id`,
   `position`), en vez de una columna `uuid[]`: SQLite no tiene arrays, y las
   consultas de equilibrio, historial y solapes ya filtran por creyente.
2. **La fase sigue siendo la unidad** (RFC 0002 D1). Solo cambia quién la ocupa.
3. **Asignar reemplaza el conjunto**: `believerIds: string[]` (vacío = sin
   asignar). Una sola primitiva, sin «añadir»/«quitar» aparte.
4. **Sin tope de personas por fase**, pero sin duplicados; el orden se guarda
   en `position` (no se fía de `IN (...)`, ver CLAUDE.md).
5. **Contrato**: `slot.believer` (uno) pasa a `slot.believers` (array). Cambio
   rompiente, por eso se hace en una sola pasada por todos los clientes.

## Fases

### 1. Contrato (`packages/shared`)

- `meetingSlotSchema.believers: z.array(slotBelieverSchema)`.
- `assignSlotSchema.believerIds` (únicos, sin máximo); `setMeetingSlotsSchema`
  igual por fase.
- Ajustar `public-lists.ts` y `local-schema.ts` (tabla nueva + índices; el test
  de paridad `local-schema.parity.test.ts` lo exige).

### 2. API (`apps/api`)

- Entidad `MeetingSlotBeliever` (listada a mano en `data-source.ts`; hijo→padre
  por nombre con `Relation<>`).
- **Migración** en los dos motores: crea la tabla, copia cada `believer_id` no
  nulo como fila con `position 0`, y quita la columna y su índice
  (`IDX_meeting_slots_believer`; cuidado con la trampa de `dropColumn` en
  SQLite). Probar con `DB_DRIVER=sqlite` y `postgres`.
- `assignments.service`: validar **todos** (`isSchedulable`), reemplazar el
  conjunto en transacción.
- `calendar-format`, `meetings.service` (setSlots), `merge-pattern-slots`
  (`isEmpty` = sin personas y sin nota), `schedule.service`.
- `summary.service`, `calendar-warnings` (una fase con dos personas cuenta a
  cada una; «twiceSameDay» solo si es la misma persona en **dos fases**, no
  dos personas en una), `preachers.service` (`times_in_range` y `lastDate`
  ahora por la tabla de unión).
- Consumidores fuera de `calendar/`: `believers/` (historial, filas, notas),
  `lists/` (overlap, member-stats, directory, viewers), `dashboard-notes`,
  `tables/`. Se localizan con `search_code "meeting_slots"`.

### 3. api-client

- `calendar-mutations`, `calendar-cache` (actualización optimista del conjunto).

### 4. Web

- `slot-line`, `preacher-picker` (pasa de elegir uno a **marcar varios**, con
  chips quitables y el orden de «lleva más tiempo sin subir»).
- Vistas: `day-cell`, `day-panel`, `week-view`, `agenda-view`, `month-grid`,
  `meeting-ribbon`, cartel (`poster-*`), `balance-panel`, y `lib/calendar/`
  (`people`, `filter`, `share-text`: «A, B y C» con `Intl.ListFormat` del
  idioma activo).
- Textos nuevos en los seis idiomas (Regla 2). Verificar 375 px con alemán y
  con tres nombres largos: el nombre múltiple **fluye o se trunca a propósito**.

### 5. Móvil

- Repos locales: `calendar-assignments`, `calendar-schedule`, `calendar-format`,
  `calendar-preachers`, `calendar-balance`, `db.ts`; `day-sheet`, `agenda-list`,
  `meeting-ribbon`, cartel, `share-text`. Migración de la base local.
- Sin `try` de nombres concatenados a mano: el helper de lista va en
  `packages/shared` si lo usan las dos apps (Regla 1).

### 6. Pruebas

- Tests unitarios: migración de datos, avisos, equilibrio, `merge-pattern-slots`.
- e2e API (Postgres y SQLite): asignar varias, reemplazar, vaciar, duplicados, persona
  inactiva. Actualizar `apps/web/e2e/servidor.ts` (stub desfasado = no se
  comprueba nada).
- Regla 11: recorrerlo en pantalla, dos temas, tres anchos, con datos reales.

## Riesgos

- **Migración de datos** en producción: probar sobre copia de Postgres real.
- **Mucha superficie** (~40 ficheros): se hace en una rama y se fusiona solo
  cuando `pnpm check` y los e2e están en verde en los dos motores.
- Regla 6: `preacher-picker` y `slot-line` crecerán; partir en subcomponentes.
