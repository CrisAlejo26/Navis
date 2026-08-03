# RFC 0004: Profecías personales

- **Estado**: Borrador
- **Fecha**: 2026-08-03
- **Apps afectadas**: api / web / mobile / desktop
- **Depende de**: 0003 (creyentes), opcionalmente

## Problema

Las palabras proféticas recibidas se apuntan en cuadernos y se pierden. Quien
las guarda quiere poder releerlas años después, ver si algo se cumplió y con qué
frecuencia vuelve un mismo tema.

## Alcance

Entra: registrar una palabra profética con su fecha, contexto y estado de
cumplimiento, y poder buscarlas y etiquetarlas.

No entra: cualquier juicio automático sobre la validez de una profecía. La
aplicación es un cuaderno ordenado, no un árbitro.

## Modelo de datos

```
Prophecy
├── id: uuid
├── ownerId → user(id)          — de quién es el registro
├── title: text
├── body: text                  — la palabra, tal cual
├── receivedAt: date
├── source: text | null         — quién la dio
├── context: text | null        — dónde: culto, retiro, oración personal
├── scripture: text | null      — referencia bíblica asociada
├── status: enum                — pendiente | en_proceso | cumplida | archivada
├── fulfilledAt: date | null
├── fulfillmentNotes: text | null
├── believerId → Believer(id) | null   — si es sobre otra persona
├── isPrivate: boolean          — por defecto, true
└── ← Attachment[]              — audio o foto del cuaderno

Attachment
├── id: uuid
├── kind: enum                  — audio | imagen
├── url: text
└── durationSeconds: int | null
```

`isPrivate` viene en `true` por defecto. En el resto de la aplicación lo normal
es compartir dentro del equipo; aquí lo normal es lo contrario.

Las profecías **sobre otra persona** (`believerId`) plantean un problema de
consentimiento que hay que resolver antes de implementarlo (ver más abajo).

## API

| Método | Ruta                                      | Rol mínimo | Descripción                          |
| ------ | ----------------------------------------- | ---------- | ------------------------------------ |
| GET    | `/api/v1/prophecies?q=&status=&from=&to=` | member     | Solo las propias                     |
| POST   | `/api/v1/prophecies`                      | member     | Crear                                |
| GET    | `/api/v1/prophecies/:id`                  | dueño      | Detalle                              |
| PATCH  | `/api/v1/prophecies/:id`                  | dueño      | Editar, incluido marcar cumplimiento |
| DELETE | `/api/v1/prophecies/:id`                  | dueño      | Borrado lógico                       |
| POST   | `/api/v1/prophecies/:id/attachments`      | dueño      | Subir audio o imagen                 |

Ni siquiera un `admin` lee profecías ajenas: el filtro por `ownerId` va en el
repositorio, no en el controlador, para que no se pueda olvidar en un endpoint
nuevo.

## Interfaz

- **Web**: `/prophecies`, lista cronológica con filtro por estado y buscador.
- **Móvil**: dentro de «Más» (`app/prophecies.tsx`), con grabación de audio como
  forma rápida de capturar algo en el momento.
- Textos nuevos bajo `prophecies.*` en los seis idiomas.

## Consideraciones

- **Privacidad**: es el módulo más delicado junto con las notas. Privado por
  defecto, cifrado en reposo si se aloja en un servidor compartido, y nunca en
  copias de seguridad no cifradas.
- **Consentimiento**: registrar una palabra sobre otra persona toca datos de un
  tercero. Propuesta: exigir marcar explícitamente si esa persona lo sabe, y no
  mostrarla en la ficha del creyente salvo que así sea.
- **Offline**: consulta cacheada; la grabación de audio se sube cuando vuelve la
  conexión.
- **IA**: buscar por parecido semántico entre palabras a lo largo de los años.
  Es el caso de uso que mejor justifica el microservicio Python con embeddings
  **locales**: este contenido no debería salir del servidor.

## Alternativas descartadas

- **Reutilizar las notas del RFC 0003 con una etiqueta**: ahorraría una tabla,
  pero las notas pertenecen a un creyente y estas pertenecen a un usuario, con
  reglas de visibilidad opuestas. Mezclarlas sería un fallo de privacidad
  esperando a ocurrir.

## Criterios de aceptación

- [ ] Un usuario no puede leer una profecía de otro por mucho que sea admin.
- [ ] El estado y la fecha de cumplimiento se pueden actualizar sin perder el texto original.
- [ ] La búsqueda encuentra por texto y por referencia bíblica.
- [ ] Los adjuntos de audio se reproducen en web y en móvil.
- [ ] Los textos están en los seis idiomas.
