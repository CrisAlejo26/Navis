import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';

import { env } from '../config/env';
import { AI_PROVIDER, type AiCompletionOptions, type AiCompletionResult, type AiProvider } from './ai.types';

@Injectable()
export class AiService {
  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  get enabled(): boolean {
    return env.AI_ENABLED;
  }

  status(): { enabled: boolean; provider: string; model: string } {
    return { enabled: this.enabled, provider: this.provider.name, model: env.AI_MODEL };
  }

  complete(prompt: string, options?: AiCompletionOptions): Promise<AiCompletionResult> {
    if (!this.enabled) {
      throw new ServiceUnavailableException('La IA está desactivada (AI_ENABLED=false)');
    }
    return this.provider.complete(prompt, options);
  }
}
