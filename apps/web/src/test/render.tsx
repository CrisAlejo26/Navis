import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { i18n } from '@/lib/i18n';

/**
 * `render` con la instancia de i18next de la aplicación, que es lo que hace
 * `main.tsx`. Sin el proveedor, `useTranslation()` cae en la instancia por
 * defecto de react-i18next y los componentes pintan las claves en crudo: los
 * tests pasarían buscando textos que nadie ve.
 */
export function renderWithI18n(ui: ReactElement, options?: RenderOptions): RenderResult {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    ),
    ...options,
  });
}
