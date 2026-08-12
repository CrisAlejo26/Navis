import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Habit as HabitView, HabitOccurrence, HabitStats, Paginated } from '@navis/shared';

import { ChurchClockService } from '../churches/church-clock.service';
import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto';
import { HabitsQueryDto } from './dto/habits-query.dto';
import { SetHabitOccurrenceStatusDto } from './dto/occurrence-status.dto';
import { HabitsListService } from './habits-list.service';
import { HabitsOccurrenceService } from './habits-occurrence.service';
import { HabitsStatsService } from './habits-stats.service';
import { HabitsService } from './habits.service';

/** Los hábitos (RFC 0018 §8). Igual que las tareas, sin racha (D19). */
@ApiTags('tareas')
@Controller('habits')
@UseGuards(ActiveChurchGuard)
@RequirePermissions('tasks.view')
export class HabitsController {
  constructor(
    private readonly habits: HabitsService,
    private readonly listService: HabitsListService,
    private readonly occurrences: HabitsOccurrenceService,
    private readonly statsService: HabitsStatsService,
    private readonly clock: ChurchClockService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Hábitos del rango, expandidos, filtrados y paginados' })
  async list(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Query() query: HabitsQueryDto,
  ): Promise<Paginated<HabitOccurrence>> {
    const today = await this.clock.today(churchId);
    return this.listService.list(churchId, ownerId, today, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Series de cumplimiento de hábitos (§9.4)' })
  async stats(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
  ): Promise<HabitStats> {
    const today = await this.clock.today(churchId);
    return this.statsService.stats(churchId, ownerId, from ?? today, to ?? today);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un hábito, con etiquetas y recordatorio anidados' })
  async create(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreateHabitDto,
  ): Promise<HabitView> {
    const habit = await this.habits.create(churchId, ownerId, dto);
    return this.habits.view(churchId, ownerId, habit.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'La plantilla entera, para el formulario de edición' })
  view(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
  ): Promise<HabitView> {
    return this.habits.view(churchId, ownerId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita la plantilla' })
  async update(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
    @Body() dto: UpdateHabitDto,
  ): Promise<HabitView> {
    await this.habits.update(churchId, ownerId, id, dto);
    return this.habits.view(churchId, ownerId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Borrado lógico' })
  async remove(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.habits.remove(churchId, ownerId, id);
  }

  @Put(':id/occurrences/:date')
  @ApiOperation({ summary: 'Cambia el estado de ese día; materializa si hace falta' })
  async setOccurrence(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
    @Param('date') date: string,
    @Body() dto: SetHabitOccurrenceStatusDto,
  ): Promise<void> {
    await this.occurrences.setStatus(churchId, ownerId, id, date, dto.status);
  }
}
