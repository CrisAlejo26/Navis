import { DEFAULT_PUBLIC_FIELDS, type ListMember } from '@navis/shared';
import { listExportTable, listCsv, listHtml, listMarkdown } from './export-table';
import { listXlsx } from './export-xlsx';
const member: ListMember = {
    believerId: 'id',
    firstName: 'Ana',
    lastName: 'Pérez',
    position: 8,
    note: '=HYPERLINK("secreto")',
    congregationId: null,
    congregationName: 'Centro',
    congregationAccent: null,
    ministries: ['Sonido'],
    hasPhoto: false,
    hasAccess: false,
    arrivedAt: null,
    arrivalSite: null,
    bibleReadings: null,
    vivenciasReadings: null,
    bibleInstituteTimes: null,
};
const labels = {
    order: 'Orden',
    name: 'Nombre',
    congregation: 'Sede',
    ministry: 'Labor',
    note: 'Nota',
    arrival: 'Llegada',
    bibleReadings: 'Biblia',
    vivenciasReadings: 'Vivencias',
    bibleInstituteTimes: 'Instituto',
};
it('exporta solo los campos elegidos con nombres abreviados y orden visible', () => {
    const table = listExportTable(
        'Lista',
        [member],
        { ...DEFAULT_PUBLIC_FIELDS, nameStyle: 'initial' },
        labels,
    );
    expect(table.rows).toEqual([['1', 'Ana P.']]);
    expect(listCsv(table)).not.toContain('secreto');
    expect(listMarkdown(table)).toContain('Ana P.');
});
it('escapa HTML y neutraliza fórmulas en CSV y XLSX', () => {
    const table = listExportTable(
        '<script>',
        [member],
        { ...DEFAULT_PUBLIC_FIELDS, note: true },
        labels,
    );
    expect(listHtml(table)).toContain('&lt;script&gt;');
    expect(listCsv(table)).toContain("'=HYPERLINK");
    const bytes = listXlsx(table);
    expect(Array.from(bytes.slice(0, 4))).toEqual([80, 75, 3, 4]);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('t="inlineStr"');
    expect(text).not.toContain('<f>');
    expect(text).toContain('Ana Pérez');
});
