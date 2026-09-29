import { teachingBodySchema, type TeachingBody } from '@navis/shared';

import { blocksToBody, bodyToBlocks, newBlock } from '@/lib/teachings/editor-model';

const texto = (text: string, marks: ('bold' | 'italic')[] = []) => ({
    type: 'text' as const,
    text,
    ...(marks.length > 0 ? { marks: marks.map((type) => ({ type })) } : {}),
});
const parrafo = (...content: ReturnType<typeof texto>[]) => ({
    type: 'paragraph' as const,
    ...(content.length > 0 ? { content } : {}),
});

const DOCUMENTO: TeachingBody = {
    type: 'doc',
    content: [
        parrafo(texto('Lo que '), texto('aprendí', ['bold', 'italic'])),
        {
            type: 'bulletList',
            content: [
                { type: 'listItem', content: [parrafo(texto('uno'))] },
                { type: 'listItem', content: [parrafo(texto('dos'))] },
            ],
        },
        {
            type: 'orderedList',
            content: [{ type: 'listItem', content: [parrafo(texto('primero'))] }],
        },
        {
            type: 'taskList',
            content: [
                { type: 'taskItem', attrs: { checked: true }, content: [parrafo(texto('hecho'))] },
                { type: 'taskItem', attrs: { checked: false }, content: [parrafo()] },
            ],
        },
    ],
};

describe('el documento de una enseñanza como bloques de editor', () => {
    it('ir a bloques y volver devuelve el mismo documento', () => {
        expect(blocksToBody(bodyToBlocks(DOCUMENTO))).toEqual(DOCUMENTO);
    });

    it('cada elemento de lista es un bloque, con su casilla', () => {
        const blocks = bodyToBlocks(DOCUMENTO);

        expect(blocks.map((block) => block.kind)).toEqual([
            'paragraph',
            'bullet',
            'bullet',
            'ordered',
            'task',
            'task',
        ]);
        expect(blocks.map((block) => block.checked)).toEqual([
            false,
            false,
            false,
            false,
            true,
            false,
        ]);
    });

    it('lo que sale del editor siempre cumple el whitelist del servidor', () => {
        const blocks = [
            newBlock('task', [{ text: 'a', bold: true, italic: false }]),
            newBlock('bullet'),
            newBlock('paragraph', [{ text: 'z', bold: false, italic: true }]),
            newBlock('ordered'),
            newBlock('ordered', [{ text: 'y', bold: false, italic: false }]),
        ];

        expect(() => teachingBodySchema.parse(blocksToBody(blocks))).not.toThrow();
    });

    it('dos listas de distinto tipo seguidas no se funden en una', () => {
        const body = blocksToBody([newBlock('bullet'), newBlock('ordered'), newBlock('ordered')]);

        expect(body.content.map((block) => block.type)).toEqual(['bulletList', 'orderedList']);
    });

    it('un documento sin bloques se abre con un párrafo vacío, y sin bloques se guarda vacío', () => {
        expect(bodyToBlocks({ type: 'doc', content: [] })).toHaveLength(1);
        expect(blocksToBody([])).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
    });
});
