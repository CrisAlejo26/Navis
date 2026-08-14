import { describe, expect, it } from 'vitest';

import { isEncryptedTableField } from './table-field-crypto';
import { prepareRowData } from './table-row-data';

const NOMBRE = {
  key: 'nombre',
  label: 'Nombre',
  type: 'text',
  required: true,
  options: null,
} as const;
const ASISTIO = {
  key: 'asistio',
  label: 'Asistió',
  type: 'checkbox',
  required: false,
  options: null,
} as const;
const CLAVE = {
  key: 'clave',
  label: 'Clave',
  type: 'password',
  required: false,
  options: null,
} as const;

describe('prepareRowData', () => {
  it('acepta un valor que encaja con el tipo', () => {
    const data = prepareRowData([NOMBRE], { nombre: 'Ana' }, {});
    expect(data.nombre).toBe('Ana');
  });

  it('rechaza un valor que no encaja con el tipo', () => {
    expect(() => prepareRowData([ASISTIO], { asistio: 'sí' }, {})).toThrow();
  });

  it('exige un valor en una columna obligatoria', () => {
    expect(() => prepareRowData([NOMBRE], {}, {})).toThrow();
  });

  it('ignora una clave que no es de ninguna columna activa', () => {
    const data = prepareRowData([NOMBRE], { nombre: 'Ana', otra: 'x' }, {});
    expect(data).toEqual({ nombre: 'Ana' });
  });

  it('conserva lo que ya había cuando la clave no viene en la actualización', () => {
    const data = prepareRowData([NOMBRE, ASISTIO], { asistio: true }, { nombre: 'Ana' });
    expect(data).toEqual({ nombre: 'Ana', asistio: true });
  });

  it('borra una clave cuando llega como null', () => {
    const data = prepareRowData([ASISTIO], { asistio: null }, { asistio: true });
    expect(data).toEqual({});
  });

  it('cifra una contraseña antes de guardarla, y no la vuelve a cifrar si no cambia', () => {
    const primero = prepareRowData([CLAVE], { clave: 'portal-2026' }, {});
    expect(isEncryptedTableField(primero.clave)).toBe(true);
    expect(primero.clave).not.toBe('portal-2026');

    const segundo = prepareRowData([CLAVE, NOMBRE], { nombre: 'Ana' }, primero);
    expect(segundo.clave).toBe(primero.clave);
  });
});
