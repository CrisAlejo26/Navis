import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tabla `profiles`: datos de dominio del usuario, enlazados con la tabla
 * `user` que crea Better Auth.
 *
 * IMPORTANTE: ejecuta antes `pnpm --filter @pastortools/api auth:migrate`,
 * porque esta migración declara una FK contra "user"("id").
 */
export class CreateProfiles1785628800000 implements MigrationInterface {
  name = 'CreateProfiles1785628800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "user_id" text NOT NULL,
        "phone" text,
        "church" text,
        "avatar_url" text,
        "bio" text,
        "timezone" text NOT NULL DEFAULT 'Europe/Madrid',
        CONSTRAINT "PK_profiles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_profiles_user_id" ON "profiles" ("user_id")`,
    );

    const [{ exists }] = (await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user') AS "exists"`,
    )) as [{ exists: boolean }];

    if (!exists) {
      throw new Error(
        'No existe la tabla "user" de Better Auth. Ejecuta primero: pnpm --filter @pastortools/api auth:migrate',
      );
    }

    await queryRunner.query(`
      ALTER TABLE "profiles"
      ADD CONSTRAINT "FK_profiles_user" FOREIGN KEY ("user_id")
      REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "FK_profiles_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_profiles_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "profiles"`);
  }
}
