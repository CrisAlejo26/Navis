import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ProphecyFulfillment as FulfillmentView } from '@navis/shared';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateFulfillmentDto, UpdateFulfillmentDto } from './dto/prophecy.dto';
import { FulfillmentsService } from './fulfillments.service';
import { toFulfillmentView } from './prophecies.mapper';

/**
 * Los cumplimientos parciales de una profecía (RFC 0004 D4).
 *
 * Cuelgan de su profecía en la ruta y no de una raíz `/fulfillments`: así el
 * alcance se comprueba una vez, al resolverla, y no hay forma de tocar el
 * cumplimiento de otra persona.
 */
@ApiTags('profecias')
@Controller('prophecies/:prophecyId/fulfillments')
export class FulfillmentsController {
  constructor(private readonly fulfillments: FulfillmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Anota una parte que ya se ha cumplido' })
  async create(
    @CurrentUser('id') ownerId: string,
    @Param('prophecyId') prophecyId: string,
    @Body() dto: CreateFulfillmentDto,
  ): Promise<FulfillmentView> {
    return toFulfillmentView(await this.fulfillments.create(ownerId, prophecyId, dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Corrige el texto o la fecha' })
  async update(
    @CurrentUser('id') ownerId: string,
    @Param('prophecyId') prophecyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFulfillmentDto,
  ): Promise<FulfillmentView> {
    return toFulfillmentView(await this.fulfillments.update(ownerId, prophecyId, id, dto));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Lo quita y recalcula el último movimiento' })
  remove(
    @CurrentUser('id') ownerId: string,
    @Param('prophecyId') prophecyId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.fulfillments.remove(ownerId, prophecyId, id);
  }
}
