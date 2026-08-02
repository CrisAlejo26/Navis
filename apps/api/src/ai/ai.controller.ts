import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Max, Min } from 'class-validator';

import { Roles } from '../common/decorators/roles.decorator';
import { AiService } from './ai.service';
import type { AiCompletionResult } from './ai.types';

class CompleteDto {
  @IsString()
  @Length(1, 8000)
  prompt: string;

  @IsOptional()
  @IsString()
  @Length(1, 4000)
  system?: string;

  @IsOptional()
  @Min(1)
  @Max(8192)
  maxTokens?: number;
}

@ApiTags('ia')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('status')
  @ApiOperation({ summary: 'Indica si la IA está activada y con qué proveedor' })
  status() {
    return this.ai.status();
  }

  @Post('complete')
  @Roles('pastor')
  @ApiOperation({ summary: 'Completa un prompt con el proveedor configurado' })
  complete(@Body() dto: CompleteDto): Promise<AiCompletionResult> {
    return this.ai.complete(dto.prompt, { system: dto.system, maxTokens: dto.maxTokens });
  }
}
