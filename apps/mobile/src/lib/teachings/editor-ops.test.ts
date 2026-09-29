import { newBlock } from '@/lib/teachings/editor-model';
import {
    backspaceAtStart,
    changeText,
    setKind,
    splitBlock,
    toggleChecked,
} from '@/lib/teachings/editor-ops';
import { plainText, type Run } from '@/lib/teachings/runs';

const NORMAL = { bold: false, italic: false };
const plain = (text: string): Run => ({ text, ...NORMAL });

describe('las teclas y los botones del editor de enseñanzas', () => {
    it('pulsar una lista cambia el bloque, y pulsarla otra vez lo devuelve a párrafo', () => {
        const bloque = newBlock('paragraph', [plain('a')]);

        const lista = setKind([bloque], bloque.id, 'bullet');
        expect(lista[0]?.kind).toBe('bullet');
        expect(setKind(lista, bloque.id, 'bullet')[0]?.kind).toBe('paragraph');
        expect(setKind(lista, bloque.id, 'task')[0]?.kind).toBe('task');
    });

    it('Enter parte el texto y el segundo trozo hereda el tipo, con la casilla sin marcar', () => {
        const tarea = { ...newBlock('task', [plain('hola mundo')]), checked: true };

        const resultado = splitBlock([tarea], tarea.id, 4);

        expect(resultado?.blocks.map((block) => plainText(block.runs))).toEqual(['hola', ' mundo']);
        expect(resultado?.blocks.map((block) => block.kind)).toEqual(['task', 'task']);
        expect(resultado?.blocks[0]?.checked).toBe(true);
        expect(resultado?.blocks[1]?.checked).toBe(false);
        expect(resultado?.focus).toEqual({ id: resultado?.blocks[1]?.id, caret: 0 });
    });

    it('Enter en un elemento de lista vacío sale de la lista', () => {
        const vacio = newBlock('bullet');

        const resultado = splitBlock([vacio], vacio.id, 0);

        expect(resultado?.blocks).toHaveLength(1);
        expect(resultado?.blocks[0]?.kind).toBe('paragraph');
    });

    it('Retroceso al principio de una lista la baja a párrafo', () => {
        const item = newBlock('ordered', [plain('x')]);

        expect(backspaceAtStart([item], item.id)?.blocks[0]?.kind).toBe('paragraph');
    });

    it('Retroceso al principio de un párrafo lo funde con el de arriba y deja el cursor en la costura', () => {
        const arriba = newBlock('paragraph', [plain('uno')]);
        const abajo = newBlock('paragraph', [{ text: 'dos', bold: true, italic: false }]);

        const resultado = backspaceAtStart([arriba, abajo], abajo.id);

        expect(resultado?.blocks).toHaveLength(1);
        expect(plainText(resultado?.blocks[0]?.runs ?? [])).toBe('unodos');
        expect(resultado?.focus).toEqual({ id: arriba.id, caret: 3 });
    });

    it('Retroceso en el primer párrafo no hace nada', () => {
        const unico = newBlock('paragraph', [plain('x')]);

        expect(backspaceAtStart([unico], unico.id)).toBeNull();
    });

    it('marcar una tarea solo cambia esa tarea', () => {
        const a = newBlock('task');
        const b = newBlock('task');

        const blocks = toggleChecked([a, b], b.id);

        expect(blocks.map((block) => block.checked)).toEqual([false, true]);
    });
});

describe('el texto que llega del campo de un bloque', () => {
    it('un salto de línea es un Enter: parte el bloque y el cursor va al segundo', () => {
        const bloque = newBlock('paragraph', [plain('holamundo')]);

        const resultado = changeText([bloque], bloque.id, 'hola\nmundo', NORMAL);

        expect(resultado?.blocks.map((block) => plainText(block.runs))).toEqual(['hola', 'mundo']);
        expect(resultado?.focus).toEqual({ id: resultado?.blocks[1]?.id, caret: 0 });
    });

    it('un texto pegado con varias líneas crea un bloque por línea', () => {
        const bloque = newBlock('bullet');

        const resultado = changeText([bloque], bloque.id, 'a\nb\nc', NORMAL);

        expect(resultado?.blocks.map((block) => plainText(block.runs))).toEqual(['a', 'b', 'c']);
        expect(resultado?.blocks.map((block) => block.kind)).toEqual([
            'bullet',
            'bullet',
            'bullet',
        ]);
    });

    it('sin saltos solo actualiza el texto con el estilo activo', () => {
        const bloque = newBlock('paragraph', [plain('ho')]);

        const resultado = changeText([bloque], bloque.id, 'hoy', { bold: true, italic: false });

        expect(resultado?.blocks[0]?.runs).toEqual([
            plain('ho'),
            { text: 'y', bold: true, italic: false },
        ]);
    });
});
