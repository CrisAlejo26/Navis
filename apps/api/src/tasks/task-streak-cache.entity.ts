import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';

/**
 * La racha más larga de cada cuenta, en cada iglesia (RFC 0018 §5.6, D9).
 *
 * No guarda la racha **actual**: esa se calcula en cada lectura (§6.2). Solo
 * el máximo, que únicamente puede crecer, así que nunca se desincroniza.
 */
@Entity('task_streak_cache')
@Index('UQ_task_streak_cache', ['churchId', 'ownerId'], { unique: true })
export class TaskStreakCache extends BaseEntity {
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @Column({ name: 'owner_id', type: 'text' })
  ownerId: string;

  @Column({ name: 'longest_streak', type: 'int', default: 0 })
  longestStreak: number;
}
