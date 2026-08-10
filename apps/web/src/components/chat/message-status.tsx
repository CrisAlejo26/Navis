import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

export type MessageStatusState = 'delivered' | 'read';

/**
 * La estela: el elemento firma de la pantalla (RFC 0016 §5). En vez de los
 * dos ganchitos gris/azul que copia todo el mundo, el estado de un mensaje
 * propio es una línea corta bajo la hora — a la mitad al entregarse, llena y
 * en `text-primary` al leerse — animada con `scaleX()`, como la Sonda de
 * creyentes (`components/believers/sonda.tsx`).
 *
 * La pista va `aria-hidden` —es la representación, no el dato— y lo que lee
 * un lector de pantalla es la frase completa, como en la Sonda (Regla 9 §5:
 * el color nunca informa solo). `prefers-reduced-motion` ya apaga la
 * transición a nivel global (`global.css`).
 */
export function MessageStatus({ state, time }: { state: MessageStatusState; time: string }) {
  const { t } = useTranslation();

  return (
    <span className="inline-flex items-center">
      <span
        aria-hidden
        className="w-6 inline-block h-[3px] shrink-0 overflow-hidden rounded-full bg-muted"
      >
        <span
          className={cn(
            'ease-out block h-full w-full origin-left rounded-full transition-transform duration-300',
            state === 'read' ? 'scale-x-100 bg-primary' : 'scale-x-50 bg-muted-foreground/60',
          )}
        />
      </span>
      <span className="sr-only">
        {state === 'read' ? t('communications.readAt', { time }) : t('communications.deliveredAt')}
      </span>
    </span>
  );
}
