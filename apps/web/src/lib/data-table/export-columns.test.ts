import { describe, expect, it } from 'vitest';

import { buildDocument } from '@/lib/export/document';
import { readZip, textOf } from '@/lib/export/zip-reader';
import { toXlsx } from '@/lib/export/xlsx/workbook';

import type { DataTableColumn } from './columns';
import { toExportColumns } from './export-columns';

interface Persona {
    nombre: string;
    edad: number | null;
    alta: string | null;
    activa: boolean;
    grupo: 'a' | 'b';
}

const labels = { yes: 'Sí', no: 'No' };

const columns: DataTableColumn<Persona>[] = [
    { id: 'nombre', kind: 'text', label: 'Nombre', value: (p) => p.nombre, cell: (p) => p.nombre },
    { id: 'edad', kind: 'number', label: 'Edad', value: (p) => p.edad, cell: (p) => p.edad },
    { id: 'alta', kind: 'date', label: 'Alta', value: (p) => p.alta, cell: (p) => p.alta },
    { id: 'activa', kind: 'boolean', label: 'Activa', value: (p) => p.activa, cell: () => null },
    {
        id: 'grupo',
        kind: 'select',
        label: 'Grupo',
        value: (p) => p.grupo,
        cell: (p) => p.grupo,
        options: [
            { value: 'a', label: 'Grupo A', accent: '#2140cf' },
            { value: 'b', label: 'Grupo B' },
        ],
    },
    { id: 'acciones', kind: 'text', label: 'Acciones', cell: () => null },
    {
        id: 'oculta',
        kind: 'text',
        label: 'Oculta',
        exportable: false,
        value: () => 'x',
        cell: () => null,
    },
];

const personas: Persona[] = [
    { nombre: 'Ana Ruiz', edad: 34, alta: '2026-03-14', activa: true, grupo: 'a' },
    { nombre: 'Luis Peña', edad: null, alta: null, activa: false, grupo: 'b' },
];

describe('toExportColumns', () => {
    it('exporta las columnas con qué escribir y deja fuera las acciones y las marcadas', () => {
        expect(toExportColumns(columns, labels).map((column) => column.key)).toEqual([
            'nombre',
            'edad',
            'alta',
            'activa',
            'grupo',
        ]);
    });

    it('cada valor sale como lo que es: número, día, sí/no y etiqueta con su nombre', () => {
        const [nombre, edad, alta, activa, grupo] = toExportColumns(columns, labels);
        const ana = personas[0];
        const luis = personas[1];
        if (!ana || !luis) throw new Error('faltan datos de prueba');

        expect(nombre?.value(ana)).toEqual({ kind: 'text', text: 'Ana Ruiz' });
        expect(edad?.value(ana)).toEqual({ kind: 'number', value: 34 });
        expect(alta?.value(ana)).toEqual({ kind: 'day', iso: '2026-03-14' });
        expect(activa?.value(ana)).toEqual({ kind: 'text', text: 'Sí' });
        expect(activa?.value(luis)).toEqual({ kind: 'text', text: 'No' });
        expect(grupo?.value(ana)).toEqual({
            kind: 'tags',
            tags: [{ text: 'Grupo A', accent: '#2140cf' }],
        });
        expect(grupo?.value(luis)).toEqual({ kind: 'text', text: 'Grupo B' });
    });

    // Regresión de CLAUDE.md: un día de calendario nunca pasa por `new Date(iso)`.
    it('un valor vacío queda como celda vacía y no como «null» ni «0»', () => {
        const [, edad, alta] = toExportColumns(columns, labels);
        const luis = personas[1];
        if (!luis) throw new Error('faltan datos de prueba');
        expect(edad?.value(luis)).toEqual({ kind: 'text', text: '' });
        expect(alta?.value(luis)).toEqual({ kind: 'text', text: '' });
    });

    it('una celda de exportación propia manda sobre el valor en bruto', () => {
        const custom: DataTableColumn<Persona>[] = [
            {
                id: 'nombre',
                kind: 'text',
                label: 'Nombre',
                cell: () => null,
                exportCell: (p) => ({ kind: 'text', text: p.nombre.toUpperCase() }),
            },
        ];
        const ana = personas[0];
        if (!ana) throw new Error('faltan datos de prueba');
        expect(toExportColumns(custom, labels)[0]?.value(ana)).toEqual({
            kind: 'text',
            text: 'ANA RUIZ',
        });
    });
});

describe('el Excel de una tabla', () => {
    it('sale con las siete partes, la banda del título y las fechas como fechas de Excel', async () => {
        const doc = buildDocument({
            label: 'Personas',
            title: 'Iglesia El Faro · Personas',
            subtitle: '2 de 2 filas',
            columns: toExportColumns(columns, labels),
            rows: personas,
        });
        const blob = toXlsx(doc, {
            sheet: 'Personas',
            summary: 'Resumen',
            summaryTitle: 'Resumen',
            rows: '2 filas',
            empty: 'Sin asignar',
        });
        const entries = readZip(new Uint8Array(await blob.arrayBuffer()));
        const parts = new Map(entries.map((entry) => [entry.name, textOf(entry)]));

        expect(parts.has('xl/styles.xml')).toBe(true);
        const sheet = parts.get('xl/worksheets/sheet1.xml') ?? '';
        expect(sheet).toContain('Iglesia El Faro · Personas');
        expect(sheet).toContain('Ana Ruiz');
        // 2026-03-14 es el número de serie 46095 en Excel (desde el 30/12/1899).
        expect(sheet).toContain('46095');
        // El encabezado de una columna de números va a la derecha, sobre sus cifras.
        expect(sheet).toMatch(/<c r="B4" s="11"/);
    });
});
