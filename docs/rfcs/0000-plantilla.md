# RFC 0000: Plantilla

- **Estado**: Borrador | Aceptado | Implementado | Descartado
- **Autor**:
- **Fecha**:
- **Apps afectadas**: api / web / mobile / desktop
- **Depende de**:

## Problema

Qué necesidad pastoral resuelve. Escrito desde el punto de vista de quien usa la app,
no desde la tecnología.

## Alcance

Qué entra en esta propuesta y, sobre todo, **qué no entra**.

## Modelo de datos

Entidades nuevas o modificadas, con sus columnas y relaciones. Indicar si son propiedad de
TypeORM (dominio) o de Better Auth (identidad).

```
Entidad
├── campo: tipo   — descripción
└── relación → Otra entidad
```

## API

| Método | Ruta | Rol mínimo | Descripción |
| --- | --- | --- | --- |
| GET | `/api/v1/…` | member | |

## Interfaz

- **Web**: rutas y pantallas.
- **Móvil**: pantallas de expo-router.
- Textos nuevos a añadir a los seis idiomas de `packages/i18n`.

## Consideraciones

- **Privacidad**: los datos pastorales son sensibles; indicar quién puede ver qué.
- **Offline**: comportamiento de la PWA y de la app móvil sin conexión.
- **IA**: si la feature usará el módulo `ai` de la API, describir cómo.

## Alternativas descartadas

## Criterios de aceptación

- [ ] …
