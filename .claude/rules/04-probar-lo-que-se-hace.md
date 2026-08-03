# Regla 4 — «Funciona» significa probado, no supuesto

Nada está terminado hasta que se ha ejecutado y se ha visto el resultado. No se
dice que algo está listo sin evidencia.

## Lo que hay que pasar siempre

```bash
rtk pnpm check      # formato + lint + tipos + tests unitarios + tests de los scripts
```

Y según lo que hayas tocado:

| Si has tocado…               | Ejecuta también                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------- |
| API o web                    | `rtk pnpm test:e2e`                                                               |
| App móvil                    | `rtk pnpm --filter @navis/mobile exec expo-doctor`                                |
| App de escritorio            | `cd apps/desktop/src-tauri && cargo check`                                        |
| Base de datos                | Las migraciones **en los dos motores**: `DB_DRIVER=sqlite` y `DB_DRIVER=postgres` |
| Iconos o nombre del proyecto | `rtk pnpm icons` y los tests de marca, que comparan byte a byte                   |

## Añade tests

Cuando creas o cambias lógica, cubre el caso normal y los límites que importen.
Vitest en la API, la web y los paquetes; Jest con `jest-expo` en móvil; el
runner de Node para los scripts de `scripts/`.

Al **arreglar un fallo**, escribe primero el test que lo reproduce. Si no falla
antes del arreglo, no estás probando el fallo.

## Compruébalo de verdad

Que compile no es que funcione. Si el cambio se ve, míralo en la aplicación: en
los dos temas, en un ancho de móvil y en uno de escritorio, y con más de un
idioma si toca textos.

## Cuenta la verdad

Si un test falla, dilo con la salida real. Si te has saltado un paso, dilo.
Un «está listo» sin comprobar cuesta más que un «esto no lo he podido probar».

> Probado, no supuesto.
