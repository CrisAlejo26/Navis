import { useWeather } from '@navis/api-client';
import type { WeatherKind } from '@navis/shared';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

/** Un icono y un nombre por familia; mapas explícitos, sin claves al vuelo (Regla 2). */
const ICON: Record<WeatherKind, LucideIcon> = {
  clear: Sun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  showers: CloudRain,
  storm: CloudLightning,
};

const LABEL_KEY = {
  clear: 'weather.clear',
  cloudy: 'weather.cloudy',
  fog: 'weather.fog',
  drizzle: 'weather.drizzle',
  rain: 'weather.rain',
  snow: 'weather.snow',
  showers: 'weather.showers',
  storm: 'weather.storm',
} as const satisfies Record<WeatherKind, string>;

/**
 * El tiempo de la ciudad del perfil, en una línea.
 *
 * Si no hay ciudad puesta, en vez de desaparecer invita a ponerla: un hueco sin
 * explicación parece que algo se ha roto. Y si el proveedor no responde, no
 * enseña nada: el panel no es un parte meteorológico.
 */
export function WeatherChip() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useWeather(api);

  if (isLoading) return <Skeleton className="h-6 w-36" />;
  if (isError) return null;

  if (!data) {
    return (
      <Link
        to="/settings"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {t('weather.setCity')}
      </Link>
    );
  }

  const Icon = ICON[data.kind];
  // Un `kind` que no está en el mapa —proveedor caído, caché a medias— no es
  // motivo para tumbar todo el panel: mejor nada que un icono `undefined`
  // reventando el árbol entero (lo destapó el primer e2e que abre el panel
  // de verdad, RFC 0001).
  if (!Icon) return null;

  return (
    <p className="gap-2 text-sm flex items-center text-muted-foreground">
      <Icon size={18} aria-hidden className="shrink-0 text-primary" />
      <span className="font-medium text-foreground">{data.temperature} °C</span>
      <span aria-hidden>·</span>
      <span className="truncate">
        {t(LABEL_KEY[data.kind])} {t('weather.in', { city: data.city })}
      </span>
    </p>
  );
}
