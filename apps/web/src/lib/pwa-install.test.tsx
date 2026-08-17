import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePwaInstallPrompt } from './pwa-install';

function beforeInstallPromptEvent(): Event & { prompt: () => Promise<void> } {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  return Object.assign(event, { prompt: vi.fn().mockResolvedValue(undefined) });
}

describe('usePwaInstallPrompt', () => {
  it('no hay nada disponible hasta que el navegador dispara beforeinstallprompt', () => {
    const { result } = renderHook(() => usePwaInstallPrompt());

    expect(result.current.available).toBe(false);
  });

  it('captura el evento y lo deja listo para lanzarlo a mano', async () => {
    const { result } = renderHook(() => usePwaInstallPrompt());
    const event = beforeInstallPromptEvent();

    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.available).toBe(true);

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(event.prompt).toHaveBeenCalledOnce();
    // Un mismo evento no se puede volver a lanzar: se olvida tras usarlo.
    expect(result.current.available).toBe(false);
  });

  it('appinstalled marca la aplicación como ya instalada', () => {
    const { result } = renderHook(() => usePwaInstallPrompt());

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.installed).toBe(true);
    expect(result.current.available).toBe(false);
  });
});
