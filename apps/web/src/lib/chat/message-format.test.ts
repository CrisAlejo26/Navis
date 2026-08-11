import { describe, expect, it } from 'vitest';

import { parseMessageBody, wrapSelection } from './message-format';

describe('parseMessageBody', () => {
  it('un mensaje sin marcadores es un único segmento de texto', () => {
    expect(parseMessageBody('hola a todos')).toEqual([{ kind: 'text', text: 'hola a todos' }]);
  });

  it('reconoce negrita, cursiva, tachado y código por separado', () => {
    expect(parseMessageBody('*negrita*')).toEqual([
      { kind: 'bold', children: [{ kind: 'text', text: 'negrita' }] },
    ]);
    expect(parseMessageBody('_cursiva_')).toEqual([
      { kind: 'italic', children: [{ kind: 'text', text: 'cursiva' }] },
    ]);
    expect(parseMessageBody('~tachado~')).toEqual([
      { kind: 'strike', children: [{ kind: 'text', text: 'tachado' }] },
    ]);
    expect(parseMessageBody('`codigo`')).toEqual([{ kind: 'code', text: 'codigo' }]);
  });

  it('reconoce el color con el token', () => {
    expect(parseMessageBody('{c:success}bien{/c}')).toEqual([
      { kind: 'color', token: 'success', children: [{ kind: 'text', text: 'bien' }] },
    ]);
  });

  it('un marcador anidado dentro de otro se resuelve por dentro', () => {
    expect(parseMessageBody('{c:warning}ojo *con esto*{/c}')).toEqual([
      {
        kind: 'color',
        token: 'warning',
        children: [
          { kind: 'text', text: 'ojo ' },
          { kind: 'bold', children: [{ kind: 'text', text: 'con esto' }] },
        ],
      },
    ]);
  });

  it('texto antes y después de un marcador queda como segmentos de texto', () => {
    expect(parseMessageBody('hola *mundo* feliz')).toEqual([
      { kind: 'text', text: 'hola ' },
      { kind: 'bold', children: [{ kind: 'text', text: 'mundo' }] },
      { kind: 'text', text: ' feliz' },
    ]);
  });

  it('un marcador sin cerrar se queda como texto plano, no revienta', () => {
    expect(parseMessageBody('esto *no cierra')).toEqual([
      { kind: 'text', text: 'esto *no cierra' },
    ]);
  });

  it('un mensaje vacío no produce segmentos', () => {
    expect(parseMessageBody('')).toEqual([]);
  });
});

describe('wrapSelection', () => {
  it('envuelve el texto seleccionado y deja la selección en el mismo sitio', () => {
    const result = wrapSelection('hola mundo', 5, 10, '*');
    expect(result.value).toBe('hola *mundo*');
    expect(result.selectionStart).toBe(6);
    expect(result.selectionEnd).toBe(11);
  });

  it('sin selección, inserta el marcador en el cursor', () => {
    const result = wrapSelection('hola ', 5, 5, '*');
    expect(result.value).toBe('hola **');
    expect(result.selectionStart).toBe(6);
    expect(result.selectionEnd).toBe(6);
  });

  it('admite un cierre distinto del de apertura, para el color', () => {
    const result = wrapSelection('atención', 0, 8, '{c:destructive}', '{/c}');
    expect(result.value).toBe('{c:destructive}atención{/c}');
  });
});
