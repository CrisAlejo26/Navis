/**
 * El cerrojo de la semilla, aparte para poder probarlo: `seed.ts` es un script
 * que se ejecuta al importarlo, así que un test no puede tocarlo.
 */

/**
 * La semilla es de desarrollo y su contraseña está escrita en el repositorio,
 * que es público. En producción se niega a correr: la primera cuenta se crea
 * desde la pantalla de primer arranque, con la contraseña que elija quien
 * instala.
 */
export function assertSeedAllowed(enProduccion: boolean): void {
  if (!enProduccion) return;

  throw new Error(
    'La semilla no se ejecuta en producción: su contraseña es pública. ' +
      'Crea la primera cuenta desde la pantalla de primer arranque de la aplicación.',
  );
}
