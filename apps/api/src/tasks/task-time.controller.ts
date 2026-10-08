import {
    BadRequestException,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
    RunningTimer,
    RunningTimerState,
    TaskTime,
    TaskTimeEntry,
    TaskTimeSummary,
} from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { TaskTimeSummaryQueryDto } from './dto/task-time-query.dto';
import { TaskTimeSummaryService } from './task-time-summary.service';
import { TaskTimeService } from './task-time.service';

const MAX_SUMMARY_DAYS = 366;

/**
 * El cronómetro de las tareas (Fase 7c). `time/...` son dos segmentos y no
 * chocan con `GET /tasks/:id`, pero `:id/time` sí cuelga de una tarea concreta.
 */
@ApiTags('tareas')
@Controller('tasks')
@UseGuards(ActiveChurchGuard)
@RequirePermissions('tasks.view')
export class TaskTimeController {
    constructor(
        private readonly time: TaskTimeService,
        private readonly summaryService: TaskTimeSummaryService,
    ) {}

    @Get('time/running')
    @ApiOperation({ summary: 'El cronómetro en marcha de la persona, o nada' })
    async running(
        @CurrentChurch() churchId: string,
        @CurrentUser('id') ownerId: string,
    ): Promise<RunningTimerState> {
        return { timer: await this.time.running(churchId, ownerId) };
    }

    @Post('time/stop')
    @ApiOperation({ summary: 'Detiene el cronómetro en marcha' })
    stop(
        @CurrentChurch() churchId: string,
        @CurrentUser('id') ownerId: string,
    ): Promise<TaskTimeEntry> {
        return this.time.stop(churchId, ownerId);
    }

    @Get('time/summary')
    @ApiOperation({ summary: 'El tiempo trabajado del rango, por tarea y por flujo' })
    summary(
        @CurrentChurch() churchId: string,
        @CurrentUser('id') ownerId: string,
        @Query() query: TaskTimeSummaryQueryDto,
    ): Promise<TaskTimeSummary> {
        const days = (new Date(query.to).getTime() - new Date(query.from).getTime()) / 86_400_000;
        if (days < 0 || days > MAX_SUMMARY_DAYS)
            throw new BadRequestException('El rango de fechas no es válido');
        return this.summaryService.summary(churchId, ownerId, query.from, query.to);
    }

    @Delete('time/entries/:entryId')
    @ApiOperation({ summary: 'Borra una entrada de tiempo' })
    async removeEntry(
        @CurrentChurch() churchId: string,
        @CurrentUser('id') ownerId: string,
        @Param('entryId') entryId: string,
    ): Promise<void> {
        await this.time.remove(churchId, ownerId, entryId);
    }

    @Post(':id/time/start')
    @ApiOperation({ summary: 'Empieza el cronómetro de una tarea; detiene el que hubiera' })
    start(
        @CurrentChurch() churchId: string,
        @CurrentUser('id') ownerId: string,
        @Param('id') id: string,
    ): Promise<RunningTimer> {
        return this.time.start(churchId, ownerId, id);
    }

    @Get(':id/time')
    @ApiOperation({ summary: 'Las entradas de tiempo de una tarea y su total' })
    ofTask(
        @CurrentChurch() churchId: string,
        @CurrentUser('id') ownerId: string,
        @Param('id') id: string,
    ): Promise<TaskTime> {
        return this.time.ofTask(churchId, ownerId, id);
    }
}
