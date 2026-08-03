import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

/**
 * Los mensajes, en el orden de una salida: se desatraca, se navega y se avista
 * tierra. Van en este orden a propósito, no al azar.
 */
const MESSAGES = [
  'loading.charts',
  'loading.wind',
  'loading.anchor',
  'loading.course',
  'loading.logbook',
  'loading.crew',
  'loading.helm',
  'loading.tide',
  'loading.sails',
  'loading.land',
] as const;

/** Cuánto se queda cada mensaje antes de dar paso al siguiente. */
const MESSAGE_MS = 2400;

/** Los mensajes de espera, uno detrás de otro, con un fundido entre ellos. */
export function LoadingMessage({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % MESSAGES.length);
    }, MESSAGE_MS);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // La `key` es lo que hace que el fundido se repita en cada mensaje: sin
  // ella React reutiliza el nodo y la animación no vuelve a lanzarse.
  return (
    <p key={index} className={cn('text-sm animate-rise-in', className)}>
      {t(MESSAGES[index] ?? MESSAGES[0])}
    </p>
  );
}
