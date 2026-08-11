import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

/**
 * La barra que aparece con selección puesta: **«Exportar N»** es la única
 * acción en lote, nunca un borrado masivo (RFC 0017 §7.4 — una comodidad no
 * puede ser también un accidente de un clic). Nacida en `journal/`; en
 * cuanto Comunicaciones la necesitó también, subió a `ui` (Regla 1 §5).
 */
export function SelectionBar({
  count,
  isExporting,
  onExport,
  onClear,
}: {
  count: number;
  isExporting: boolean;
  onExport: () => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  if (count === 0) return null;

  return (
    <div className="gap-3 p-3 animate-page-in flex items-center justify-between rounded-xl border bg-card">
      <p className="text-sm font-medium">{t('export.selected', { count })}</p>

      <div className="gap-2 flex items-center">
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X size={15} aria-hidden />
          {t('common.close')}
        </Button>
        <Button size="sm" isLoading={isExporting} onClick={onExport}>
          <Download size={15} aria-hidden />
          {t('export.selectedAction', { count })}
        </Button>
      </div>
    </div>
  );
}
