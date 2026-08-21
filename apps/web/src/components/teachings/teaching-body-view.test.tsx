import type { TeachingBody } from '@navis/shared';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TeachingBodyView } from '@/components/teachings/teaching-body-view';
import { renderWithI18n } from '@/test/render';

const parrafo = (texto: string) => ({
  type: 'paragraph' as const,
  content: [{ type: 'text' as const, text: texto }],
});

describe('el cuerpo de una enseñanza, en lectura', () => {
  it('pinta los párrafos, las listas y la checklist con su texto', () => {
    const body: TeachingBody = {
      type: 'doc',
      content: [
        parrafo('Lo que aprendí'),
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [parrafo('un punto')] }],
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

    renderWithI18n(<TeachingBodyView body={body} />);

    expect(screen.getByText('Lo que aprendí')).toBeInTheDocument();
    expect(screen.getByText('un punto')).toBeInTheDocument();
    expect(screen.getByText('hecho')).toBeInTheDocument();
    expect(screen.getByText('pendiente')).toBeInTheDocument();
  });

  it('la negrita y la cursiva se pintan con su propio elemento', () => {
    const body: TeachingBody = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'importante', marks: [{ type: 'bold' }] }],
        },
      ],
    };

    renderWithI18n(<TeachingBodyView body={body} />);

    const texto = screen.getByText('importante');
    expect(texto.tagName).toBe('SPAN');
    expect(texto.className).toContain('font-semibold');
  });
});
