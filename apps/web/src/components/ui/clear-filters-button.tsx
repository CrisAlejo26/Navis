import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

/**
 * Quitar **todos** los filtros de golpe.
 *
 * Vive en la barra de herramientas y no dentro del panel de filtros, que en
 * pantallas estrechas está escondido en un cajón: quien no encuentra cómo
 * deshacer un filtro acaba recargando la página.
 *
 * Solo aparece cuando hay algo que quitar —un botón que no hace nada ocupa
 * sitio y enseña a ignorarlo— y dice cuántos se lleva por delante.
 */
export function ClearFiltersButton({ count, onClear }: { count: number; onClear: () => void }) {
  const { t } = useTranslation();
  if (count === 0) return null;

  return (
    <Button
      variant="ghost"
      size="md"
      className="shrink-0"
      onClick={() => {
        onClear();
        toast.success(t('common.filterCleared'));
      }}
    >
      <RotateCcw size={15} aria-hidden />
      {t('common.clearFilters', { total: count })}
    </Button>
  );
}
