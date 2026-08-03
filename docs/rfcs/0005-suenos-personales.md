# RFC 0005: Sueños personales

- **Estado**: Borrador
- **Fecha**: 2026-08-03
- **Apps afectadas**: api / web / mobile / desktop
- **Depende de**: 0004 (comparte el patrón de privacidad)

## Problema

Un sueño se olvida en minutos. Quien lleva un registro quiere apuntarlo nada
más despertarse, con el mínimo número de toques, y poder releerlo después
buscando temas y símbolos que se repiten.

## Alcance

Entra: registrar un sueño con su fecha, símbolos y estado de interpretación,
optimizado para capturarlo rápido.

No entra: cualquier interpretación automática. El sistema organiza; interpretar
es de la persona.

## Modelo de datos

```
Dream
├── id: uuid
├── ownerId → user(id)
├── title: text
├── body: text                  — el sueño tal y como se recuerda
├── dreamedAt: date             — la noche, no la fecha de escritura
├── mood: enum | null           — paz | inquietud | urgencia | confusion | alegria
├── interpretation: text | null
├── status: enum                — sin_interpretar | en_proceso | interpretado | archivado
├── isPrivate: boolean          — por defecto, true
├── ← DreamSymbol[]             — los elementos que aparecen
└── ← Attachment[]              — audio grabado al despertar

Symbol                          — vocabulario compartido por usuario
├── id: uuid
├── ownerId → user(id)
├── name: text                  — «agua», «puerta», «águila»
└── meaning: text | null        — qué ha significado otras veces

DreamSymbol (dreamId, symbolId)
```

Los símbolos son una tabla propia y no etiquetas de texto libre: el valor de
todo esto está justamente en ver que «agua» sale en once sueños y qué se anotó
cada vez. Con cadenas sueltas, «Agua» y «agua» serían dos cosas distintas.

## API

| Método | Ruta                                  | Rol mínimo | Descripción                                   |
| ------ | ------------------------------------- | ---------- | --------------------------------------------- |
| GET    | `/api/v1/dreams?q=&symbol=&from=&to=` | member     | Solo los propios                              |
| POST   | `/api/v1/dreams`                      | member     | Crear (solo `body` es obligatorio)            |
| GET    | `/api/v1/dreams/:id`                  | dueño      | Detalle                                       |
| PATCH  | `/api/v1/dreams/:id`                  | dueño      | Editar, incluida la interpretación            |
| DELETE | `/api/v1/dreams/:id`                  | dueño      | Borrado lógico                                |
| GET    | `/api/v1/symbols`                     | member     | Vocabulario propio, con cuántas veces aparece |

Al crear, todo es opcional salvo el cuerpo: si el formulario exige título y
fecha a las 4 de la mañana, no se usa. `dreamedAt` se rellena con la fecha de la
noche anterior si son antes de las 6.

## Interfaz

- **Web**: `/dreams`, lista cronológica y nube de símbolos frecuentes.
- **Móvil**: dentro de «Más» (`app/dreams.tsx`). La acción principal es un botón
  grande de grabar audio: es lo único viable recién despierto. La transcripción
  llega después, cuando exista el servicio de IA.
- Textos nuevos bajo `dreams.*` en los seis idiomas.

## Consideraciones

- **Privacidad**: como en el RFC 0004: privado por defecto, sin acceso de admin,
  cifrado en reposo si hay servidor.
- **Offline**: escribir sin conexión es aquí un requisito real, no un extra; el
  registro se guarda en local y se sincroniza al recuperar red.
- **IA**: transcribir el audio y buscar patrones entre sueños. De nuevo, con
  modelos locales: es contenido íntimo y no debería salir del servidor.

## Alternativas descartadas

- **Un único módulo «diario espiritual»** que agrupe sueños y profecías: son
  cosas distintas, con campos distintos, y quien lleva un registro las separa.

## Criterios de aceptación

- [ ] Un sueño se guarda solo con el cuerpo, sin más campos obligatorios.
- [ ] `dreamedAt` se propone bien al escribir de madrugada.
- [ ] Los símbolos muestran cuántas veces han aparecido y en qué sueños.
- [ ] Un usuario no puede leer sueños de otro, ni siquiera admin.
- [ ] Los textos están en los seis idiomas.
