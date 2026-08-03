import { useTranslation } from 'react-i18next';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { useSession } from '@/lib/auth-client';

/**
 * Panel de inicio. De momento es el esqueleto: las métricas reales llegan con
 * la RFC 0001 (docs/rfcs/0001-panel-de-metricas.md).
 */
export function DashboardPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const sections = [
    'nav.calendar',
    'nav.believers',
    'nav.prophecies',
    'nav.dreams',
    'nav.communications',
  ] as const;

  return (
    <section className="gap-6 flex flex-col">
      <header>
        <h1 className="text-2xl font-semibold">{t('home.title')}</h1>
        <p className="text-muted-foreground">
          {session?.user.name ? t('auth.welcome', { name: session.user.name }) : t('home.subtitle')}
        </p>
      </header>

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
