import { Fragment, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { parseMessageBody, type ColorToken, type MessageSegment } from '@/lib/chat/message-format';

/**
 * Los cinco tokens del color de texto, como una píldora — el mismo criterio
 * que ya usa el avatar (`ChatAvatar`, RFC 0016 §5) para sus cinco variantes:
 * el texto se lee sobre su propio fondo tintado y no directamente sobre la
 * burbuja, así que el contraste no depende de si la burbuja es azul o gris
 * (Regla 3).
 */
const COLOR_CLASS: Record<ColorToken, string> = {
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
  accent: 'bg-accent text-accent-foreground',
};

function renderSegments(segments: MessageSegment[], own: boolean): ReactNode[] {
  return segments.map((segment, index) => {
    switch (segment.kind) {
      case 'text':
        return <Fragment key={index}>{segment.text}</Fragment>;
      case 'bold':
        return <strong key={index}>{renderSegments(segment.children, own)}</strong>;
      case 'italic':
        return <em key={index}>{renderSegments(segment.children, own)}</em>;
      case 'strike':
        return (
          <span key={index} className="line-through">
            {renderSegments(segment.children, own)}
          </span>
        );
      case 'code':
        return (
          <code
            key={index}
            className={cn(
              'px-1 py-0.5 rounded font-mono text-[0.9em]',
              own ? 'bg-primary-foreground/15' : 'bg-foreground/10',
            )}
          >
            {segment.text}
          </code>
        );
      case 'color':
        return (
          <span key={index} className={cn('rounded px-1', COLOR_CLASS[segment.token])}>
            {renderSegments(segment.children, own)}
          </span>
        );
    }
  });
}

/** El `body` de un mensaje, con su formato ya resuelto (RFC 0019 §1). */
export function FormattedText({ body, own }: { body: string; own: boolean }) {
  return <>{renderSegments(parseMessageBody(body), own)}</>;
}
