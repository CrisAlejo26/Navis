/**
 * Los cinco formatos, y **para qué sirve cada uno** (RFC 0009 D4). Si no se
 * puede escribir en una línea para qué vale, sobra.
 */
export const EXPORT_FORMATS = ['xlsx', 'pdf', 'image', 'markdown', 'csv'] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const DEFAULT_EXPORT_FORMAT: ExportFormat = 'xlsx';

interface FormatInfo {
  extension: string;
  labelKey: string;
  hintKey: string;
  /** Si «Copiar» hace algo con este formato, y qué copia. */
  copy: 'text' | 'image' | 'none';
}

export const FORMAT_INFO: Record<ExportFormat, FormatInfo> = {
  xlsx: {
    extension: 'xlsx',
    labelKey: 'export.xlsx',
    hintKey: 'export.xlsxHint',
    copy: 'none',
  },
  pdf: { extension: 'pdf', labelKey: 'export.pdf', hintKey: 'export.pdfHint', copy: 'none' },
  image: { extension: 'png', labelKey: 'export.image', hintKey: 'export.imageHint', copy: 'image' },
  markdown: {
    extension: 'md',
    labelKey: 'export.markdown',
    hintKey: 'export.markdownHint',
    copy: 'text',
  },
  csv: { extension: 'csv', labelKey: 'export.csv', hintKey: 'export.csvHint', copy: 'text' },
};
