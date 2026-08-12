import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { Habit } from './habit.entity';
import type { Tag } from './tag.entity';

/** Qué etiquetas lleva un hábito (RFC 0018 §5.3). Tabla puente, única por par. */
@Entity('habit_tags')
@Index('UQ_habit_tags', ['habitId', 'tagId'], { unique: true })
export class HabitTag extends BaseEntity {
  @Column({ name: 'habit_id', type: UUID })
  habitId: string;

  @Column({ name: 'tag_id', type: UUID })
  tagId: string;

  @ManyToOne('Habit', 'tags', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'habit_id' })
  habit: Relation<Habit>;

  @ManyToOne('Tag', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Relation<Tag>;
}
