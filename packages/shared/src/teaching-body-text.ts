import type { TeachingBody } from './schemas/teachings';

/**
 * Lo que hace falta sacar del árbol de una enseñanza (RFC 0022 §4.2): el
 * texto plano y las cuentas de checklist, en un solo recorrido.
 *
 * Vive en `shared` y no duplicado en `api` y `web` (Regla 1 §2): el servidor
 * lo usa para `search_text`, las estadísticas y el extracto del listado; la
 * web lo usa para la postal que se exporta como imagen (RFC 0022 §4.5).
 */
export interface TeachingBodyText {
  /** Todo el texto, en el orden en que aparece, separado por espacios. */
  text: string;
  checklist: { checked: number; total: number } | null;
}

export function extractTeachingBodyText(body: TeachingBody): TeachingBodyText {
  const words: string[] = [];
  let checked = 0;
  let total = 0;

  for (const block of body.content) {
    if (block.type === 'paragraph') {
      collectFromParagraph(block, words);
    } else if (block.type === 'taskList') {
      for (const item of block.content) {
        total += 1;
        if (item.attrs.checked) checked += 1;
        for (const paragraph of item.content) collectFromParagraph(paragraph, words);
      }
    } else {
      // bulletList / orderedList
      for (const item of block.content) {
        for (const paragraph of item.content) collectFromParagraph(paragraph, words);
      }
    }
  }

  return { text: words.join(' '), checklist: total > 0 ? { checked, total } : null };
}

function collectFromParagraph(paragraph: { content?: { text: string }[] }, into: string[]): void {
  for (const node of paragraph.content ?? []) into.push(node.text);
}
