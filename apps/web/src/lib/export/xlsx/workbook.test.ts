import { describe, expect, it } from 'vitest';

import { cellDay, cellNumber, cellTag, cellText } from '@/lib/export/columns';
import { buildDocument } from '@/lib/export/document';
import { readZip, textOf } from '@/lib/export/zip-reader';
import { toXlsx } from './workbook';

interface Fila {
  nombre: string;
  estado: string;
  dias: number;
  alta: string;
}

const FILAS: Fila[] = [
  { nombre: 'Ana Ruiz', estado: 'activo', dias: 12, alta: '2026-01-15' },
  { nombre: 'Luis Peña', estado: 'nuevo', dias: 3, alta: '2026-02-01' },
  { nombre: 'Mar Gil', estado: 'activo', dias: 40, alta: '2026-03-20' },
];

function doc() {
  return buildDocument<Fila>({
    label: 'Creyentes',
    title: 'Iglesia El Faro · Creyentes',
    subtitle: '3 de 3 filas',
    columns: [
      { key: 'nombre', header: 'Nombre', value: (row) => cellText(row.nombre) },
      {
        key: 'estado',
        header: 'Estado',
        value: (row) => cellTag(row.estado, row.estado === 'activo' ? 'success' : 'primary'),
      },
      { key: 'dias', header: 'Días', value: (row) => cellNumber(row.dias) },
      { key: 'alta', header: 'Alta', value: (row) => cellDay(row.alta) },
    ],
    rows: FILAS,
  });
}

async function partsOf() {
  const blob = toXlsx(doc(), {
    sheet: 'Creyentes',
    summary: 'Resumen',
    summaryTitle: 'Iglesia El Faro · Resumen',
    rows: '3 filas',
    empty: 'Sin asignar',
  });

  const entries = readZip(new Uint8Array(await blob.arrayBuffer()));
  return new Map(entries.map((entry) => [entry.name, textOf(entry)]));
}

describe('toXlsx', () => {
  it('escribe las siete partes que espera Excel', async () => {
    const parts = await partsOf();

    expect([...parts.keys()]).toEqual([
      '[Content_Types].xml',
      '_rels/.rels',
      'xl/workbook.xml',
      'xl/_rels/workbook.xml.rels',
      'xl/styles.xml',
      'xl/worksheets/sheet1.xml',
      'xl/worksheets/sheet2.xml',
    ]);
  });

  it('declara cada hoja en el tipo de contenido y en las relaciones', async () => {
    const parts = await partsOf();

    expect(parts.get('[Content_Types].xml')).toContain('/xl/worksheets/sheet2.xml');
    expect(parts.get('xl/_rels/workbook.xml.rels')).toContain('worksheets/sheet2.xml');
    expect(parts.get('xl/_rels/workbook.xml.rels')).toContain('Target="styles.xml"');
    expect(parts.get('xl/workbook.xml')).toContain('name="Creyentes"');
  });

  /** La banda azul de marca es la mitad de lo que se pidió (RFC 0009 D9). */
  it('tiñe la banda y el encabezado con el azul de la marca', async () => {
    expect((await partsOf()).get('xl/styles.xml')).toContain('FF2140CF');
  });

  it('deja la fila de encabezados fija, con filtro y sin cuadrícula', async () => {
    const sheet = (await partsOf()).get('xl/worksheets/sheet1.xml') ?? '';

    expect(sheet).toContain('showGridLines="0"');
    expect(sheet).toContain('<pane ySplit="4" topLeftCell="A5"');
    expect(sheet).toContain('<autoFilter ref="A4:D7"/>');
  });

  /**
   * Las fechas van como número de serie con el formato corto integrado, no
   * como texto: es lo que permite ordenarlas y filtrarlas por rango (D10).
   */
  it('escribe las fechas como fecha y los números como número', async () => {
    const sheet = (await partsOf()).get('xl/worksheets/sheet1.xml') ?? '';

    // 2026-01-15 en serie de Excel, y el 12 de la columna de días.
    expect(sheet).toContain('<v>46037</v>');
    expect(sheet).toContain('<v>12</v>');
    expect(sheet).not.toContain('2026-01-15');
  });

  it('cuenta el resumen sobre las filas exportadas', async () => {
    const summary = (await partsOf()).get('xl/worksheets/sheet2.xml') ?? '';

    expect(summary).toContain('Estado');
    expect(summary).toContain('activo');
    // Dos «activo» y un «nuevo»: la barra de datos va sobre esa columna.
    expect(summary).toContain('type="dataBar"');
  });

  it('no deja caracteres de control, que impiden abrir el fichero', async () => {
    // Se escribe con `fromCharCode` y no literal: un carácter de control es
    // invisible y no sobrevive a un copiar y pegar.
    const control = String.fromCharCode(1);
    const roto = buildDocument<{ texto: string }>({
      label: 'X',
      title: 'X',
      subtitle: 'X',
      columns: [{ key: 'texto', header: 'Texto', value: (row) => cellText(row.texto) }],
      rows: [{ texto: `antes${control}después & <ojo>` }],
    });

    const blob = toXlsx(roto, {
      sheet: 'X',
      summary: 'Resumen',
      summaryTitle: 'X',
      rows: '1',
      empty: '—',
    });
    const parts = readZip(new Uint8Array(await blob.arrayBuffer()));
    const sheet = textOf(parts.find((one) => one.name.endsWith('sheet1.xml')) ?? parts[0]);

    expect(sheet).toContain('antesdespués &amp; &lt;ojo&gt;');
    expect(sheet).not.toContain(control);
  });
});
