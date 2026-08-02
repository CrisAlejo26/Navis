import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Inicializa i18next una sola vez para todos los tests: sin esto `t()`
// devolvería la clave en crudo y las aserciones por texto no encontrarían nada.
import '@/lib/i18n';

// jsdom no implementa matchMedia y el store de tema lo usa al arrancar.
beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
});
