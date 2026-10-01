# Varias iglesias en móvil — resultado de la Fase 0

Fecha: 2026-10-01. Solo pruebas y documentación; producción sin cambios.

## Red de seguridad

- `seedTwoChurches()` crea Norte y Sur del mismo dueño, con creyentes,
  sedes, calendarios, patrones, etiquetas, dones, notas con audio y reuniones
  con fases. Los nombres llevan `N-` y `S-`.
- Los tests `church-isolation*.test.ts` ejercitan los hallazgos A1,
  B1–B7, C1–C4 y la permanencia de los módulos personales (I7).
- `church-scope.static.test.ts` recorre los literales SQL mediante el AST de
  TypeScript. Detecta tablas con `church_id` desde `LOCAL_TABLES` y sus tablas
  hijas. Exige filtro por iglesia, inserción con iglesia o excepción motivada.
  No confunde proyectar `church_id` con filtrar por él.
- Las firmas antiguas se invocan con `scopedCall` y la iglesia como último
  argumento. En Fase 1 hay que actualizar estas llamadas si se elige otro orden;
  no se ha cambiado producción para poder demostrar el fallo primero.

## Resultado ejecutado

32 pruebas: **29 fallan y 3 pasan**. Los fallos son los 28 casos dinámicos
que demuestran ausencia de aislamiento y el control estático. Pasan las fichas
acotadas, el rechazo de sede ajena en `createMeeting` y los módulos personales.
No se usan `skip`, `todo` ni expectativas que acepten las fugas actuales.

C2 queda confirmado: `createBeliever`, `updateBeliever` y `setCongregation`
aceptan sedes ajenas. C4 queda confirmado para calendarios ajenos en
`createPattern` y `createMeeting`, y sedes ajenas en `createPattern`.
`createMeeting` ya rechaza las sedes ajenas.

Hallazgos adicionales que debe cerrar Fase 1:

1. `deleteBeliever(id, churchId)` no borra al creyente ajeno, pero sí sus notas:
   el segundo UPDATE de la transacción no está acotado.
2. `assignSlot` acepta una reunión ajena cuando no entran personas nuevas y
   permite modificar su fase. B6 no era seguro en todos sus llamadores.
3. `setMeetingSlots` valida la reunión, pero acepta creyentes de otra iglesia.
4. `createNote` permite referenciar un creyente ajeno, además del don ajeno.

El control estático también señala SQL interno cuyo aislamiento depende de una
validación anterior. Es una deuda estructural de I2, no evidencia automática de
una fuga explotable. Las excepciones solo cubren los dos helpers de fases y
explican el contrato; los tests B6 vigilan que sus llamadores lo cumplan.
El análisis es conservador: no interpreta SQL arbitrario generado en ejecución.

## Verificación y límites

- TypeScript móvil: correcto (`tsc --noEmit`).
- Prettier sobre los ficheros nuevos: correcto.
- ESLint sobre los ficheros nuevos: comprobado separadamente.
- Jest con SQLite real en memoria: resultado rojo anterior, esperado en Fase 0.
- `pnpm check` ejecutado: formato, lint y tipos pasan; móvil termina con
  31 fallos y 315 éxitos. Los 29 fallos nuevos son los de esta fase; también
  fallan pruebas existentes de `boot-splash.test.tsx` y
  `dashboard-repo.test.ts` (esta última espera datos del mes actual).
  No se han modificado esos archivos. `test:scripts` no se ejecuta tras el fallo.
- Expo Doctor: 18/20 comprobaciones pasan; las dos consultas remotas fallan
  por falta de acceso a la red (`fetch failed`, `EACCES`).
- No se ha recorrido la matriz del emulador. Esta fase no añade interfaz ni
  permite crear la segunda iglesia desde la app.

Pendientes Fases 1–6. El plan exige permiso explícito para empezar cada fase.
