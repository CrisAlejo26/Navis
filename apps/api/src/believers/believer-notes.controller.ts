import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { BelieverNote as NoteView, NoteCounts, NoteDay, Paginated } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { BelieverHistoryService } from './believer-history.service';
import { BelieverNotesService } from './believer-notes.service';
import { BelieversService } from './believers.service';
import { CreateNoteDto, NoteDaysQueryDto, NotesQueryDto, UpdateNoteDto } from './dto/note.dto';
import { NotesViewService } from './notes-view.service';

/**
 * La **bitácora** de un hermano (RFC 0003 §6).
 *
 * Las notas cuelgan de su creyente en la ruta y no de una raíz `/notes`: así el
 * alcance se comprueba una vez, al resolver el creyente, y no hay forma de
 * tocar la nota de otra iglesia.
 *
 * `days` va declarado antes que `:noteId` por lo de siempre: con el orden al
 * revés, Nest intentaría resolver «days» como un identificador.
 */
@ApiTags('creyentes')
@Controller('believers/:id/notes')
@UseGuards(ActiveChurchGuard)
export class BelieverNotesController {
  constructor(
    private readonly notes: BelieverNotesService,
    private readonly history: BelieverHistoryService,
    private readonly believers: BelieversService,
    private readonly view: NotesViewService,
  ) {}

  @Get()
  @RequirePermissions('believers.view')
  @ApiOperation({ summary: 'La bitácora, paginada, buscable y más reciente primero' })
  @ApiOkResponse({ description: 'Página de notas, con las cuentas por tipo' })
  async list(
    @CurrentChurch() churchId: string,
    @Param('id') believerId: string,
    @Query() query: NotesQueryDto,
  ): Promise<Paginated<NoteView> & { counts: NoteCounts }> {
    await this.believers.require(churchId, believerId);

    const [{ items, total }, counts] = await Promise.all([
      this.history.list(believerId, query),
      this.history.countsOf(believerId, query.search),
    ]);

    return {
      items: await this.view.of(churchId, items),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
      counts,
    };
  }

  @Get('days')
  @RequirePermissions('believers.view')
  @ApiOperation({ summary: 'Qué días tienen notas, para la vista de calendario' })
  async days(
    @CurrentChurch() churchId: string,
    @Param('id') believerId: string,
    @Query() query: NoteDaysQueryDto,
  ): Promise<NoteDay[]> {
    await this.believers.require(churchId, believerId);
    return this.history.days(believerId, query.from, query.to);
  }

  @Post()
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Añade una nota; si es de tipo «don», se lo suma a la ficha' })
  async create(
    @CurrentChurch() churchId: string,
    @Param('id') believerId: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser('id') authorId: string | undefined,
  ): Promise<NoteView> {
    await this.believers.require(churchId, believerId);
    const note = await this.notes.create(
      churchId,
      believerId,
      {
        ...dto,
        advice: dto.advice ?? undefined,
        giftId: dto.giftId ?? undefined,
        remindAt: dto.remindAt ?? undefined,
        remindText: dto.remindText ?? undefined,
      },
      authorId ?? null,
    );

    return this.view.one(churchId, note);
  }

  @Patch(':noteId')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Edita una nota; mover su fecha recalcula el aviso' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') believerId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
  ): Promise<NoteView> {
    await this.believers.require(churchId, believerId);
    const note = await this.notes.update(churchId, believerId, noteId, dto);

    return this.view.one(churchId, note);
  }

  @Delete(':noteId')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Borrado lógico; el don recibido no se le quita (§6.3)' })
  async remove(
    @CurrentChurch() churchId: string,
    @Param('id') believerId: string,
    @Param('noteId') noteId: string,
  ): Promise<void> {
    await this.believers.require(churchId, believerId);
    await this.notes.remove(believerId, noteId);
  }
}
