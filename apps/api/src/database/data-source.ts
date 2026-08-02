import { DataSource, type DataSourceOptions } from 'typeorm';

import { env, isProduction } from '../config/env';

/**
 * Opciones compartidas por la app (TypeOrmModule) y por el CLI de migraciones.
 *
 * `synchronize` está desactivado siempre y en todos los entornos: el esquema
 * solo cambia mediante migraciones revisadas en un pull request.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  synchronize: false,
  logging: isProduction ? ['error', 'warn'] : ['error', 'warn', 'migration'],
  entities: [`${__dirname}/../**/*.entity.{ts,js}`],
  migrations: [`${__dirname}/migrations/*.{ts,js}`],
  migrationsTableName: 'typeorm_migrations',
  ssl: isProduction && process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

/** DataSource usado por `pnpm --filter @pastortools/api typeorm`. */
export const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
