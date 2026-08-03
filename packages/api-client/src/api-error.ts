import type { ApiErrorBody } from '@navis/shared';

/**
 * Error normalizado. Todo fallo de red o de la API llega a la UI como una
 * instancia de esta clase, así los componentes no tienen que distinguir entre
 * un 500, un timeout o un JSON malformado.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: string[];
  readonly body?: ApiErrorBody;

  constructor(message: string, status: number, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = body?.details;
    this.body = body;
  }

  /** No hubo respuesta del servidor (sin conexión, DNS, CORS…). */
  static network(cause?: unknown): ApiError {
    const error = new ApiError('No hay conexión con el servidor', 0);
    error.cause = cause;
    return error;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }

  /** Clave de traducción sugerida para mostrar el error al usuario. */
  get i18nKey(): string {
    if (this.isNetwork) return 'errors.network';
    if (this.isUnauthorized) return 'errors.unauthorized';
    if (this.isNotFound) return 'errors.notFound';
    if (this.status === 400 || this.status === 422) return 'errors.validation';
    return 'errors.generic';
  }
}
