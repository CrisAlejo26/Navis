/* eslint-disable no-console -- es un script de consola: su salida ES la interfaz */

/**
 * Semilla de desarrollo: crea un usuario administrador con su perfil.
 *
 *   pnpm --filter @navis/api seed
 *
 * El usuario se crea a través de la API de Better Auth (no con SQL directo)
 * para que la contraseña se hashee exactamente igual que en producción.
 * Funciona con los dos drivers: SQLite (local) y Postgres (compartido).
 */
import { auth } from '../../auth/auth';
import { isProduction } from '../../config/env';
import { dataSource } from '../data-source';
import { p } from '../sql-params';
import { assertSeedAllowed } from './seed-guard';

// La contraseña NO lleva el nombre del proyecto a propósito: `pnpm rename` lo
// sustituiría y podría dejarla por debajo del mínimo de 10 caracteres que
// exige Better Auth, rompiendo la semilla sin que nadie lo note hasta usarla.
//
// Está escrita aquí y este repositorio es público: eso es normal en una semilla
// de desarrollo, pero SOLO mientras no pueda llegar a un servidor. De ahí el
// cerrojo de abajo. Ya pasó una vez: esta cuenta acabó siendo la única de
// producción, con su contraseña legible en GitHub.
const SEED_USER = {
  email: 'admin@navis.local',
  password: 'Rebano2026Seguro',
  name: 'Administrador',
};

async function seed(): Promise<void> {
  assertSeedAllowed(isProduction);
  await dataSource.initialize();

  try {
    const existing = await dataSource.query<{ id: string }[]>(
      `SELECT id FROM "user" WHERE email = ${p(1)}`,
      [SEED_USER.email],
    );

    let userId = existing[0]?.id;

    if (userId) {
      console.log(`· El usuario ${SEED_USER.email} ya existe`);
    } else {
      const created = await auth.api.signUpEmail({ body: SEED_USER });
      userId = created.user.id;
      await dataSource.query(`UPDATE "user" SET role = ${p(1)} WHERE id = ${p(2)}`, [
        'admin',
        userId,
      ]);
      console.log(`✅ Usuario creado: ${SEED_USER.email} / ${SEED_USER.password} (rol admin)`);
    }

    await dataSource.query(
      `INSERT INTO "profiles" ("id", "user_id", "church", "timezone")
       VALUES (${p(1)}, ${p(2)}, ${p(3)}, ${p(4)})
       ON CONFLICT ("user_id") DO NOTHING`,
      [crypto.randomUUID(), userId, 'Iglesia de ejemplo', 'Europe/Madrid'],
    );

    console.log('✅ Semilla completada');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error('❌ La semilla falló:', error);
  process.exit(1);
});
