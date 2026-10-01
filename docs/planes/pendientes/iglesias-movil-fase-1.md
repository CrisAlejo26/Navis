# Varias iglesias en móvil — resultado de la Fase 1

Fecha: 2026-10-01. Fase 1 implementada; Fases 2–6 pendientes.

## Cambios

- `church-scope.ts` valida ids y colecciones con tablas tipadas, iglesia y
  borrado lógico. Los ids ajenos se tratan como inexistentes (`not-found`).
- Notas, audios, patrones y reuniones reciben ahora `churchId`. Se han
  actualizado hooks, datos demo, fixtures y pruebas a sus firmas obligatorias.
- Las lecturas y escrituras de los repositorios se acotan directamente o por
  el padre. También se acotan las consultas auxiliares de fichas, reparto,
  fases, calendario y dones recibidos.
- Se validan dones, etiquetas, sedes, calendarios, patrones, reuniones y
  creyentes antes de escribir. `updateNote` y `deleteNote` comprueban además
  que la nota pertenece al creyente solicitado. Los cambios de notas y el
  recálculo de su última fecha comparten transacción.
- Se cerraron los hallazgos adicionales de Fase 0: borrar un creyente ajeno
  no borra sus notas; asignar una fase valida su reunión; reemplazar fases
  valida sus creyentes; crear una nota valida su creyente.
- Los audios ajenos se rechazan antes de acceder al disco. Las lecturas de
  dones y etiquetas no muestran enlaces heredados entre iglesias distintas.
- Desaparecen `registeredBelievers` y `useRegisteredBelievers`. El inicio
  usa `data.believers.total`, de la iglesia activa.
- `noteCounts` y `noteDays` incluyen iglesia en consulta y caché. El calendario
  conserva datos provisionales solo cuando la consulta anterior era de la
  misma iglesia.
- La lógica nueva se reparte en módulos pequeños, sin ampliar los repositorios
  existentes que ya superaban las 100 líneas.

## Verificación

- Las 32 pruebas originales de Fase 0, que fallaron antes de modificar
  producción, pasan. Tras reforzar el auditor SQL y añadir controles de audio
  y caché, el conjunto de aislamiento contiene **42 pruebas**.
- El auditor SQL comprueba también tablas dinámicas y constantes interpoladas;
  distingue proyectar o comparar columnas de filtrar con la iglesia solicitada.
  Tiene casos propios de SQL inseguro, seguro y personal.
- Las pruebas de caché usan React Query y SQLite real. Cambian de Norte a Sur
  sin invalidar y comprueban que contadores y días no reutilizan datos ajenos.
  Otra prueba mantiene pendiente la carga nueva del calendario y comprueba
  que no se enseña el tramo anterior durante la espera.
- `pnpm check`: **correcto** (formato, lint, tipos, tests y tests de scripts).
  Móvil: **356 pruebas, 84 suites**, todas correctas. Scripts: 29 pruebas.
- Se corrigieron tres supuestos de fixtures existentes: el calendario reutilizado
  después de borrarlo, un creyente creado tres días antes que podía quedar fuera
  del mes actual el día 1, y el temporizador del splash que olvidaba el fundido.
  No se cambió producción para acomodar esas pruebas.
- Emulador Android con Expo Go SDK 57 y Metro del código actual: arranque
  comprobado. El inicio muestra 1 creyente en el hero y en la tarjeta de la
  iglesia activa. No se modificaron los datos de la sesión del dispositivo.
- Expo Doctor: **19/20**. Solo señala parches disponibles para `expo`,
  `expo-constants` y `expo-router`; no se actualizaron dependencias en esta fase.

## Límites y siguiente fase

El cambio completo de contexto, membresías, persistencia de activa, selector,
recordatorios de todas las iglesias y restauración siguen en Fases 2–6.
Las pruebas de caché cambian el espejo de sesión para ejercer el aislamiento;
no sustituyen el hook `switchChurch` pendiente de Fase 3.

La matriz completa de tres iglesias en la interfaz sigue pendiente: todavía
no existe el selector de Fase 4.
