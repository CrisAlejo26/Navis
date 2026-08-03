/**
 * Entorno mínimo de los tests unitarios de la API.
 *
 * Casi cualquier módulo de `src/` acaba importando `config/env`, que valida el
 * entorno con zod al cargarse y tumba el proceso si falta algo. En un portátil
 * eso lo tapa el `.env` de la raíz, pero en CI no hay ninguno y la suite ni
 * arrancaba (Regla 4).
 *
 * Se rellena solo lo que falte (`??=`), así que un `.env` de verdad sigue
 * mandando, y solo lo que el esquema exige sin valor por defecto.
 */
process.env.NODE_ENV ??= 'test';
process.env.BETTER_AUTH_SECRET ??= 'secreto-solo-para-los-tests-de-navis-no-usar-fuera';
