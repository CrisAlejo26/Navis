import type { TeachingBody } from '@navis/shared';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { TeachingBodyView } from '@/components/teachings/teaching-body-view';

const parrafo = (text: string) => ({
    type: 'paragraph' as const,
    content: [{ type: 'text' as const, text }],
});
const tarea = (text: string, checked: boolean) => ({
    type: 'taskItem' as const,
    attrs: { checked },
    content: [parrafo(text)],
});

const CUERPO: TeachingBody = {
    type: 'doc',
    content: [
        parrafo('Lo que aprendí'),
        {
            type: 'orderedList',
            content: [
                { type: 'listItem', content: [parrafo('primero')] },
                { type: 'listItem', content: [parrafo('segundo')] },
            ],
        },
        { type: 'taskList', content: [tarea('orar', true), tarea('ayunar', false)] },
        { type: 'taskList', content: [tarea('leer', false)] },
    ],
};

describe('el cuerpo de una enseñanza, leído', () => {
    it('dibuja el texto, la lista numerada y el estado de cada tarea', async () => {
        await render(<TeachingBodyView body={CUERPO} />);

        expect(screen.getByText('Lo que aprendí')).toBeTruthy();
        expect(screen.getByText('1.')).toBeTruthy();
        expect(screen.getByText('2.')).toBeTruthy();
        expect(screen.getByRole('checkbox', { name: 'orar', checked: true })).toBeTruthy();
        expect(screen.getByRole('checkbox', { name: 'ayunar', checked: false })).toBeTruthy();
    });

    it('al tocar una tarea avisa con su número en el documento, aunque haya varias listas', async () => {
        const onToggleTask = jest.fn();
        await render(<TeachingBodyView body={CUERPO} onToggleTask={onToggleTask} />);

        await fireEvent.press(screen.getByRole('checkbox', { name: 'leer' }));
        await fireEvent.press(screen.getByRole('checkbox', { name: 'ayunar' }));

        expect(onToggleTask).toHaveBeenNthCalledWith(1, 2);
        expect(onToggleTask).toHaveBeenNthCalledWith(2, 1);
    });

    it('sin manejador, las tareas no se pueden marcar', async () => {
        await render(<TeachingBodyView body={CUERPO} />);

        expect(screen.getByRole('checkbox', { name: 'orar', disabled: true })).toBeTruthy();
    });
});
