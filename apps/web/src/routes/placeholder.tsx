import { useTranslation } from 'react-i18next';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';

type NavKey =
  | 'nav.calendar'
  | 'nav.believers'
  | 'nav.prophecies'
  | 'nav.dreams'
  | 'nav.communications';

/**
 * Página puente para las secciones que todavía son solo una RFC.
 * Cada una se sustituirá al implementar su documento de docs/rfcs.
 */
export function PlaceholderPage({ titleKey, rfc }: { titleKey: NavKey; rfc: string }) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t(titleKey)}</h1>
      <Card>
        <CardTitle className="text-base">{t('common.comingSoon')}</CardTitle>
        <CardDescription>
          Especificación: <code>docs/rfcs/{rfc}</code>
        </CardDescription>
      </Card>
    </section>
  );
}
