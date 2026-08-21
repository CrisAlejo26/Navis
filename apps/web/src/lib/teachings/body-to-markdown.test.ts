import type { TeachingBody } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { toTeachingMarkdown } from '@/lib/teachings/body-to-markdown';

const parrafo = (texto: string, opts: { bold?: boolean; italic?: boolean } = {}) => ({
  type: 'paragraph' as const,
  content: [
    {
      type: 'text' as const,
      text: texto,
      marks: [
        ...(opts.bold ? [{ type: 'bold' as const }] : []),
        ...(opts.italic ? [{ type: 'italic' as const }] : []),
      ],
    },
  ],
});

describe('el cuerpo de una enseñanza, a Markdown', () => {
  it('traduce negrita, cursiva, listas y checklist a su sintaxis de Markdown', () => {
    const body: TeachingBody = {
      type: 'doc',
      content: [
        parrafo('Lo que aprendí', { bold: true }),
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [parrafo('un punto')] }],
        },
        {
          type: 'orderedList',
          content: [{ type: 'listItem', content: [parrafo('primero')] }],
        },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: true }, content: [parrafo('hecho')] },
            { type: 'taskItem', attrs: { checked: false }, content: [parrafo('pendiente')] },
          ],
        },
      ],
    };

    const markdown = toTeachingMarkdown(
      { title: 'Sobre la paciencia', body, receivedAt: '2026-03-14' },
      { frontmatterTitle: 'Título', frontmatterDate: 'Fecha' },
    );

    expect(markdown).toContain('**Lo que aprendí**');
    expect(markdown).toContain('- un punto');
    expect(markdown).toContain('1. primero');
    expect(markdown).toContain('- [x] hecho');
    expect(markdown).toContain('- [ ] pendiente');
    expect(markdown).toContain('Título: Sobre la paciencia');
    expect(markdown).toContain('Fecha: 2026-03-14');

    // Cada bloque va separado por una línea en blanco: pegados, un lector de
    // Markdown estricto puede leer la lista numerada y la checklist como un
    // único bloque.
    expect(markdown).toContain('1. primero\n\n- [x] hecho');
  });

  it('mueve el espacio fuera de la negrita: `** texto**` no es negrita válida en Markdown', () => {
    const body: TeachingBody = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Lo que aprendí.' },
            { type: 'text', text: ' Muy importante.', marks: [{ type: 'bold' }] },
          ],
        },
      ],
    };

    const markdown = toTeachingMarkdown(
      { title: 'T', body, receivedAt: '2026-03-14' },
      { frontmatterTitle: 'Título', frontmatterDate: 'Fecha' },
    );

    expect(markdown).toContain('Lo que aprendí. **Muy importante.**');
  });
});
