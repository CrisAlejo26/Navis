import type { TeachingBody } from '@navis/shared';

import { toggleTaskItem } from '@/lib/teachings/body-ops';

const tarea = (checked: boolean) => ({
    type: 'taskItem' as const,
    attrs: { checked },
    content: [{ type: 'paragraph' as const }],
});

const CUERPO: TeachingBody = {
    type: 'doc',
    content: [
        { type: 'taskList', content: [tarea(false), tarea(true)] },
        { type: 'paragraph' },
        { type: 'taskList', content: [tarea(false)] },
    ],
};

function marcadas(body: TeachingBody): boolean[] {
    return body.content.flatMap((block) =>
        block.type === 'taskList' ? block.content.map((item) => item.attrs.checked) : [],
    );
}

describe('marcar una tarea desde la ficha', () => {
    it('cambia solo la tarea pedida, aunque haya varias listas', () => {
        expect(marcadas(toggleTaskItem(CUERPO, 2))).toEqual([false, true, true]);
        expect(marcadas(toggleTaskItem(CUERPO, 1))).toEqual([false, false, false]);
    });

    it('no toca el documento original', () => {
        toggleTaskItem(CUERPO, 0);

        expect(marcadas(CUERPO)).toEqual([false, true, false]);
    });

    it('un índice que no existe deja el documento igual', () => {
        expect(toggleTaskItem(CUERPO, 9)).toEqual(CUERPO);
    });
});
