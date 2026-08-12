import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { eachDay, type HabitOccurrence, type HabitReminder, type TagRef } from '@navis/shared';
import { Between, In, Repository } from 'typeorm';

import { habitAppliesOn } from './habit-recurrence';
import { HabitOccurrence as HabitOccurrenceEntity } from './habit-occurrence.entity';
import { HabitReminderTag } from './habit-reminder-tag.entity';
import { HabitReminder as HabitReminderEntity } from './habit-reminder.entity';
import { HabitTag } from './habit-tag.entity';
import { Habit } from './habit.entity';

/** La expansión de hábitos: mismo patrón que `TasksExpansionService`. */
@Injectable()
export class HabitsExpansionService {
  constructor(
    @InjectRepository(Habit) private readonly habits: Repository<Habit>,
    @InjectRepository(HabitOccurrenceEntity)
    private readonly occurrences: Repository<HabitOccurrenceEntity>,
    @InjectRepository(HabitTag) private readonly habitTags: Repository<HabitTag>,
    @InjectRepository(HabitReminderEntity)
    private readonly reminders: Repository<HabitReminderEntity>,
  ) {}

  async range(
    churchId: string,
    ownerId: string,
    from: string,
    to: string,
  ): Promise<HabitOccurrence[]> {
    const templates = await this.templatesActiveIn(churchId, ownerId, from, to);
    if (templates.length === 0) return [];

    const ids = templates.map((habit) => habit.id);
    const [materialized, tagsByHabit, remindersByHabit] = await Promise.all([
      this.occurrences.find({ where: { habitId: In(ids), date: Between(from, to) } }),
      this.tagsFor(ids),
      this.remindersFor(ids),
    ]);
    const byKey = new Map(materialized.map((row) => [`${row.habitId}:${row.date}`, row]));

    const isRecurring = (habit: Habit) => habit.repeatFreq !== 'ninguna';
    const result: HabitOccurrence[] = [];
    for (const date of eachDay(from, to)) {
      for (const habit of templates) {
        if (!habitAppliesOn(habit, date)) continue;
        const materializedRow = isRecurring(habit) ? byKey.get(`${habit.id}:${date}`) : undefined;

        const isMaterialized = isRecurring(habit) ? Boolean(materializedRow) : true;
        if (habit.deletedAt && !isMaterialized) continue;

        result.push(
          toView(
            habit,
            date,
            materializedRow,
            tagsByHabit.get(habit.id) ?? [],
            remindersByHabit.get(habit.id) ?? null,
          ),
        );
      }
    }

    return result.sort(byDateThenTime);
  }

  day(churchId: string, ownerId: string, date: string): Promise<HabitOccurrence[]> {
    return this.range(churchId, ownerId, date, date);
  }

  private templatesActiveIn(
    churchId: string,
    ownerId: string,
    from: string,
    to: string,
  ): Promise<Habit[]> {
    return this.habits
      .createQueryBuilder('habit')
      .withDeleted()
      .where('habit.churchId = :churchId', { churchId })
      .andWhere('habit.ownerId = :ownerId', { ownerId })
      .andWhere('habit.date <= :to', { to })
      .andWhere("(habit.repeatFreq != 'ninguna' OR habit.date >= :from)", { from })
      .getMany();
  }

  private async tagsFor(habitIds: string[]): Promise<Map<string, TagRef[]>> {
    const links = await this.habitTags.find({
      where: { habitId: In(habitIds) },
      relations: { tag: true },
    });
    const byHabit = new Map<string, TagRef[]>();
    for (const link of links) {
      const list = byHabit.get(link.habitId) ?? [];
      list.push({
        id: link.tag.id,
        name: link.tag.name,
        icon: link.tag.icon,
        accent: link.tag.accent,
      });
      byHabit.set(link.habitId, list);
    }
    return byHabit;
  }

  private async remindersFor(habitIds: string[]): Promise<Map<string, HabitReminder>> {
    const rows = await this.reminders.find({
      where: { habitId: In(habitIds) },
      relations: { tags: { tag: true } },
    });
    return new Map(
      rows.map((row) => [
        row.habitId,
        {
          enabled: row.enabled,
          remindAt: row.remindAt.toISOString(),
          tags: row.tags.map((link) => ({
            id: link.tag.id,
            name: link.tag.name,
            icon: link.tag.icon,
            accent: link.tag.accent,
          })),
        },
      ]),
    );
  }
}

function toView(
  habit: Habit,
  date: string,
  materialized: HabitOccurrenceEntity | undefined,
  tags: TagRef[],
  reminder: HabitReminder | null,
): HabitOccurrence {
  const isRecurring = habit.repeatFreq !== 'ninguna';
  const status = isRecurring
    ? (materialized?.status ?? 'pendiente')
    : (habit.status ?? 'pendiente');
  const completedAt = isRecurring
    ? (materialized?.completedAt?.toISOString() ?? null)
    : (habit.completedAt?.toISOString() ?? null);

  return {
    habitId: habit.id,
    date,
    title: habit.title,
    goal: habit.goal,
    description: habit.description,
    time: habit.time,
    status,
    completedAt,
    isRecurring,
    tags,
    reminder,
    createdAt: habit.createdAt.toISOString(),
  };
}

function byDateThenTime(a: HabitOccurrence, b: HabitOccurrence): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.time !== b.time)
    return a.time === null ? 1 : b.time === null ? -1 : a.time.localeCompare(b.time);
  return a.title.localeCompare(b.title);
}
