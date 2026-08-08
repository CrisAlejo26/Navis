import { QueryFailedError } from 'typeorm';

/**
 * Si un error de consulta es un choque de restricción única, en cualquiera de
 * los dos motores. Postgres lo marca con el código SQLSTATE `23505`; SQLite no
 * tiene códigos numéricos para esto y lo dice en el mensaje: `UNIQUE
 * constraint failed`.
 *
 * Sirve para las siembras que pueden competir entre sí —los calendarios y la
 * sede de serie de una iglesia recién creada, en `ensureFor`—: dos peticiones
 * comprueban «¿hay alguna?» a la vez, las dos ven que no y las dos intentan
 * sembrar. Quien pierde esa carrera no ha fallado: solo ha llegado tarde a un
 * trabajo que la otra ya dejó hecho.
 */
export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;

  const driverError = error.driverError as { code?: string } | undefined;
  if (driverError?.code === '23505') return true;

  return error.message.includes('UNIQUE constraint failed');
}
