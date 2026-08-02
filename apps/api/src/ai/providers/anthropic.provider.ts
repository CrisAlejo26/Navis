import Anthropic from '@anthropic-ai/sdk';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { env } from '../../config/env';
import type { AiCompletionOptions, AiCompletionResult, AiProvider } from '../ai.types';

@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!env.ANTHROPIC_API_KEY) {
      throw new ServiceUnavailableException(
        'Falta ANTHROPIC_API_KEY: configúrala en .env para usar la IA',
      );
    }
    this.client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    return this.client;
  }

  async complete(prompt: string, options?: AiCompletionOptions): Promise<AiCompletionResult> {
    const response = await this.getClient().messages.create({
      model: env.AI_MODEL,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature,
      system: options?.system,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return { text, model: response.model, provider: this.name };
  }
}
