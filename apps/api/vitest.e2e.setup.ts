/**
 * Entorno de los tests end-to-end.
 *
 * Lo mismo que `vitest.setup.ts` para los unitarios, más una cosa que solo
 * aplica aquí: **los e2e levantan la app de verdad**, con su módulo de festivos
 * y su `fetch` real, así que al pedir un tramo del calendario salían a la calle
 * a por los festivos del año. Funcionaba —si la fuente falla se sirve lo
 * guardado y el tramo vuelve sin marcas—, pero una suite que depende de un
 * servicio de terceros es una suite que un día falla sin que nadie haya tocado
 * nada, y encima deja el caché escrito con datos de la red.
 *
 * Vacío apaga la fuente (ver el contrato de entorno en `packages/shared`).
 */
process.env.NODE_ENV ??= 'test';
process.env.BETTER_AUTH_SECRET ??= 'secreto-solo-para-los-tests-de-navis-no-usar-fuera';
process.env.HOLIDAYS_API_URL = '';
