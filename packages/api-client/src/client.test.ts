import { describe, expect, it, vi } from 'vitest';

import { ApiError } from './api-error';
import { createApiClient } from './client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('createApiClient', () => {
  it('compone la URL y envía las cabeceras de auth e idioma', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const api = createApiClient({
      baseUrl: 'http://localhost:3000/api/v1/',
      fetchImpl,
      getAuthHeaders: () => ({ cookie: 'session=abc' }),
      getLocale: () => 'fr',
    });

    await api.get('/me/profile');

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/v1/me/profile');
    expect(new Headers(init.headers).get('cookie')).toBe('session=abc');
    expect(new Headers(init.headers).get('accept-language')).toBe('fr');
    expect(init.credentials).toBe('include');
  });

  it('convierte una respuesta de error en ApiError con su mensaje', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ statusCode: 401, message: 'Sesión no válida' }, 401));
    const onUnauthorized = vi.fn();
    const api = createApiClient({
      baseUrl: 'http://localhost:3000/api/v1',
      fetchImpl,
      onUnauthorized,
    });

    await expect(api.get('/me/profile')).rejects.toMatchObject({
      status: 401,
      message: 'Sesión no válida',
    });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('reintenta un 401 antes de avisar: la sesión recién iniciada no siempre está lista a la primera', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ statusCode: 401, message: 'Sesión no válida' }, 401))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const onUnauthorized = vi.fn();
    const api = createApiClient({
      baseUrl: 'http://localhost:3000/api/v1',
      fetchImpl,
      onUnauthorized,
    });

    await expect(api.get('/churches')).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('avisa si el 401 se repite en el reintento', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ statusCode: 401, message: 'Sesión no válida' }, 401));
    const onUnauthorized = vi.fn();
    const api = createApiClient({
      baseUrl: 'http://localhost:3000/api/v1',
      fetchImpl,
      onUnauthorized,
    });

    await expect(api.get('/churches')).rejects.toMatchObject({ status: 401 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('convierte un fallo de red en ApiError.network', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const api = createApiClient({
      baseUrl: 'http://localhost:3000/api/v1',
      fetchImpl,
    });

    const error = await api.get('/health').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNetwork).toBe(true);
    expect((error as ApiError).i18nKey).toBe('errors.network');
  });
});
