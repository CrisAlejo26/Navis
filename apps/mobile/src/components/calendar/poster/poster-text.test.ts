import { truncatePosterText, wrapPosterText } from './poster-text';

// Regresión: la lámina en SVG no envuelve el texto sola —a diferencia del
// HTML de la web—, así que un nombre largo se salía de su columna en la
// tabla y en la rejilla del mes, y quedaba escrito encima de la de al lado.
describe('truncatePosterText', () => {
  it('deja el texto tal cual cuando cabe en el ancho', () => {
    expect(truncatePosterText('Martes', 260, { fontSize: 21, bold: true })).toBe('Martes');
  });

  it('recorta con puntos suspensivos cuando no cabe', () => {
    const largo = 'Martes Congregación Central de la Ciudad';
    const resultado = truncatePosterText(largo, 200, { fontSize: 21, bold: true });

    expect(resultado.endsWith('…')).toBe(true);
    expect(resultado.length).toBeLessThan(largo.length);
  });
});

describe('wrapPosterText', () => {
  it('devuelve una sola línea cuando el texto cabe', () => {
    expect(wrapPosterText('Oración Juan Pérez', 260, { fontSize: 21, maxLines: 2 })).toEqual([
      'Oración Juan Pérez',
    ]);
  });

  it('reparte en varias líneas cuando el texto no cabe en una', () => {
    const lineas = wrapPosterText(
      'Predicación Juan Carlos Pérez González · con la familia entera',
      236,
      { fontSize: 21, maxLines: 2 },
    );

    expect(lineas.length).toBe(2);
    for (const linea of lineas) {
      expect(linea.length).toBeGreaterThan(0);
    }
  });

  it('recorta la última línea con puntos suspensivos si sobra tras el máximo', () => {
    const lineas = wrapPosterText(
      'Predicación Juan Carlos Pérez González de la Torre y Martínez · con la familia entera y varios invitados más',
      236,
      { fontSize: 21, maxLines: 2 },
    );

    expect(lineas.length).toBe(2);
    expect(lineas[1]?.endsWith('…')).toBe(true);
  });
});
