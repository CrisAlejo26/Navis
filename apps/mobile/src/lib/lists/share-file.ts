import { File, Paths } from 'expo-file-system';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { printToFileAsync } from 'expo-print';
import { listCsv, listHtml, listMarkdown, type ListExportTable } from './export-table';
import { listXlsx } from './export-xlsx';

export type ListFileFormat = 'xlsx' | 'pdf' | 'image' | 'markdown' | 'csv';
export async function shareListFile(
    table: ListExportTable,
    slug: string,
    format: ListFileFormat,
    capture: () => Promise<string>,
): Promise<void> {
    if (!(await isAvailableAsync())) throw new Error('sharing-unavailable');
    const extension = format === 'image' ? 'png' : format === 'markdown' ? 'md' : format;
    const file = new File(Paths.cache, `navis-${slug}.${extension}`);
    if (file.exists) file.delete();
    const mime = {
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pdf: 'application/pdf',
        image: 'image/png',
        markdown: 'text/markdown',
        csv: 'text/csv',
    }[format];
    try {
        if (format === 'pdf') {
            const inline = async (uri: string | null | undefined) =>
                uri ? `data:image/jpeg;base64,${await new File(uri).base64()}` : null;
            const embedded = {
                ...table,
                cover: await inline(table.cover),
                photos: table.photos ? await Promise.all(table.photos.map(inline)) : undefined,
            };
            const result = await printToFileAsync({
                html: listHtml(embedded),
                width: 842,
                height: 595,
            });
            const temporary = new File(result.uri);
            try {
                await temporary.copy(file);
            } finally {
                if (temporary.exists) temporary.delete();
            }
        } else if (format === 'image') {
            const temporary = new File(await capture());
            try {
                await temporary.copy(file);
            } finally {
                if (temporary.exists) temporary.delete();
            }
        } else {
            file.create({ overwrite: true });
            file.write(
                format === 'xlsx'
                    ? listXlsx(table)
                    : format === 'csv'
                      ? listCsv(table)
                      : listMarkdown(table),
            );
        }
        await shareAsync(file.uri, { mimeType: mime, dialogTitle: table.title });
    } finally {
        if (file.exists) file.delete();
    }
}
