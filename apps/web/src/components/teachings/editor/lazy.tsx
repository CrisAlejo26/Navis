import { lazy } from 'react';

/**
 * El editor, cargado aparte (RFC 0022 §4.3).
 *
 * Tiptap y sus extensiones solo los usa el formulario de una enseñanza:
 * cargarlos con el resto de la aplicación se lo cobraría a quien nunca abre
 * esta sección. Mismo patrón que `components/charts/lazy.tsx`.
 */
export const TeachingEditor = lazy(() =>
  import('./teaching-editor').then((module) => ({ default: module.TeachingEditor })),
);
