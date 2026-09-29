import type {
    TeachingBlock,
    TeachingBody,
    TeachingListItemNode,
    TeachingParagraph,
    TeachingTaskItem,
    TeachingTextNode,
} from '@navis/shared';

import { normalizeRuns, type Run } from '@/lib/teachings/runs';

/**
 * El documento de una enseñanza como una **lista plana de bloques** (plan
 * `ensenanzas-movil-plan.md` §4.4): cada párrafo, cada viñeta y cada tarea es
 * un bloque con su propio texto. Es lo que un `TextInput` por fila sabe editar;
 * las listas del whitelist (§4.2 de la RFC 0022) se reconstruyen al guardar
 * uniendo los bloques contiguos del mismo tipo.
 */
export type BlockKind = 'paragraph' | 'bullet' | 'ordered' | 'task';

export interface EditorBlock {
    id: string;
    kind: BlockKind;
    /** Solo importa en `task`. */
    checked: boolean;
    runs: Run[];
}

let counter = 0;

/** Un identificador de bloque; solo tiene que ser único mientras dura el editor. */
export function newBlockId(): string {
    counter += 1;
    return `block-${String(counter)}`;
}

export function newBlock(kind: BlockKind = 'paragraph', runs: Run[] = []): EditorBlock {
    return { id: newBlockId(), kind, checked: false, runs };
}

export function paragraphsToRuns(paragraphs: readonly TeachingParagraph[]): Run[] {
    return normalizeRuns(
        paragraphs.flatMap((paragraph) =>
            (paragraph.content ?? []).map((node) => ({
                text: node.text,
                bold: node.marks?.some((mark) => mark.type === 'bold') ?? false,
                italic: node.marks?.some((mark) => mark.type === 'italic') ?? false,
            })),
        ),
    );
}

export function bodyToBlocks(body: TeachingBody): EditorBlock[] {
    const blocks = body.content.flatMap((block): EditorBlock[] => {
        if (block.type === 'paragraph') return [newBlock('paragraph', paragraphsToRuns([block]))];
        if (block.type === 'taskList') {
            return block.content.map((item) => ({
                ...newBlock('task', paragraphsToRuns(item.content)),
                checked: item.attrs.checked,
            }));
        }
        const kind = block.type === 'bulletList' ? 'bullet' : 'ordered';
        return block.content.map((item) => newBlock(kind, paragraphsToRuns(item.content)));
    });
    return blocks.length > 0 ? blocks : [newBlock()];
}

function paragraphOf(runs: readonly Run[]): TeachingParagraph {
    const content = normalizeRuns(runs).map((run): TeachingTextNode => {
        const marks = [
            ...(run.bold ? [{ type: 'bold' as const }] : []),
            ...(run.italic ? [{ type: 'italic' as const }] : []),
        ];
        return marks.length > 0
            ? { type: 'text', text: run.text, marks }
            : { type: 'text', text: run.text };
    });
    return content.length > 0 ? { type: 'paragraph', content } : { type: 'paragraph' };
}

function listBlock(kind: Exclude<BlockKind, 'paragraph'>, group: EditorBlock[]): TeachingBlock {
    if (kind === 'task') {
        const content = group.map((block): TeachingTaskItem => ({
            type: 'taskItem',
            attrs: { checked: block.checked },
            content: [paragraphOf(block.runs)],
        }));
        return { type: 'taskList', content };
    }
    const content = group.map((block): TeachingListItemNode => ({
        type: 'listItem',
        content: [paragraphOf(block.runs)],
    }));
    return kind === 'bullet' ? { type: 'bulletList', content } : { type: 'orderedList', content };
}

export function blocksToBody(blocks: readonly EditorBlock[]): TeachingBody {
    const content: TeachingBlock[] = [];
    let group: EditorBlock[] = [];

    const flush = () => {
        const first = group[0];
        if (first && first.kind !== 'paragraph') content.push(listBlock(first.kind, group));
        group = [];
    };

    for (const block of blocks) {
        if (block.kind === 'paragraph') {
            flush();
            content.push(paragraphOf(block.runs));
        } else if (group[0] && group[0].kind !== block.kind) {
            flush();
            group.push(block);
        } else {
            group.push(block);
        }
    }
    flush();

    return { type: 'doc', content: content.length > 0 ? content : [{ type: 'paragraph' }] };
}
