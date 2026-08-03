import { useTranslation } from 'react-i18next';

import { WeatherChip } from '@/components/home/weather-chip';
import { useSession } from '@/lib/auth-client';
import { formatLongDate } from '@/lib/format';
import { greetingKeyFor } from '@/lib/greeting';

/**
 * La cabecera del panel: a quién se saluda, qué día es y qué tiempo hace.
 *
 * Es lo primero que se lee al abrir la aplicación y por eso no es un titular
 * genérico: dice la hora del día en el saludo, la fecha entera —que en trabajo
 * pastoral se consulta más de lo que parece— y el tiempo de donde está quien
 * mira, que es lo que decide si la visita de esta tarde se hace o no.
 *
 * La hora se lee una vez al montar: el panel no es un reloj, y volver a pintarlo
 * cada minuto para cambiar «buenos días» por «buenas tardes» cuesta más de lo
 * que aporta.
 */
export function WelcomeHeader({ now = new Date() }: { now?: Date }) {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const name = session?.user.name?.split(' ')[0] ?? '';

  return (
    <header className="gap-3 sm:flex-row sm:items-end sm:justify-between flex flex-col">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">
          {name ? t(greetingKeyFor(now), { name }) : t('home.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground first-letter:uppercase">
          {formatLongDate(now)}
        </p>
      </div>

      <WeatherChip />
    </header>
  );
}
