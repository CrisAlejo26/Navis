import { parseMessageBody, type MessageSegment } from './message-format';

function flatten(segments: MessageSegment[]): string {
  return segments
    .map((segment) => {
      if (segment.kind === 'text' || segment.kind === 'code') return segment.text;
      return flatten(segment.children);
    })
    .join('');
}

/** El texto sin sus marcadores de formato — para la vista previa de la fila (RFC 0019 §1). */
export function stripMessageFormat(body: string): string {
  return flatten(parseMessageBody(body));
}
