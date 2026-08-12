import { BadRequestException, Injectable } from '@nestjs/common';
import {
  addDays,
  MAX_TASKS_RANGE_DAYS,
  type HabitOccurrence,
  type HabitsQuery,
  type Paginated,
} from '@navis/shared';

import { HabitsExpansionService } from './habits-expansion.service';

const DEFAULT_WINDOW_DAYS = 30;

/** `GET /habits`: mismo patrón que `TasksListService`, sin prioridad en el orden. */
@Injectable()
export class HabitsListService {
  constructor(private readonly expansion: HabitsExpansionService) {}

  async list(
    churchId: string,
    ownerId: string,
    today: string,
    query: HabitsQuery,
  ): Promise<Paginated<HabitOccurrence>> {
    const from = query.from ?? today;
    const to = query.to ?? addDays(from, DEFAULT_WINDOW_DAYS);
    checkRange(from, to);

    const all = await this.expansion.range(churchId, ownerId, from, to);
    const filtered = applyFilters(all, query);
    const sorted = applySort(filtered, query.sort);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, query.limit ?? 20);
    const start = (page - 1) * limit;

    return {
      items: sorted.slice(start, start + limit),
      total: sorted.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(sorted.length / limit)),
    };
  }
}

function checkRange(from: string, to: string): void {
  const days = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
  if (days < 0) throw new BadRequestException('El rango de fechas está del revés');
  if (days > MAX_TASKS_RANGE_DAYS) {
    throw new BadRequestException(
      `El rango no puede pasar de ${String(MAX_TASKS_RANGE_DAYS)} días`,
    );
  }
}

function applyFilters(items: HabitOccurrence[], query: HabitsQuery): HabitOccurrence[] {
  const search = query.search?.trim().toLowerCase();
  const tagIds = query.tag?.length ? new Set(query.tag) : null;

  return items.filter((item) => {
    if (query.hideCompleted && item.status === 'completada') return false;
    if (search) {
      const haystack = `${item.title} ${item.description ?? ''}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (tagIds && !item.tags.some((tag) => tagIds.has(tag.id))) return false;
    if (query.reminder === 'with' && !(item.reminder?.enabled ?? false)) return false;
    if (query.reminder === 'without' && (item.reminder?.enabled ?? false)) return false;
    return true;
  });
}

function applySort(items: HabitOccurrence[], sort: HabitsQuery['sort']): HabitOccurrence[] {
  const sorted = [...items];
  switch (sort) {
    case 'farthest':
      return sorted.reverse();
    case 'recent':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'alphabetical':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'nearest':
    default:
      return sorted;
  }
}
