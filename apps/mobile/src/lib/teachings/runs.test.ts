import {
    applyTextChange,
    joinRuns,
    normalizeRuns,
    plainText,
    rangeHasMark,
    splitRuns,
    styleAt,
    toggleMark,
    type Run,
} from '@/lib/teachings/runs';

const plain = (text: string): Run => ({ text, bold: false, italic: false });
const bold = (text: string): Run => ({ text, bold: true, italic: false });

describe('el texto con formato del editor de enseñanzas', () => {
    it('junta los tramos vecinos iguales y descarta los vacíos', () => {
        expect(normalizeRuns([plain('ho'), plain(''), plain('la'), bold('!')])).toEqual([
            plain('hola'),
            bold('!'),
        ]);
    });

    it('lo que se teclea toma el estilo activo y lo demás conserva el suyo', () => {
        const runs = [plain('Hola '), bold('mundo')];

        const escrito = applyTextChange(runs, 'Hola grande mundo', {
            bold: false,
            italic: true,
        });

        expect(plainText(escrito)).toBe('Hola grande mundo');
        expect(escrito).toEqual([
            plain('Hola '),
            { text: 'grande ', bold: false, italic: true },
            bold('mundo'),
        ]);
    });

    it('borrar en medio de un tramo con formato no toca el formato del resto', () => {
        const escrito = applyTextChange([bold('negrita')], 'negta', { bold: true, italic: false });

        expect(escrito).toEqual([bold('negta')]);
    });

    it('reemplazar una selección deja el texto nuevo con el estilo activo', () => {
        const escrito = applyTextChange([bold('abc')], 'aXc', { bold: false, italic: false });

        expect(escrito).toEqual([bold('a'), plain('X'), bold('c')]);
    });

    it('vaciar el campo deja la lista de tramos vacía', () => {
        expect(applyTextChange([plain('x')], '', { bold: false, italic: false })).toEqual([]);
    });

    it('pone la negrita en la selección y la quita si ya la tenía entera', () => {
        const puesta = toggleMark([plain('Hola mundo')], 5, 10, 'bold');
        expect(puesta).toEqual([plain('Hola '), bold('mundo')]);
        expect(rangeHasMark(puesta, 5, 10, 'bold')).toBe(true);

        expect(toggleMark(puesta, 5, 10, 'bold')).toEqual([plain('Hola mundo')]);
    });

    it('con la selección mixta, la negrita se pone en toda antes de quitarse', () => {
        const mixto = [bold('ab'), plain('cd')];

        expect(toggleMark(mixto, 0, 4, 'bold')).toEqual([bold('abcd')]);
    });

    it('una selección vacía no tiene ninguna marca', () => {
        expect(rangeHasMark([bold('ab')], 1, 1, 'bold')).toBe(false);
    });

    it('el cursor sigue el estilo del carácter anterior, o del primero al principio', () => {
        const runs = [plain('a'), bold('b')];

        expect(styleAt(runs, 2)).toEqual({ bold: true, italic: false });
        expect(styleAt(runs, 1)).toEqual({ bold: false, italic: false });
        expect(styleAt(runs, 0)).toEqual({ bold: false, italic: false });
        expect(styleAt([], 0)).toEqual({ bold: false, italic: false });
    });

    it('parte y vuelve a unir los tramos sin perder el formato', () => {
        const runs = [plain('ab'), bold('cd')];
        const [antes, despues] = splitRuns(runs, 3);

        expect(antes).toEqual([plain('ab'), bold('c')]);
        expect(despues).toEqual([bold('d')]);
        expect(joinRuns(antes, despues)).toEqual(runs);
    });
});
