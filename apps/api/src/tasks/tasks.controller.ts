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
import type {
  Paginated,
  Task as TaskView,
  TaskOccurrence,
  TaskStats,
  TaskStreak,
} from '@navis/shared';

import { ChurchClockService } from '../churches/church-clock.service';
import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { SetTaskOccurrenceStatusDto } from './dto/occurrence-status.dto';
import { TasksQueryDto } from './dto/tasks-query.dto';
import { TasksListService } from './tasks-list.service';
import { TasksOccurrenceService } from './tasks-occurrence.service';
import { TasksStatsService } from './tasks-stats.service';
import { TasksStreakService } from './tasks-streak.service';
import { TasksService } from './tasks.service';

/**
 * Las tareas (RFC 0018 §8). `streak` y `stats` van declaradas antes de
 * `:id`, o Nest los leería como un identificador — igual que `stats`/`export`
 * en el cuaderno.
 */
@ApiTags('tareas')
@Controller('tasks')
@UseGuards(ActiveChurchGuard)
@RequirePermissions('tasks.view')
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly listService: TasksListService,
    private readonly occurrences: TasksOccurrenceService,
    private readonly streakService: TasksStreakService,
    private readonly statsService: TasksStatsService,
    private readonly clock: ChurchClockService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Tareas del rango, expandidas (D3), filtradas y paginadas' })
  async list(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Query() query: TasksQueryDto,
  ): Promise<Paginated<TaskOccurrence>> {
    const today = await this.clock.today(churchId);
    return this.listService.list(churchId, ownerId, today, query);
  }

  @Get('streak')
  @ApiOperation({ summary: 'Racha actual y más larga (§6)' })
  async streak(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
  ): Promise<TaskStreak> {
    const today = await this.clock.today(churchId);
    return this.streakService.streak(churchId, ownerId, today);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Series para los gráficos de «Estadísticas» (§9.4)' })
  async stats(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
  ): Promise<TaskStats> {
    const today = await this.clock.today(churchId);
    return this.statsService.stats(churchId, ownerId, today, from ?? today, to ?? today);
  }

  @Post()
  @ApiOperation({ summary: 'Crea una tarea, con etiquetas y recordatorio anidados' })
  async create(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskView> {
    const task = await this.tasks.create(churchId, ownerId, dto);
    return this.tasks.view(churchId, ownerId, task.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'La plantilla entera, para el formulario de edición (§9.6)' })
  view(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
  ): Promise<TaskView> {
    return this.tasks.view(churchId, ownerId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita la plantilla (D18: no toca lo ya materializado)' })
  async update(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskView> {
    await this.tasks.update(churchId, ownerId, id, dto);
    return this.tasks.view(churchId, ownerId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Borrado lógico (D18)' })
  async remove(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.tasks.remove(churchId, ownerId, id);
  }

  @Put(':id/occurrences/:date')
  @ApiOperation({ summary: 'Cambia el estado de ese día; materializa si hace falta (D3)' })
  async setOccurrence(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
    @Param('date') date: string,
    @Body() dto: SetTaskOccurrenceStatusDto,
  ): Promise<void> {
    await this.occurrences.setStatus(churchId, ownerId, id, date, dto.status);
  }
}
