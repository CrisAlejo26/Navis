import type { TeachingBody } from '@navis/shared';

/**
 * Marca o desmarca la tarea número `index` del documento, contando todas las
 * `taskItem` en el orden en que aparecen. Es lo que hace la ficha de lectura:
 * una tarea se marca sin entrar en el editor, y el documento vuelve entero.
 */
export function toggleTaskItem(body: TeachingBody, index: number): TeachingBody {
    let seen = 0;
    return {
        ...body,
        content: body.content.map((block) => {
            if (block.type !== 'taskList') return block;
            return {
                ...block,
                content: block.content.map((item) => {
                    const mine = seen;
                    seen += 1;
                    return mine === index
                        ? { ...item, attrs: { checked: !item.attrs.checked } }
                        : item;
                }),
            };
        }),
    };
}
