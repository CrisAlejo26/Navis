import { AlertTriangle, Copy, Download, Send } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ExportPreview } from '@/components/export/export-preview';
import { useExport } from '@/components/export/use-export';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { ExportDocument } from '@/lib/export/document';
import {
  DEFAULT_EXPORT_FORMAT,
  EXPORT_FORMATS,
  FORMAT_INFO,
  type ExportFormat,
} from '@/lib/export/formats';

export interface ExportSheetProps {
  open: boolean;
  onClose: () => void;
  /** Ya construido con `buildDocument`: aquí no se sabe qué es un creyente. */
  doc: ExportDocument | null;
  /** Cuántas cumplen el filtro de verdad, para poder decir «2000 de 3140». */
  total: number;
  truncated: boolean;
  isLoading: boolean;
  /** Un aviso o ajuste antes del formato, como la casilla de contraseñas de tablas (RFC 0021 D23). */
  before?: ReactNode;
}

/**
 * El diálogo de exportar (RFC 0009 §7.2).
 *
 * Lo primero que se lee no es el formato: es **qué se lleva**. Un botón que
 * descarga sin decir cuántas filas van y con qué filtros es el problema de
 * partida cambiado de sitio.
 */
export function ExportSheet({
  open,
  onClose,
  doc,
  total,
  truncated,
  isLoading,
  before,
}: ExportSheetProps) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>(DEFAULT_EXPORT_FORMAT);
  const actions = useExport(doc, format);

  const vacio = !isLoading && (doc?.rows.length ?? 0) === 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('export.title')}
      width="min(38rem, calc(100vw - 2rem))"
    >
      <div className="gap-4 flex flex-col">
        {before}

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : vacio ? (
          <p className="py-8 text-sm text-center text-muted-foreground">{t('export.empty')}</p>
        ) : (
          doc && (
            <>
              <div className="gap-1 flex flex-col">
                <p className="text-sm">{doc.subtitle}</p>
                {truncated && (
                  <p className="gap-1.5 text-xs flex items-start text-warning">
                    <AlertTriangle size={14} aria-hidden className="mt-0.5 shrink-0" />
                    {t('export.truncated', { max: doc.rows.length, total })}
                  </p>
                )}
              </div>

              <fieldset className="gap-1.5 flex flex-col">
                <legend className="mb-1 font-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                  {t('export.format')}
                </legend>
                <div className="gap-1.5 flex flex-wrap">
                  {EXPORT_FORMATS.map((one) => (
                    <Chip
                      key={one}
                      active={one === format}
                      title={t(FORMAT_INFO[one].hintKey)}
                      onClick={() => {
                        setFormat(one);
                      }}
                    >
                      {t(FORMAT_INFO[one].labelKey)}
                    </Chip>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(FORMAT_INFO[format].hintKey)}
                </p>
              </fieldset>

              <ExportPreview doc={doc} format={format} />

              {actions.imageTooLong && (
                <p className="gap-1.5 text-xs flex items-start text-warning">
                  <AlertTriangle size={14} aria-hidden className="mt-0.5 shrink-0" />
                  {t('export.imageTooLong')}
                </p>
              )}

              <div className="gap-2 flex flex-wrap">
                <Button
                  size="lg"
                  isLoading={actions.busy}
                  disabled={actions.imageTooLong}
                  onClick={actions.download}
                >
                  <Download size={16} aria-hidden />
                  {t('export.download')}
                </Button>

                {typeof navigator.share === 'function' && (
                  <Button
                    variant="secondary"
                    disabled={actions.busy || actions.imageTooLong}
                    onClick={actions.share}
                  >
                    <Send size={15} aria-hidden />
                    {t('export.send')}
                  </Button>
                )}

                {actions.canCopy && (
                  <Button
                    variant="ghost"
                    disabled={actions.busy || actions.imageTooLong}
                    onClick={actions.copy}
                  >
                    <Copy size={15} aria-hidden />
                    {t('export.copy')}
                  </Button>
                )}
              </div>
            </>
          )
        )}
      </div>
    </Dialog>
  );
}
