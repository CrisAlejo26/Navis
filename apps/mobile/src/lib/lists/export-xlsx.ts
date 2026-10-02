import { buildZipBytes, utf8 } from '@navis/shared';
import { escapeMarkup, type ListExportTable } from './export-table';

/** Inline strings preserve names and prevent spreadsheet formula execution. */
export function listXlsx(table: ListExportTable): Uint8Array<ArrayBuffer> {
    const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const rows = [table.headers, ...table.rows]
        .map(
            (row, index) =>
                `<row r="${index + 1}">${row.map((cell, column) => `<c r="${String.fromCharCode(65 + column)}${index + 1}" t="inlineStr"><is><t xml:space="preserve">${escapeMarkup(cell)}</t></is></c>`).join('')}</row>`,
        )
        .join('');
    const entries = [
        {
            name: '[Content_Types].xml',
            text: `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
        },
        {
            name: '_rels/.rels',
            text: `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
        },
        {
            name: 'xl/workbook.xml',
            text: `<workbook xmlns="${ns}" xmlns:r="${rel}"><sheets><sheet name="Navis" sheetId="1" r:id="rId1"/></sheets></workbook>`,
        },
        {
            name: 'xl/_rels/workbook.xml.rels',
            text: `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
        },
        {
            name: 'xl/worksheets/sheet1.xml',
            text: `<worksheet xmlns="${ns}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews><sheetData>${rows}</sheetData><autoFilter ref="A1:${String.fromCharCode(64 + table.headers.length)}${table.rows.length + 1}"/></worksheet>`,
        },
    ];
    return buildZipBytes(entries.map((one) => ({ name: one.name, data: utf8(one.text) })));
}
