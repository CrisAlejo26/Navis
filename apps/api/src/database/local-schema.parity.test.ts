import {
  LOCAL_TABLES,
  LOCAL_USER_TABLE,
  type LocalColumnType,
  type LocalTable,
} from '@navis/shared';
import { DataSource, type EntityMetadata } from 'typeorm';
import { beforeAll, describe, expect, it } from 'vitest';

import { Believer } from '../believers/believer.entity';
import { BelieverGift } from '../believers/believer-gift.entity';
import { BelieverMinistry } from '../believers/believer-ministry.entity';
import { BelieverNote } from '../believers/believer-note.entity';
import { BelieverTag } from '../believers/believer-tag.entity';
import { BelieverTagLink } from '../believers/believer-tag-link.entity';
import { Gift } from '../believers/gift.entity';
import { Ministry } from '../believers/ministry.entity';
import { Calendar } from '../calendar/calendar.entity';
import { Congregation } from '../calendar/congregation.entity';
import { Meeting } from '../calendar/meeting.entity';
import { MeetingPattern } from '../calendar/meeting-pattern.entity';
import { PatternPhase } from '../calendar/pattern-phase.entity';
import { Church } from '../churches/church.entity';
import { MeetingSlot } from '../calendar/meeting-slot.entity';
import { NoteAudio } from '../believers/note-audio.entity';
import { Task } from '../tasks/task.entity';
import { Tag } from '../tasks/tag.entity';
import { TaskOccurrence } from '../tasks/task-occurrence.entity';
import { TaskReminder } from '../tasks/task-reminder.entity';
import { TaskReminderTag } from '../tasks/task-reminder-tag.entity';
import { TaskTag } from '../tasks/task-tag.entity';

/**
 * La paridad entre el esquema **local del teléfono** (`ALL_LOCAL_TABLES` de
 * `@navis/shared`) y las entidades de TypeORM que espeja (RFC 0024, Fase 1).
 *
 * Es el test que avisa cuando alguien añade una columna a una entidad de la
 * API y se olvida de la base local del móvil — o al revés. Compara **nombre,
 * tipo y anulabilidad** de cada columna; los `DEFAULT` son de cada motor y no
 * se comparan.
 */

/** Las entidades que participan en la comparación, más las que sus relaciones exigen registradas. */
const ENTITIES = [
  Church,
  Congregation,
  Calendar,
  MeetingPattern,
  PatternPhase,
  Meeting,
  MeetingSlot,
  Believer,
  BelieverNote,
  BelieverTag,
  Ministry,
  Gift,
  BelieverMinistry,
  BelieverGift,
  BelieverTagLink,
  Task,
  Tag,
  TaskTag,
  TaskOccurrence,
  // Objetivos de relación: TypeORM las exige en el registro de entidades para
  // poder construir los metadatos, aunque no se comparen.
  NoteAudio,
  TaskReminder,
  TaskReminderTag,
];

/**
 * El tipo lógico local que le toca a cada tipo de TypeORM **en SQLite**
 * (`DB_DRIVER=sqlite`): los uuid son `varchar`, los `TIMESTAMP` son
 * `datetime` y `date`/`time` son texto — la correspondencia que documenta
 * `packages/shared/src/local-schema.ts`.
 */
const TYPE_MAP: Record<string, LocalColumnType> = {
  text: 'text',
  varchar: 'text',
  uuid: 'text',
  date: 'text',
  time: 'text',
  datetime: 'text',
  timestamptz: 'text',
  int: 'int',
  integer: 'int',
  boolean: 'bool',
  real: 'real',
  double: 'real',
  float: 'real',
};

function localTypeOf(metadata: EntityMetadata, columnName: string): LocalColumnType {
  const column = metadata.columns.find((one) => one.databaseName === columnName);
  if (!column)
    throw new Error(`La entidad ${metadata.tableName} no tiene la columna ${columnName}`);

  const raw = column.type;
  const name = typeof raw === 'string' ? raw : (raw as { name: string }).name.toLowerCase();
  const mapped = TYPE_MAP[name];
  if (!mapped) throw new Error(`Tipo de TypeORM sin equivalente local: ${name}`);
  return mapped;
}

let dataSource: DataSource;

beforeAll(async () => {
  dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: ENTITIES,
  });
  // Los metadatos se construyen al inicializar; con un driver en memoria no
  // llega a crear fichero ninguno.
  await dataSource.initialize();
  await dataSource.destroy();
});

describe.each(LOCAL_TABLES)('paridad local ↔ TypeORM: $name', (localTable: LocalTable) => {
  it('existe la entidad que espeja', () => {
    expect(localTable.mirror).toBeDefined();
    const metadata = dataSource.entityMetadatas.find((one) => one.tableName === localTable.name);
    expect(metadata, `No hay entidad para la tabla ${localTable.name}`).toBeDefined();
  });

  it('tiene las mismas columnas, con el mismo tipo y la misma anulabilidad', () => {
    const metadata = dataSource.entityMetadatas.find((one) => one.tableName === localTable.name);
    expect(metadata).toBeDefined();
    if (!metadata) return;

    const entityColumns = metadata.columns.map((one) => one.databaseName).sort();
    const localColumns = localTable.columns.map((one) => one.name).sort();
    expect(localColumns).toEqual(entityColumns);

    for (const column of localTable.columns) {
      expect(localTypeOf(metadata, column.name), `${localTable.name}.${column.name}: tipo`).toBe(
        column.type,
      );
      expect(
        metadata.columns.find((one) => one.databaseName === column.name)!.isNullable,
        `${localTable.name}.${column.name}: anulabilidad`,
      ).toBe(Boolean(column.nullable));
    }
  });
});

describe('la cuenta local', () => {
  it('no espeja ninguna entidad: es propia del móvil', () => {
    expect(LOCAL_USER_TABLE.mirror).toBeUndefined();
    expect(LOCAL_USER_TABLE.columns.map((one) => one.name)).toEqual([
      'id',
      'name',
      'email',
      'password_hash',
      'created_at',
      'updated_at',
    ]);
  });
});
