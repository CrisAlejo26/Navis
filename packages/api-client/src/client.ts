import type { ApiErrorBody } from '@pastortools/shared';

import { ApiError } from './api-error';

export interface ApiClientOptions {
  /** Ej.: http://localhost:3000/api/v1 */
  baseUrl: string;
  /**
   * Cabeceras de autenticación. En web no hace falta (la cookie de sesión
   * viaja sola con credentials: 'include'); en móvil devuelve la cookie que
   * guarda el plugin de Expo de Better Auth.
   */
  getAuthHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  /** Se invoca ante un 401 para redirigir al login o limpiar el estado. */
  onUnauthorized?: () => void;
  /** Idioma activo; se envía como Accept-Language. */
  getLocale?: () => string;
  fetchImpl?: typeof fetch;
}

type Body = Record<string, unknown> | undefined;

export interface ApiClient {
  get: <T>(path: string, init?: RequestInit) => Promise<T>;
  post: <T>(path: string, body?: Body, init?: RequestInit) => Promise<T>;
  patch: <T>(path: string, body?: Body, init?: RequestInit) => Promise<T>;
  put: <T>(path: string, body?: Body, init?: RequestInit) => Promise<T>;
  delete: <T>(path: string, init?: RequestInit) => Promise<T>;
  readonly baseUrl: string;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const doFetch = options.fetchImpl ?? globalThis.fetch.bind(globalThis);

  async function request<T>(method: string, path: string, body?: Body, init?: RequestInit) {
    const authHeaders = (await options.getAuthHeaders?.()) ?? {};
    const locale = options.getLocale?.();

    const headers = new Headers({
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(locale ? { 'accept-language': locale } : {}),
      ...authHeaders,
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    });

    let response: Response;
    try {
      response = await doFetch(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
        ...init,
        method,
        headers,
        // Imprescindible para que viaje la cookie de sesión de Better Auth.
        credentials: 'include',
        body: body ? JSON.stringify(body) : init?.body,
      });
    } catch (cause) {
      throw ApiError.network(cause);
    }

    if (response.status === 401) options.onUnauthorized?.();

    if (response.status === 204) return undefined as T;

    const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
    const payload: unknown = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorBody = (isJson ? payload : undefined) as ApiErrorBody | undefined;
      throw new ApiError(
        errorBody?.message ?? `La petición falló (${String(response.status)})`,
        response.status,
        errorBody,
      );
    }

    return payload as T;
  }

  return {
    baseUrl,
    get: <T>(path: string, init?: RequestInit) => request<T>('GET', path, undefined, init),
    post: <T>(path: string, body?: Body, init?: RequestInit) => request<T>('POST', path, body, init),
    patch: <T>(path: string, body?: Body, init?: RequestInit) =>
      request<T>('PATCH', path, body, init),
    put: <T>(path: string, body?: Body, init?: RequestInit) => request<T>('PUT', path, body, init),
    delete: <T>(path: string, init?: RequestInit) => request<T>('DELETE', path, undefined, init),
  };
}
