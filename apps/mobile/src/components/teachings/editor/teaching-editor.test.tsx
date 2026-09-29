import { fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { TeachingEditor } from '@/components/teachings/editor/teaching-editor';
import { blocksToBody, bodyToBlocks, type EditorBlock } from '@/lib/teachings/editor-model';

const onBlocks = jest.fn<void, [EditorBlock[]]>();

/** Los bloques con los que se pintó por última vez el editor. */
function latest(): EditorBlock[] {
    return onBlocks.mock.lastCall?.[0] ?? [];
}

/** El editor con el estado que le pondría la pantalla. */
function Host({ initial }: { initial: EditorBlock[] }) {
    const [blocks, setBlocks] = useState(initial);
    useEffect(() => {
        onBlocks(blocks);
    }, [blocks]);
    return (
        <TeachingEditor
            blocks={blocks}
            onChange={setBlocks}
            header={<Text>cabecera</Text>}
            footer={<Text>pie</Text>}
        />
    );
}

const vacio = () => bodyToBlocks({ type: 'doc', content: [{ type: 'paragraph' }] });

describe('el editor de enseñanzas', () => {
    beforeEach(() => {
        onBlocks.mockClear();
    });

    it('la barra de formato está siempre encima del texto y el pie queda fijo debajo', async () => {
        await render(<Host initial={vacio()} />);

        expect(screen.getByRole('button', { name: 'Negrita' })).toBeTruthy();
        expect(screen.getByText('pie')).toBeTruthy();
    });

    it('al escribir en un bloque el documento guarda el texto', async () => {
        await render(<Host initial={vacio()} />);

        await fireEvent.changeText(screen.getByLabelText('Observaciones'), 'Hola');

        expect(blocksToBody(latest()).content).toEqual([
            { type: 'paragraph', content: [{ type: 'text', text: 'Hola' }] },
        ]);
    });

    it('la lista con viñetas cambia el tipo del bloque donde se escribe', async () => {
        await render(<Host initial={vacio()} />);

        await fireEvent(screen.getByLabelText('Observaciones'), 'focus');
        await fireEvent.press(screen.getByRole('button', { name: 'Lista con viñetas' }));

        expect(latest()[0]?.kind).toBe('bullet');
        expect(screen.getByText('pie')).toBeTruthy();
    });

    it('un salto de línea en el campo crea un bloque nuevo', async () => {
        await render(<Host initial={vacio()} />);

        await fireEvent.changeText(screen.getByLabelText('Observaciones'), 'uno\ndos');

        expect(latest()).toHaveLength(2);
    });

    it('una tarea se marca desde el propio editor', async () => {
        const tarea = bodyToBlocks({
            type: 'doc',
            content: [
                {
                    type: 'taskList',
                    content: [
                        {
                            type: 'taskItem',
                            attrs: { checked: false },
                            content: [{ type: 'paragraph' }],
                        },
                    ],
                },
            ],
        });
        await render(<Host initial={tarea} />);

        await fireEvent.press(screen.getByRole('checkbox', { name: 'Checklist' }));

        expect(latest()[0]?.checked).toBe(true);
    });
});
