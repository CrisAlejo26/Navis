import type { ListMember, ListPublicFields } from '@navis/shared';

export type ListExportTable = {
    title: string;
    headers: string[];
    rows: string[][];
    photos?: (string | null)[];
    cover?: string | null;
};
export type ExportLabels = {
    order: string;
    name: string;
    congregation: string;
    ministry: string;
    note: string;
    arrival: string;
    bibleReadings: string;
    vivenciasReadings: string;
    bibleInstituteTimes: string;
};

/** File sharing applies the same explicit field whitelist as the public page. */
export function listExportTable(
    title: string,
    members: readonly ListMember[],
    fields: ListPublicFields,
    labels: ExportLabels,
): ListExportTable {
    const columns: { header: string; value: (member: ListMember, index: number) => string }[] = [
        { header: labels.order, value: (_one, index) => String(index + 1) },
        {
            header: labels.name,
            value: (one) =>
                `${one.firstName} ${fields.nameStyle === 'initial' ? (one.lastName ? `${one.lastName[0]}.` : '') : one.lastName}`.trim(),
        },
    ];
    if (fields.congregation)
        columns.push({ header: labels.congregation, value: (one) => one.congregationName ?? '' });
    if (fields.ministry)
        columns.push({ header: labels.ministry, value: (one) => one.ministries.join(' · ') });
    if (fields.note) columns.push({ header: labels.note, value: (one) => one.note ?? '' });
    if (fields.arrival)
        columns.push({
            header: labels.arrival,
            value: (one) => [one.arrivedAt, one.arrivalSite].filter(Boolean).join(' · '),
        });
    for (const key of ['bibleReadings', 'vivenciasReadings', 'bibleInstituteTimes'] as const) {
        if (fields[key])
            columns.push({
                header: labels[key],
                value: (one) => (one[key] === null ? '' : String(one[key])),
            });
    }
    return {
        title,
        headers: columns.map((one) => one.header),
        rows: members.map((member, index) => columns.map((one) => one.value(member, index))),
    };
}

const csvCell = (value: string) =>
    `"${(/^[=+@\-\t\r]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
export function listCsv(table: ListExportTable): string {
    return (
        '\ufeff' +
        [table.headers, ...table.rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
    );
}
export function listMarkdown(table: ListExportTable): string {
    const row = (values: string[]) =>
        `| ${values.map((one) => one.replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ')).join(' | ')} |`;
    return `# ${table.title.replace(/[\r\n]+/g, ' ')}\n\n${row(table.headers)}\n${row(table.headers.map(() => '---'))}\n${table.rows.map(row).join('\n')}`;
}
export function escapeMarkup(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}
export function listHtml(table: ListExportTable): string {
    const row = (values: string[], tag: 'td' | 'th') =>
        `<tr>${values.map((one) => `<${tag}>${escapeMarkup(one)}</${tag}>`).join('')}</tr>`;
    const photo = (uri: string | null | undefined, width: number) =>
        uri
            ? `<img src="${escapeMarkup(uri)}" style="width:${width}px;max-height:${width}px;object-fit:cover">`
            : '';
    const hasPhotos = Boolean(table.photos?.some(Boolean));
    const headers = hasPhotos ? ['', ...table.headers] : table.headers;
    const body = table.rows
        .map((one, index) => {
            const cells = one.map((value) => `<td>${escapeMarkup(value)}</td>`).join('');
            return `<tr>${hasPhotos ? `<td>${photo(table.photos?.[index], 40)}</td>` : ''}${cells}</tr>`;
        })
        .join('');
    return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4 landscape;margin:16mm}body{font:12px sans-serif;color:#111}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}th{background:#e5f0ff}</style></head><body>${photo(table.cover, 600)}<h1>${escapeMarkup(table.title)}</h1><table><thead>${row(headers, 'th')}</thead><tbody>${body}</tbody></table></body></html>`;
}
