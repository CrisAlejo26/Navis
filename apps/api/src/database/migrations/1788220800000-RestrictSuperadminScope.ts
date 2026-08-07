import { TableColumn, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * El **alcance** del superadministrador deja de ser fijo (RFC 0014).
 *
 * Una columna en `profiles`, `restrict_own_scope`, por defecto `true`: quien
 * tiene rol `superadmin` ve, de serie, solo sus propias iglesias y las cuentas
 * de sus miembros —igual que un pastor—, con un interruptor en ajustes para
 * ver toda la instalación. En cualquier otra cuenta se guarda y no tiene
 * ningún efecto.
 *
 * `default: true` cubre en la misma sentencia a las cuentas de
 * superadministrador que ya existen: no hace falta un `UPDATE` aparte.
 */
export class RestrictSuperadminScope1788220800000 implements MigrationInterface {
  name = 'RestrictSuperadminScope1788220800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'profiles',
      new TableColumn({
        name: 'restrict_own_scope',
        type: 'boolean',
        isNullable: false,
        default: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('profiles', 'restrict_own_scope');
  }
}
