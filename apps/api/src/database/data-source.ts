import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DataSource, type DataSourceOptions } from 'typeorm';

import { env, isProduction, sqlitePath } from '../config/env';
import { BelieverMinistry } from '../believers/believer-ministry.entity';
import { Believer } from '../believers/believer.entity';
import { Calendar } from '../calendar/calendar.entity';
import { Congregation } from '../calendar/congregation.entity';
import { MeetingPattern } from '../calendar/meeting-pattern.entity';
import { MeetingSlot } from '../calendar/meeting-slot.entity';
import { Meeting } from '../calendar/meeting.entity';
import { PatternPhase } from '../calendar/pattern-phase.entity';
import { ChurchMember } from '../churches/church-member.entity';
import { Church } from '../churches/church.entity';
import { Profile } from '../profiles/profile.entity';
import { Role } from '../roles/role.entity';

const logging: DataSourceOptions['logging'] = isProduction
  ? ['error', 'warn']
  : ['error', 'warn', 'migration'];

/**
 * Entidades listadas a mano, no con un glob.
 *
 * Con glob, TypeORM hace `require()` de cada fichero que encuentra. Al correr
 * los tests sobre el código fuente eso significa exigirle a Node que cargue
 * ficheros `.ts`, cosa que no sabe hacer: falla con «Invalid or unexpected
 * token». Al añadir una entidad nueva, se añade aquí.
 */
const entities = [
  Profile,
  Role,
  Church,
  ChurchMember,
  Calendar,
  Congregation,
  Believer,
  BelieverMinistry,
  MeetingPattern,
  PatternPhase,
  Meeting,
  MeetingSlot,
];

/**
 * Las migraciones sí van por patrón, pero con UNA extensión: si aceptase
 * `{ts,js}` y existiese `dist/`, cada migración se cargaría dos veces.
 */
const migrations = [`${__dirname}/migrations/*.${__filename.endsWith('.ts') ? 'ts' : 'js'}`];

/**
 * Opciones compartidas por la app (TypeOrmModule) y por el CLI de migraciones.
 *
 * Dos modos, elegidos con `DB_DRIVER` en el .env:
 *   · `sqlite`   → fichero local, cero infraestructura. Es el modo por defecto.
 *   · `postgres` → servidor compartido por web, móvil y escritorio.
 *
 * `synchronize` está desactivado siempre y en todos los entornos: el esquema
 * solo cambia mediante migraciones revisadas en un pull request.
 */
export const dataSourceOptions: DataSourceOptions =
  env.DB_DRIVER === 'postgres'
    ? {
        type: 'postgres',
        host: env.POSTGRES_HOST,
        port: env.POSTGRES_PORT,
        username: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
        database: env.POSTGRES_DB,
        synchronize: false,
        logging,
        entities,
        migrations,
        migrationsTableName: 'typeorm_migrations',
        ssl:
          isProduction && process.env.POSTGRES_SSL === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }
    : {
        type: 'better-sqlite3',
        database: sqlitePath,
        synchronize: false,
        logging,
        entities,
        migrations,
        migrationsTableName: 'typeorm_migrations',
        // WAL permite leer mientras se escribe: sin él, la app de escritorio
        // se bloquea a sí misma en cuanto hay dos consultas a la vez.
        enableWAL: true,
      };

/** Crea el directorio del fichero .sqlite la primera vez que se arranca. */
export function ensureSqliteDirectory(): void {
  if (env.DB_DRIVER !== 'sqlite') return;
  mkdirSync(dirname(sqlitePath), { recursive: true });
}

ensureSqliteDirectory();

/**
 * DataSource usado por `pnpm --filter @navis/api typeorm`.
 *
 * Tiene que ser la ÚNICA exportación de tipo DataSource del fichero: el CLI de
 * TypeORM recorre todas y falla si encuentra dos (por eso no hay
 * `export default`, que contaría como una segunda).
 */
export const dataSource = new DataSource(dataSourceOptions);
