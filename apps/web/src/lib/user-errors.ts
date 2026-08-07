/**
 * El mensaje para un error de la API al dar de alta o editar una cuenta.
 * Comparten esto `create-user-dialog` y `edit-user-dialog`: los mismos dos
 * códigos, la misma clave.
 */
export function errorFor(status: number, t: (key: string) => string): string {
  if (status === 409) return t('auth.emailTaken');
  if (status === 403) return t('roles.roleCeilingError');
  return t('errors.generic');
}
