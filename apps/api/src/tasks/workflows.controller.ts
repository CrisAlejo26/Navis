import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { WorkflowWithCount } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';
import { WorkflowsService } from './workflows.service';

/** Los flujos de trabajo de las tareas (Fase 7b). */
@ApiTags('tareas')
@Controller('workflows')
@UseGuards(ActiveChurchGuard)
@RequirePermissions('tasks.view')
export class WorkflowsController {
    constructor(private readonly workflows: WorkflowsService) {}

    @Get()
    @ApiOperation({ summary: 'Los flujos de la cuenta en la iglesia activa, con su recuento' })
    list(
        @CurrentChurch() churchId: string,
        @CurrentUser('id') ownerId: string,
    ): Promise<WorkflowWithCount[]> {
        return this.workflows.list(churchId, ownerId);
    }

    @Post()
    @ApiOperation({ summary: 'Crea un flujo' })
    create(
        @CurrentChurch() churchId: string,
        @CurrentUser('id') ownerId: string,
        @Body() dto: CreateWorkflowDto,
    ): Promise<WorkflowWithCount> {
        return this.workflows.create(churchId, ownerId, dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Edita un flujo' })
    update(
        @CurrentChurch() churchId: string,
        @CurrentUser('id') ownerId: string,
        @Param('id') id: string,
        @Body() dto: UpdateWorkflowDto,
    ): Promise<WorkflowWithCount> {
        return this.workflows.update(churchId, ownerId, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Borra un flujo; sus tareas se quedan sin flujo' })
    async remove(
        @CurrentChurch() churchId: string,
        @CurrentUser('id') ownerId: string,
        @Param('id') id: string,
    ): Promise<void> {
        await this.workflows.remove(churchId, ownerId, id);
    }
}
