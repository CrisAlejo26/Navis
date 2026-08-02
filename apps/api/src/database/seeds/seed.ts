/**
 * Semilla de desarrollo: crea un usuario administrador con su perfil.
 *
 *   pnpm --filter @pastortools/api seed
 *
 * El usuario se crea a través de la API de Better Auth (no con SQL directo)
 * para que la contraseña se hashee exactamente igual que en producción.
 */
import { auth, authPool } from '../../auth/auth';
import { dataSource } from '../data-source';

const SEED_USER = {
  email: 'admin@pastortools.local',
  password: 'PastorTools2026',
  name: 'Administrador',
};

async function seed(): Promise<void> {
  await dataSource.initialize();

  try {
    const existing = await authPool.query<{ id: string }>('SELECT id FROM "user" WHERE email = $1', [
      SEED_USER.email,
    ]);

    let userId = existing.rows[0]?.id;

    if (userId) {
      console.log(`· El usuario ${SEED_USER.email} ya existe`);
    } else {
      const created = await auth.api.signUpEmail({ body: SEED_USER });
      userId = created.user.id;
      await authPool.query('UPDATE "user" SET role = $1 WHERE id = $2', ['admin', userId]);
      console.log(`✅ Usuario creado: ${SEED_USER.email} / ${SEED_USER.password} (rol admin)`);
    }

    await dataSource.query(
      `INSERT INTO "profiles" ("user_id", "church", "timezone")
       VALUES ($1, $2, $3)
       ON CONFLICT ("user_id") DO NOTHING`,
      [userId, 'Iglesia de ejemplo', 'Europe/Madrid'],
    );

    console.log('✅ Semilla completada');
  } finally {
    await dataSource.destroy();
    await authPool.end();
  }
}

seed().catch((error: unknown) => {
  console.error('❌ La semilla falló:', error);
  process.exit(1);
});
