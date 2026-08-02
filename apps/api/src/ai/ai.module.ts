import { Module } from '@nestjs/common';

import { env } from '../config/env';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AI_PROVIDER } from './ai.types';
import { AnthropicProvider } from './providers/anthropic.provider';
import { PythonServiceProvider } from './providers/python-service.provider';

/**
 * Módulo de IA. Está cableado pero desactivado por defecto (AI_ENABLED=false):
 * la idea es que las features de IA lleguen después sin tocar la arquitectura.
 */
@Module({
  controllers: [AiController],
  providers: [
    AnthropicProvider,
    PythonServiceProvider,
    {
      provide: AI_PROVIDER,
      inject: [AnthropicProvider, PythonServiceProvider],
      useFactory: (anthropic: AnthropicProvider, python: PythonServiceProvider) =>
        env.AI_PROVIDER === 'python-service' ? python : anthropic,
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
