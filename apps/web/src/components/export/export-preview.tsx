import { useTranslation } from 'react-i18next';

import { ROWS_PER_PAGE } from '@/components/export/export-page-styles';
import { ExportPreviewBody, PREVIEW_ROWS } from '@/components/export/export-preview-body';
import { cn } from '@/lib/cn';
import type { ExportDocument } from '@/lib/export/document';
import type { ExportFormat } from '@/lib/export/formats';

/**
 * **La hoja**: el elemento firma del diálogo (RFC 0009 D13).
 *
 * No hay cinco vistas previas, hay **una que se convierte**. Al elegir formato
 * se le cambia la piel —la banda y la cuadrícula para Excel, dos páginas
 * asomando por detrás para el PDF, el recorte para la imagen, monoespaciada
 * para Markdown y CSV— con un fundido corto y nada más. Es lo único que se
 * anima aquí, y es lo que se recuerda de esta pantalla.
 *
 * Dentro van **las primeras filas de verdad**, no un dibujo: se ve el nombre
 * de la primera persona de la lista.
 */
export function ExportPreview({ doc, format }: { doc: ExportDocument; format: ExportFormat }) {
  const { t } = useTranslation();
  const apilada = format === 'pdf';

  return (
    <div>
      <div className="relative">
        {/* Las dos páginas de detrás, solo en PDF: es lo que dice «esto tiene
            varias hojas» sin escribirlo. Decorativas del todo. */}
        {apilada && (
          <>
            <span
              aria-hidden
              className="right-1.5 -top-2 bottom-2 left-3.5 absolute rounded-lg border bg-card opacity-50"
            />
            <span
              aria-hidden
              className="right-0.5 -top-1 bottom-1 left-2 absolute rounded-lg border bg-card opacity-75"
            />
          </>
        )}

        <div
          className={cn(
            'relative overflow-hidden rounded-lg border bg-card',
            'transition-[border-radius,box-shadow] duration-200',
            format === 'image' && 'ring-2 ring-primary/25 ring-offset-2 ring-offset-background',
            apilada && 'shadow-sm',
          )}
        >
          <div className="px-3 py-2 bg-primary text-primary-foreground">
            <p className="font-semibold truncate text-[11px]">{doc.title}</p>
          </div>
          <p className="px-3 py-1 truncate bg-primary/10 text-[9px] text-muted-foreground">
            {doc.subtitle}
          </p>

          {/* La clave hace que React remonte y el fundido vuelva a lanzarse:
              es el cambio de piel (D13). */}
          <div key={format} className="animate-page-in">
            <ExportPreviewBody doc={doc} format={format} />
          </div>

          {apilada && (
            <p className="px-3 pb-1.5 text-right text-[9px] text-muted-foreground tabular-nums">
              {t('export.pageOf', { page: 1, pages: pageCount(doc.rows.length) })}
            </p>
          )}
        </div>
      </div>

      {/* Honesto en los cinco casos: es una muestra, no una promesa. En Excel
          va a quedar como lo pinte Excel. */}
      <p className="mt-2 text-xs text-muted-foreground">
        {t('export.previewNote', {
          shown: Math.min(PREVIEW_ROWS, doc.rows.length),
          total: doc.rows.length,
        })}
      </p>
    </div>
  );
}

/** Cuántas páginas van a salir, con las mismas filas por página que el PDF. */
function pageCount(rows: number): number {
  return Math.max(1, Math.ceil(rows / ROWS_PER_PAGE));
}
