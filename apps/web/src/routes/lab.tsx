import { useTranslation } from 'react-i18next';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ShipLoader } from '@/components/ui/ship-loader';

const SIZES = ['sm', 'md', 'lg'] as const;

/**
 * Muestrario de las piezas de interfaz que solo se ven un instante y cuesta
 * mirar con calma en su sitio —hoy, el cargador—.
 *
 * No está en la navegación: se abre a mano en `/lab`. Su texto sale de claves
 * que ya existen, así que no añade traducciones a los seis idiomas por una
 * pantalla de taller.
 */
export function LabPage() {
  const { t } = useTranslation();

  return (
    <section className="gap-6 flex flex-col">
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('settings.appearance')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('common.loading')}</p>
      </header>

      <div className="gap-6 lg:grid-cols-3 grid">
        {SIZES.map((size) => (
          <Card key={size} className="gap-4 flex flex-col">
            <div>
              <CardTitle className="text-base">{size}</CardTitle>
              <CardDescription>
                {size === 'sm' ? 'card' : size === 'md' ? 'inline' : 'full page'}
              </CardDescription>
            </div>
            <div className="py-8 flex items-center justify-center rounded-lg bg-muted/40">
              <ShipLoader size={size} label={t('common.loading')} />
            </div>
          </Card>
        ))}
      </div>

      {/* Sobre el azul de marca, que es donde se ve en las pantallas de acceso. */}
      <Card className="p-0 overflow-hidden">
        <div className="py-14 flex items-center justify-center bg-brand">
          <ShipLoader size="lg" tone="brand" label={t('common.loading')} />
        </div>
      </Card>
    </section>
  );
}
