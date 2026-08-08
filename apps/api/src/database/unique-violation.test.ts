import { QueryFailedError } from 'typeorm';
import { describe, expect, it } from 'vitest';

import { isUniqueViolation } from './unique-violation';

/** Un `QueryFailedError` con el `driverError` que pondría cada motor. */
function queryFailed(driverError: unknown): QueryFailedError {
  return new QueryFailedError('INSERT ...', [], driverError as Error);
}

describe('isUniqueViolation', () => {
  it('reconoce el 23505 de Postgres', () => {
    expect(isUniqueViolation(queryFailed({ code: '23505' }))).toBe(true);
  });

  it('reconoce el mensaje de SQLite, sin código numérico', () => {
    const error = queryFailed({ code: 'SQLITE_CONSTRAINT' });
    // better-sqlite3 mete el detalle en el mensaje del propio `QueryFailedError`.
    Object.defineProperty(error, 'message', {
      value: 'UNIQUE constraint failed: calendars.church_id, calendars.slug',
    });

    expect(isUniqueViolation(error)).toBe(true);
  });

  it('no confunde otro error de consulta con un choque de únicos', () => {
    expect(isUniqueViolation(queryFailed({ code: '23502' }))).toBe(false);
  });

  it('no es un choque de únicos si ni siquiera es un error de consulta', () => {
    expect(isUniqueViolation(new Error('otra cosa'))).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
  });
});
