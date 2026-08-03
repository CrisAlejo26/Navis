export interface AiCompletionOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiCompletionResult {
  text: string;
  model: string;
  provider: string;
}

/**
 * Punto de extensión para toda la IA de Navis. Hoy hay dos
 * implementaciones (Anthropic directo y el microservicio Python de apps/ai);
 * añadir una tercera no debería tocar nada fuera de este módulo.
 */
export interface AiProvider {
  readonly name: string;
  complete(prompt: string, options?: AiCompletionOptions): Promise<AiCompletionResult>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
