import type { ReactNode } from 'react';

import { BrandPanel, BrandStrip } from '@/components/auth/brand-panel';
import { LanguageSelect } from '@/components/language-select';
import { ThemeToggle } from '@/components/theme-toggle';

interface AuthLayoutProps {
  /** Micro-etiqueta sobre el titular. Solo cuando dice algo, no de adorno. */
  eyebrow?: string;
  title: string;
  subtitle: string;
  /** El formulario. */
  children: ReactNode;
  /** El enlace a la otra pantalla de acceso. */
  footer?: ReactNode;
}

/**
 * Estructura común de acceso, alta y primer arranque: la marca a un lado y el
 * formulario al otro, sin la tarjeta centrada de siempre (Regla 9).
 *
 * La entrada está orquestada en tres tiempos —encabezado, formulario y pie—
 * en vez de animar cada campo por su cuenta: se nota que es una secuencia y no
 * un montón de cosas moviéndose.
 */
export function AuthLayout({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="lg:flex-row flex min-h-dvh flex-col">
      <BrandStrip />
      <BrandPanel />

      <main className="flex flex-1 flex-col">
        {/* Tema e idioma arriba y en voz baja: abajo los tapaba el aviso de
            actualización de la PWA, que va fijo al pie de la ventana. */}
        <div className="gap-3 px-5 pt-5 sm:px-8 flex items-center justify-end">
          <ThemeToggle />
          <LanguageSelect />
        </div>

        <div className="px-5 pt-6 pb-16 sm:px-10 flex flex-1 items-center justify-center">
          <div className="w-full max-w-[26rem]">
            <header className="mb-8 animate-rise-in">
              {eyebrow && (
                <p className="font-semibold text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                  {eyebrow}
                </p>
              )}
              <h1 className="mt-3 font-semibold sm:text-[2.25rem] text-[2rem] leading-[1.08] tracking-[-0.03em]">
                {title}
              </h1>
              <p className="mt-3 leading-relaxed text-[15px] text-muted-foreground">{subtitle}</p>
            </header>

            <div className="animate-rise-in" style={{ animationDelay: '90ms' }}>
              {children}
            </div>

            {footer && (
              <div className="mt-8 animate-rise-in" style={{ animationDelay: '180ms' }}>
                {footer}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
