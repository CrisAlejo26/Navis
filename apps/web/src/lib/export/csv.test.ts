import { describe, expect, it } from 'vitest';

import { cellNumber, cellTags, cellText, type ExportColumn } from './columns';
import { toCsvText } from './csv';
import { buildDocument } from './document';
import { toMarkdown } from './markdown';

interface Fila {
  nombre: string;
  nota: string;
  dones: string[];
  dias: number;
}

const COLUMNAS: ExportColumn<Fila>[] = [
  { key: 'nombre', header: 'Nombre', value: (row) => cellText(row.nombre) },
  { key: 'nota', header: 'Nota', value: (row) => cellText(row.nota) },
  {
    key: 'dones',
    header: 'Dones',
    value: (row) => cellTags(row.dones.map((name) => ({ text: name, accent: 'primary' }))),
  },
  { key: 'dias', header: 'Días', value: (row) => cellNumber(row.dias) },
];

function doc(rows: Fila[]) {
  return buildDocument<Fila>({
    label: 'Creyentes',
    title: 'Iglesia El Faro · Creyentes',
    subtitle: '1 de 1 filas',
    columns: COLUMNAS,
    rows,
  });
}

describe('toCsvText', () => {
  it('entrecomilla lo que lleva coma, comillas o salto de línea', () => {
    const csv = toCsvText(doc([{ nombre: 'Ruiz, Ana', nota: 'Dijo "sí"', dones: [], dias: 3 }]));

    expect(csv.split('\r\n')[1]).toBe('"Ruiz, Ana","Dijo ""sí""",,3');
  });

  it('junta varias etiquetas en una sola celda', () => {
    const csv = toCsvText(
      doc([{ nombre: 'Ana', nota: '', dones: ['Sanidad', 'Enseñanza'], dias: 0 }]),
    );

    expect(csv).toContain('Sanidad · Enseñanza');
  });

  /** Un CSV lo lee una máquina: dos líneas de adorno romperían la cabecera. */
  it('no lleva ni título ni línea de filtros', () => {
    const csv = toCsvText(doc([{ nombre: 'Ana', nota: '', dones: [], dias: 0 }]));

    expect(csv.split('\r\n')[0]).toBe('Nombre,Nota,Dones,Días');
  });
});

describe('toMarkdown', () => {
  it('lleva el título y la línea de filtros, que esto lo lee una persona', () => {
    const md = toMarkdown(doc([{ nombre: 'Ana', nota: '', dones: [], dias: 0 }]));

    expect(md).toContain('# Iglesia El Faro · Creyentes');
    expect(md).toContain('_1 de 1 filas_');
  });

  it('escapa la barra vertical y aplasta los saltos de línea', () => {
    const md = toMarkdown(doc([{ nombre: 'Ana | Ruiz', nota: 'dos\nlíneas', dones: [], dias: 0 }]));

    expect(md).toContain('Ana \\| Ruiz');
    expect(md).toContain('dos líneas');
  });

  /** Los números a la derecha y el resto a la izquierda, sin decirlo a mano. */
  it('alinea la columna de números a la derecha', () => {
    const md = toMarkdown(doc([{ nombre: 'Ana', nota: '', dones: [], dias: 7 }]));

    expect(md.split('\n')[5]).toBe('| :--- | :--- | :--- | ---: |');
  });
});
