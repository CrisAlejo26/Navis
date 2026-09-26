import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

/**
 * «Exportar»: lleva a un fichero lo que se ve —columnas visibles, filtros, búsqueda
 * y orden—. Sin texto en un teléfono, para que la fila de botones quepa; el nombre
 * accesible sigue ahí.
 */
export function ExportButton({ onClick }: { onClick: () => void }) {
    const { t } = useTranslation();

    return (
        <Tooltip label={t('dataTable.export.button')} description={t('dataTable.export.help')}>
            <Button
                variant="outline"
                size="sm"
                className="max-sm:h-11 max-sm:px-3"
                onClick={onClick}
            >
                <Download size={16} aria-hidden className="text-primary" />
                <span className="max-sm:sr-only">{t('dataTable.export.button')}</span>
            </Button>
        </Tooltip>
    );
}
