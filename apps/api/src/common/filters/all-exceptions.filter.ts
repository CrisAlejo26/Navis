import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorBody } from '@navis/shared';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Traduce cualquier error a un único formato de respuesta (ApiErrorBody), que
 * es exactamente lo que packages/api-client espera al normalizar errores.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let error: string | undefined;
    let details: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        message = payload;
      } else {
        const body = payload as { message?: string | string[]; error?: string };
        error = body.error;
        if (Array.isArray(body.message)) {
          // Errores del ValidationPipe: una entrada por campo inválido.
          message = 'Datos no válidos';
          details = body.message;
        } else {
          message = body.message ?? exception.message;
        }
      }
    } else if (exception instanceof QueryFailedError) {
      // 23505 = unique_violation
      const code = (exception.driverError as { code?: string } | undefined)?.code;
      status = code === '23505' ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
      message = code === '23505' ? 'El recurso ya existe' : 'La consulta no pudo completarse';
      error = 'DatabaseError';
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorBody = {
      statusCode: status,
      message,
      error,
      details,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
