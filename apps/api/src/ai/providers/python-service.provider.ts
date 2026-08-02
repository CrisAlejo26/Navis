import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { env } from '../../config/env';
import type { AiCompletionOptions, AiCompletionResult, AiProvider } from '../ai.types';

/**
 * Delega en el microservicio de apps/ai (FastAPI), pensado para lo que no
 * encaja en Node: embeddings locales, transcripción, modelos propios…
 * Se activa con AI_PROVIDER=python-service y el perfil `ai` de docker compose.
 */
@Injectable()
export class PythonServiceProvider implements AiProvider {
  readonly name = 'python-service';

  async complete(prompt: string, options?: AiCompletionOptions): Promise<AiCompletionResult> {
    if (!env.AI_SERVICE_URL) {
      throw new ServiceUnavailableException('Falta AI_SERVICE_URL para el proveedor python-service');
    }

    const response = await fetch(`${env.AI_SERVICE_URL}/v1/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, ...options }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `El servicio de IA respondió ${String(response.status)}`,
      );
    }

    const data = (await response.json()) as { text: string; model: string };
    return { text: data.text, model: data.model, provider: this.name };
  }
}
