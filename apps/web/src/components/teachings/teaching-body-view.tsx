import type { TeachingBody, TeachingParagraph, TeachingTextNode } from '@navis/shared';
import { Fragment } from 'react';

/**
 * El cuerpo de una enseñanza, en lectura (RFC 0022 §3, §4.5).
 *
 * No usa Tiptap para leer: es el mismo whitelist de nodos que ya valida el
 * servidor, así que un recorrido propio basta y no arrastra el editor entero
 * a una pantalla que solo enseña texto — la ficha, la fila del listado y la
 * postal que se exporta como imagen lo reutilizan los tres.
 */
export function TeachingBodyView({ body }: { body: TeachingBody }) {
  return (
    <div className="gap-3 max-w-prose flex flex-col">
      {body.content.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p key={index} className="text-[17px] leading-[1.75] whitespace-pre-wrap">
              <Inline nodes={block.content} />
            </p>
          );
        }

        if (block.type === 'bulletList' || block.type === 'orderedList') {
          const Tag = block.type === 'bulletList' ? 'ul' : 'ol';
          return (
            <Tag
              key={index}
              className={
                block.type === 'bulletList'
                  ? 'pl-5 gap-1.5 flex list-disc flex-col marker:text-muted-foreground'
                  : 'pl-5 gap-1.5 flex list-decimal flex-col marker:text-muted-foreground'
              }
            >
              {block.content.map((item, itemIndex) => (
                <li key={itemIndex} className="text-[17px] leading-[1.75]">
                  {item.content.map((paragraph, paragraphIndex) => (
                    <Fragment key={paragraphIndex}>
                      <Inline nodes={paragraph.content} />
                    </Fragment>
                  ))}
                </li>
              ))}
            </Tag>
          );
        }

        // taskList: la checklist, con el trazo que se dibuja al marcarla (§3).
        return (
          <ul key={index} className="gap-2 flex flex-col">
            {block.content.map((item, itemIndex) => (
              <li key={itemIndex} className="gap-2.5 flex items-start">
                <span
                  aria-hidden
                  className={
                    item.attrs.checked
                      ? 'mt-1 size-4 flex shrink-0 items-center justify-center rounded-[4px] border border-primary bg-primary'
                      : 'mt-1 size-4 shrink-0 rounded-[4px] border border-input'
                  }
                >
                  {item.attrs.checked && (
                    <svg viewBox="0 0 12 12" className="size-2.5 text-primary-foreground">
                      <path
                        d="M2 6.2 4.7 9 10 3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="relative text-[17px] leading-[1.75]">
                  {item.content.map((paragraph, paragraphIndex) => (
                    <Fragment key={paragraphIndex}>
                      <Inline nodes={paragraph.content} />
                    </Fragment>
                  ))}
                  {item.attrs.checked && (
                    <span
                      aria-hidden
                      className="animate-tacha left-0 absolute top-1/2 h-px w-full origin-left bg-muted-foreground/70"
                    />
                  )}
                </span>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

function Inline({ nodes }: { nodes: TeachingParagraph['content'] }) {
  return (
    <>
      {(nodes ?? []).map((node: TeachingTextNode, index) => {
        const bold = node.marks?.some((mark) => mark.type === 'bold');
        const italic = node.marks?.some((mark) => mark.type === 'italic');

        if (!bold && !italic) return <Fragment key={index}>{node.text}</Fragment>;
        return (
          <span key={index} className={bold ? 'font-semibold' : undefined}>
            {italic ? <em>{node.text}</em> : node.text}
          </span>
        );
      })}
    </>
  );
}
