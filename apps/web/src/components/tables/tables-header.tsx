import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

/** La cabecera del tablón de tablas (RFC 0021). */
export function TablesHeader({ onAdd }: { onAdd?: () => void }) {
  const { t } = useTranslation();

  return (
    <header className="gap-4 flex flex-wrap items-end justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('tables.title')}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t('tables.subtitle')}</p>
      </div>

      {onAdd && (
        <Button size="lg" onClick={onAdd}>
          <Plus size={16} aria-hidden />
          {t('tables.newTable')}
        </Button>
      )}
    </header>
  );
}
