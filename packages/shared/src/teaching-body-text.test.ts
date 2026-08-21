import { describe, expect, it } from 'vitest';

import { extractTeachingBodyText } from './teaching-body-text';
import type { TeachingBody } from './schemas/teachings';

const parrafo = (texto: string) => ({
  type: 'paragraph' as const,
  content: [{ type: 'text' as const, text: texto }],
});

describe('extraer el texto plano de una enseñanza', () => {
  it('junta el texto de párrafos y listas, en orden', () => {
    const body: TeachingBody = {
      type: 'doc',
      content: [
        parrafo('Lo primero'),
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [parrafo('un punto')] },
            { type: 'listItem', content: [parrafo('otro punto')] },
          ],
        },
      ],
    };

    expect(extractTeachingBodyText(body).text).toBe('Lo primero un punto otro punto');
  });

  it('sin ninguna checklist, `checklist` es nulo y no un cero', () => {
    const body: TeachingBody = { type: 'doc', content: [parrafo('Sin checks')] };

    expect(extractTeachingBodyText(body).checklist).toBeNull();
  });

  it('cuenta los ítems marcados de una checklist', () => {
    const body: TeachingBody = {
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: true }, content: [parrafo('hecho')] },
            { type: 'taskItem', attrs: { checked: false }, content: [parrafo('pendiente')] },
            { type: 'taskItem', attrs: { checked: true }, content: [parrafo('hecho también')] },
          ],
        },
      ],
    };

    expect(extractTeachingBodyText(body).checklist).toEqual({ checked: 2, total: 3 });
  });
});
