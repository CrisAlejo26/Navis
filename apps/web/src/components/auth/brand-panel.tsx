import { useTranslation } from 'react-i18next';

import { ChartLines } from '@/components/auth/chart-lines';
import { Logo } from '@/components/logo';

/**
 * La superficie de marca de las pantallas de acceso: el azul del logo
 * (token `--brand`, que no cambia con el tema porque es la marca y no la
 * interfaz — Regla 7) con las curvas de nivel derivando por detrás.
 *
 * En pantallas anchas ocupa una columna entera; por debajo de `lg` se queda en
 * una banda alta, para no comerse el formulario en un teléfono (Regla 5).
 */

/** El nombre, espaciado como la rotulación de un casco. */
function Wordmark({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();

  return (
    <span className="gap-3 flex items-center">
      <Logo variante="blanco" className={compact ? 'h-7 w-7' : 'h-9 w-9'} />
      <span
        className={`font-semibold -mr-[0.32em] uppercase ${compact ? 'text-xs tracking-[0.32em]' : 'text-sm tracking-[0.32em]'}`}
      >
        {t('common.appName')}
      </span>
    </span>
  );
}

export function BrandPanel() {
  const { t } = useTranslation();

  return (
    <aside className="max-w-lg p-10 lg:flex relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-brand text-brand-foreground">
      <ChartLines className="text-brand-foreground" />

      <div className="animate-rise-in relative">
        <Wordmark />
      </div>

      <div className="animate-rise-in relative" style={{ animationDelay: '160ms' }}>
        {/* La única marca cálida sobre el azul: el acento, y una sola vez. */}
        <span className="mb-6 w-14 block h-px bg-accent" />
        <p className="max-w-sm text-3xl font-semibold leading-[1.1] tracking-[-0.02em]">
          {t('auth.tagline')}
        </p>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-foreground/70">
          {t('auth.taglineDetail')}
        </p>
      </div>
    </aside>
  );
}

/** La misma superficie reducida a una banda, para móvil y tablet. */
export function BrandStrip() {
  return (
    <div className="h-14 px-5 lg:hidden relative flex shrink-0 items-center overflow-hidden bg-brand text-brand-foreground">
      <ChartLines className="text-brand-foreground" />
      <div className="relative">
        <Wordmark compact />
      </div>
    </div>
  );
}
