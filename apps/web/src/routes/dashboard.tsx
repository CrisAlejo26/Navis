import { useTranslation } from 'react-i18next';

import { WelcomeHeader } from '@/components/home/welcome-header';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

/**
 * Panel de inicio. De momento son la cabecera y el esqueleto: las métricas
 * reales llegan con la RFC 0001 (docs/rfcs/0001-panel-de-metricas.md).
 */
export function DashboardPage() {
  const { t } = useTranslation();

  const sections = [
    'nav.calendar',
    'nav.believers',
    'nav.prophecies',
    'nav.dreams',
    'nav.communications',
  ] as const;

  return (
    <section className="gap-6 flex flex-col">
      <WelcomeHeader />

      <div className="gap-4 sm:grid-cols-2 lg:grid-cols-3 grid">
        {sections.map((key) => (
          <Card key={key}>
            <CardTitle className="text-base">{t(key)}</CardTitle>
            <CardDescription>{t('common.comingSoon')}</CardDescription>
          </Card>
        ))}
      </div>
    </section>
  );
}
