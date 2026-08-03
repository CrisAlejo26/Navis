import { beforeEach, describe, expect, it } from 'vitest';

import { SIDEBAR_STORAGE_KEY, useSidebarStore } from '@/lib/sidebar';

describe('useSidebarStore', () => {
  beforeEach(() => {
    useSidebarStore.setState({ collapsed: false });
    localStorage.removeItem(SIDEBAR_STORAGE_KEY);
  });

  it('empieza desplegada y alterna al pulsar', () => {
    expect(useSidebarStore.getState().collapsed).toBe(false);

    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().collapsed).toBe(true);

    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });

  it('recuerda que está plegada entre recargas', () => {
    useSidebarStore.getState().toggle();

    const guardado: unknown = JSON.parse(localStorage.getItem(SIDEBAR_STORAGE_KEY) ?? 'null');
    expect(guardado).toMatchObject({ state: { collapsed: true } });
  });
});
