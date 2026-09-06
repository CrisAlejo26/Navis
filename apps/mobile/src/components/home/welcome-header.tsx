import { greetingKeyFor } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { formatLongDate } from '@/lib/format';
import { useSession } from '@/lib/auth-client';

/**
 * La cabecera del panel: a quién se saluda y qué día es (RFC 0001). Espejo de
 * `WelcomeHeader` de la web, sin el chip del tiempo: no hay geolocalización
 * cableada en móvil todavía, y no es lo que pide esta pantalla (Regla 1 §5).
 *
 * La hora se lee una vez al montar, como en la web: el panel no es un reloj.
 */
export function WelcomeHeader({ now = new Date() }: { now?: Date }) {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const name = session?.user.name?.split(' ')[0] ?? '';
  // `formatLongDate` sale en minúscula (el nombre del día, en varios de los
  // seis idiomas): en web era CSS (`first-letter:uppercase`); aquí no hay
  // pseudo-elemento, así que se sube a mano la primera letra.
  const date = formatLongDate(now);
  const dateCapitalized = date.charAt(0).toUpperCase() + date.slice(1);

  return (
    <View className="gap-1">
      <Text className="text-2xl font-semibold text-foreground">
        {name ? t(greetingKeyFor(now), { name }) : t('home.title')}
      </Text>
      <Text className="text-sm text-muted-foreground">{dateCapitalized}</Text>
    </View>
  );
}
