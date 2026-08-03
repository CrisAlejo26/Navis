# RFC 0003: Creyentes con detalle y notas

- **Estado**: Borrador
- **Fecha**: 2026-08-03
- **Apps afectadas**: api / web / mobile / desktop
- **Depende de**: —

## Problema

El trabajo pastoral es acordarse de las personas: quién está enfermo, quién
acaba de perder el trabajo, a quién no se ve desde hace meses, de qué se habló
la última vez. Es el núcleo de la aplicación; todo lo demás cuelga de aquí.

## Alcance

Entra: ficha de cada creyente, con datos de contacto y familia, y un historial
de notas fechadas.

No entra: gestión de donativos y contabilidad. Mezclar dinero con acompañamiento
pastoral cambia por completo el perfil de riesgo del producto y merece su propio
documento.

## Modelo de datos

```
Believer
├── id: uuid
├── firstName / lastName: text
├── email / phone: text | null
├── birthDate: date | null       — para los cumpleaños del panel
├── address: text | null
├── status: enum                 — activo | inactivo | visitante | trasladado
├── joinedAt: date | null
├── photoUrl: text | null
├── householdId → Household(id) | null
├── lastContactAt: timestamptz | null  — derivado de la última nota o visita
└── ← Note[]  ← BelieverTag[]

Household                        — familia o unidad de convivencia
├── id: uuid
└── name: text

Note
├── id: uuid
├── believerId → Believer(id)
├── body: text
├── kind: enum                   — visita | llamada | oracion | seguimiento | otro
├── occurredAt: timestamptz      — cuándo pasó, distinto de cuándo se escribió
├── isPrivate: boolean
└── authorId → user(id)

Tag                              — «diaconía», «jóvenes», «nuevo»
└── BelieverTag (believerId, tagId)
```

`lastContactAt` se recalcula al crear o borrar una nota. Es un dato derivado y
está ahí a propósito: la alternativa es un `MAX(occurredAt)` correlacionado en
cada listado del panel, que es justo la consulta que se hace más veces.

## API

| Método | Ruta                                      | Rol mínimo    | Descripción                     |
| ------ | ----------------------------------------- | ------------- | ------------------------------- |
| GET    | `/api/v1/believers?q=&status=&tag=&page=` | member        | Listado con búsqueda y filtros  |
| POST   | `/api/v1/believers`                       | leader        | Crear                           |
| GET    | `/api/v1/believers/:id`                   | member        | Ficha con familia y etiquetas   |
| PATCH  | `/api/v1/believers/:id`                   | leader        | Editar                          |
| DELETE | `/api/v1/believers/:id`                   | admin         | Borrado lógico                  |
| GET    | `/api/v1/believers/:id/notes`             | member        | Historial, más reciente primero |
| POST   | `/api/v1/believers/:id/notes`             | member        | Añadir nota                     |
| PATCH  | `/api/v1/notes/:id`                       | autor         | Editar la propia                |
| DELETE | `/api/v1/notes/:id`                       | autor o admin | Borrado lógico                  |

La búsqueda por `q` usa `pg_trgm` y `unaccent` (ambas extensiones ya se crean en
`docker/postgres/init.sql`), para que «jesus» encuentre «Jesús». En modo SQLite
cae a un `LIKE` sin acentos: peor, pero suficiente para un solo usuario.

## Interfaz

- **Web**: `/believers` (lista con búsqueda) y `/believers/:id` (ficha con
  pestañas de datos, notas y familia).
- **Móvil**: pestaña «Creyentes»; el detalle se abre como pantalla apilada y la
  acción principal es «añadir nota», que es lo que más se hace y suele hacerse
  de pie y con una mano.
- Textos nuevos bajo `believers.*` y `notes.*` en los seis idiomas.

## Consideraciones

- **Privacidad**: es la parte más sensible de la aplicación. Una nota marcada
  como privada solo la ve su autor, ni siquiera un `admin`. El borrado es lógico
  para no perder historial, pero hace falta un borrado real por petición de la
  persona interesada (protección de datos).
- **Offline**: la lista y las fichas visitadas se cachean. Escribir sin conexión
  queda fuera de esta propuesta, aunque es la primera candidata a tenerlo.
- **IA**: resumir el historial de una persona o sugerir a quién visitar. Solo
  con consentimiento explícito y, en datos así, preferiblemente con el modelo en
  local (ver `apps/ai`).

## Alternativas descartadas

- **Campos personalizados libres**: cada iglesia querría los suyos, pero acaban
  en datos sin estructura imposibles de consultar. Se empieza con etiquetas, que
  cubren la mayor parte de la necesidad.
- **Notas en Markdown enriquecido**: complica el editor en móvil, que es donde
  más se escribe. Texto plano y a correr.

## Criterios de aceptación

- [ ] Buscar «jesus» encuentra «Jesús» en Postgres.
- [ ] Una nota privada no aparece para otro usuario, ni siquiera admin.
- [ ] `lastContactAt` cambia al añadir una nota y al borrarla.
- [ ] La lista pagina correctamente con 5000 creyentes.
- [ ] Los textos están en los seis idiomas y todo se ve bien en claro y oscuro.
