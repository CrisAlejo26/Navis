import type { Teaching, TeachingBlock, TeachingParagraph, TeachingTextNode } from '@navis/shared';

/**
 * El cuerpo de una enseñanza, a Markdown (RFC 0022 §4.5).
 *
 * De mano y sin librería, como el resto de conversores de `lib/export/`: el
 * whitelist de nodos (§4.2) es pequeño y cerrado, así que recorrerlo es más
 * corto que traer un serializador genérico de Markdown para cinco tipos de
 * bloque.
 */
/**
 * Envuelve el texto en el marcador de Markdown, pero **fuera** de los
 * espacios que lo rodean: `** Muy importante.**` no es negrita válida en
 * CommonMark —el marcador no puede tocar un espacio por dentro—, así que el
 * espacio se mueve fuera de las dos marcas antes de envolver.
 */
function wrapMark(text: string, marker: string): string {
  const leading = /^\s*/.exec(text)?.[0] ?? '';
  const trailing = /\s*$/.exec(text)?.[0] ?? '';
  const core = text.slice(leading.length, text.length - trailing.length);
  if (!core) return text;
  return `${leading}${marker}${core}${marker}${trailing}`;
}

function inline(nodes: TeachingParagraph['content']): string {
  return (nodes ?? [])
    .map((node: TeachingTextNode) => {
      const bold = node.marks?.some((mark) => mark.type === 'bold');
      const italic = node.marks?.some((mark) => mark.type === 'italic');
      let text = node.text;
      if (italic) text = wrapMark(text, '*');
      if (bold) text = wrapMark(text, '**');
      return text;
    })
    .join('');
}

function block(node: TeachingBlock): string {
  if (node.type === 'paragraph') return inline(node.content);

  if (node.type === 'bulletList') {
    return node.content
      .map((item) => `- ${item.content.map((paragraph) => inline(paragraph.content)).join(' ')}`)
      .join('\n');
  }

  if (node.type === 'orderedList') {
    return node.content
      .map(
        (item, index) =>
          `${String(index + 1)}. ${item.content.map((paragraph) => inline(paragraph.content)).join(' ')}`,
      )
      .join('\n');
  }

  // taskList
  return node.content
    .map(
      (item) =>
        `- [${item.attrs.checked ? 'x' : ' '}] ${item.content.map((paragraph) => inline(paragraph.content)).join(' ')}`,
    )
    .join('\n');
}

export function toTeachingMarkdown(
  teaching: Pick<Teaching, 'title' | 'body' | 'receivedAt'>,
  labels: { frontmatterTitle: string; frontmatterDate: string },
): string {
  const cabecera = [
    '---',
    `${labels.frontmatterTitle}: ${teaching.title}`,
    `${labels.frontmatterDate}: ${teaching.receivedAt}`,
    '---',
    '',
    `# ${teaching.title}`,
  ].join('\n');

  // Una línea en blanco entre bloques: sin ella, un párrafo pegado a una
  // lista —o una lista numerada pegada a una checklist— se puede leer como
  // un único bloque en un lector de Markdown estricto.
  const cuerpo = teaching.body.content.map(block).join('\n\n');

  return `${cabecera}\n\n${cuerpo}\n`;
}

export function toTeachingMarkdownBlob(
  teaching: Pick<Teaching, 'title' | 'body' | 'receivedAt'>,
  labels: { frontmatterTitle: string; frontmatterDate: string },
): Blob {
  return new Blob([toTeachingMarkdown(teaching, labels)], { type: 'text/markdown;charset=utf-8' });
}
