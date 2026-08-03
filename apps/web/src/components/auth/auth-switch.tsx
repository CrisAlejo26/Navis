import { TextLink } from '@/components/ui/text-link';

/**
 * El pie de las pantallas de acceso: la pregunta y el enlace a la otra. Es el
 * mismo par en login y en alta, así que vive aquí y no copiado en las dos.
 */
export function AuthSwitch({
  question,
  to,
  action,
}: {
  question: string;
  to: string;
  action: string;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      {question} <TextLink to={to}>{action}</TextLink>
    </p>
  );
}
