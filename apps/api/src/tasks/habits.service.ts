import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Habit as HabitView } from '@navis/shared';
import { Repository } from 'typeorm';

import type { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto';
import { HabitReminderTag } from './habit-reminder-tag.entity';
import { HabitReminder } from './habit-reminder.entity';
import { HabitTag } from './habit-tag.entity';
import { Habit } from './habit.entity';
import { TagsService } from './tags.service';

/** La plantilla de un hábito (RFC 0018 §5.3, §8): mismo patrón que `TasksService`. */
@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit) private readonly habits: Repository<Habit>,
    @InjectRepository(HabitTag) private readonly habitTags: Repository<HabitTag>,
    @InjectRepository(HabitReminder) private readonly reminders: Repository<HabitReminder>,
    @InjectRepository(HabitReminderTag) private readonly reminderTags: Repository<HabitReminderTag>,
    private readonly tags: TagsService,
  ) {}

  async require(churchId: string, ownerId: string, id: string): Promise<Habit> {
    const habit = await this.habits.findOne({ where: { id, churchId, ownerId } });
    if (!habit) throw new NotFoundException('Ese hábito no existe');
    return habit;
  }

  async create(churchId: string, ownerId: string, dto: CreateHabitDto): Promise<Habit> {
    await this.tags.requireAll(churchId, ownerId, [...dto.tagIds, ...dto.reminderTagIds]);
    const isRecurring = dto.repeatFreq !== 'ninguna';

    const habit = await this.habits.save(
      this.habits.create({
        churchId,
        ownerId,
        title: dto.title,
        goal: dto.goal ?? null,
        description: dto.description ?? null,
        date: dto.date,
        time: dto.time ?? null,
        status: isRecurring ? null : 'pendiente',
        completedAt: null,
        repeatFreq: dto.repeatFreq,
      }),
    );

    await this.setTags(habit.id, dto.tagIds);
    await this.setReminder(
      habit.id,
      dto.reminderEnabled,
      dto.reminderAt ?? defaultReminder(dto.date, dto.time ?? null),
      dto.reminderTagIds,
    );

    return habit;
  }

  async update(churchId: string, ownerId: string, id: string, dto: UpdateHabitDto): Promise<Habit> {
    const habit = await this.require(churchId, ownerId, id);

    const tagIds = [...(dto.tagIds ?? []), ...(dto.reminderTagIds ?? [])];
    if (tagIds.length > 0) await this.tags.requireAll(churchId, ownerId, tagIds);

    if (dto.title !== undefined) habit.title = dto.title;
    if (dto.goal !== undefined) habit.goal = dto.goal ?? null;
    if (dto.description !== undefined) habit.description = dto.description ?? null;
    if (dto.date !== undefined) habit.date = dto.date;
    if (dto.time !== undefined) habit.time = dto.time;
    if (dto.repeatFreq !== undefined) habit.repeatFreq = dto.repeatFreq;
    if (habit.repeatFreq === 'ninguna' && habit.status === null) habit.status = 'pendiente';

    await this.habits.save(habit);
    if (dto.tagIds) await this.setTags(habit.id, dto.tagIds);
    if (dto.reminderEnabled !== undefined || dto.reminderAt !== undefined || dto.reminderTagIds) {
      await this.setReminder(
        habit.id,
        dto.reminderEnabled ?? true,
        dto.reminderAt ?? defaultReminder(habit.date, habit.time),
        dto.reminderTagIds ?? [],
      );
    }

    return habit;
  }

  async remove(churchId: string, ownerId: string, id: string): Promise<void> {
    const habit = await this.require(churchId, ownerId, id);
    await this.habits.softRemove(habit);
  }

  /** La plantilla entera, con sus etiquetas y su recordatorio (§9.6). */
  async view(churchId: string, ownerId: string, id: string): Promise<HabitView> {
    const habit = await this.require(churchId, ownerId, id);
    const [tagLinks, reminder] = await Promise.all([
      this.habitTags.find({ where: { habitId: habit.id }, relations: { tag: true } }),
      this.reminders.findOne({ where: { habitId: habit.id }, relations: { tags: { tag: true } } }),
    ]);

    return {
      id: habit.id,
      title: habit.title,
      goal: habit.goal,
      description: habit.description,
      date: habit.date,
      time: habit.time,
      repeatFreq: habit.repeatFreq,
      status: habit.status,
      completedAt: habit.completedAt?.toISOString() ?? null,
      tags: tagLinks.map((link) => ({
        id: link.tag.id,
        name: link.tag.name,
        icon: link.tag.icon,
        accent: link.tag.accent,
      })),
      reminder: reminder
        ? {
            enabled: reminder.enabled,
            remindAt: reminder.remindAt.toISOString(),
            tags: reminder.tags.map((link) => ({
              id: link.tag.id,
              name: link.tag.name,
              icon: link.tag.icon,
              accent: link.tag.accent,
            })),
          }
        : null,
    };
  }

  private async setTags(habitId: string, tagIds: string[]): Promise<void> {
    await this.habitTags.delete({ habitId });
    if (tagIds.length > 0) {
      await this.habitTags.save(tagIds.map((tagId) => this.habitTags.create({ habitId, tagId })));
    }
  }

  private async setReminder(
    habitId: string,
    enabled: boolean,
    remindAt: string,
    tagIds: string[],
  ): Promise<void> {
    let reminder = await this.reminders.findOne({ where: { habitId } });
    if (reminder) {
      reminder.enabled = enabled;
      reminder.remindAt = new Date(remindAt);
      reminder = await this.reminders.save(reminder);
    } else {
      reminder = await this.reminders.save(
        this.reminders.create({ habitId, enabled, remindAt: new Date(remindAt) }),
      );
    }

    await this.reminderTags.delete({ reminderId: reminder.id });
    if (tagIds.length > 0) {
      await this.reminderTags.save(
        tagIds.map((tagId) => this.reminderTags.create({ reminderId: reminder.id, tagId })),
      );
    }
  }
}

function defaultReminder(date: string, time: string | null): string {
  return `${date}T${time ?? '09:00'}`;
}
