import { greetingKeyFor } from '@navis/shared';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatNumber, formatShortDate } from '@/lib/format';
import { useLocalSession } from '@/stores/local-session';
import { findUser } from '@/data/repos/account-repo';
import { LogoBoat } from '@/components/home/logo-boat';

/**
 * El hero ilustrado del panel (RFC 0001, rediseño): la estampa náutica de
 * Navis — cielo degradado por la hora del saludo, olas en capas y el barco
 * del logo — con la cifra grande de creyentes encima, como la temperatura
 * del tiempo.
 *
 * La escena es **SVG propio** (react-native-svg), no una imagen: es la misma
 * familia vectorial plana de la estela de `ActivityCard` y se tiñe con la
 * hora sin mantener ficheros. Los degradados viven solo aquí, en la
 * ilustración — nunca como fondo de un control (Regla 9 §7).
 *
 * El barco es el del logo (`LogoBoat`), siempre en su sitio —tamaño y
 * emplazamiento fijos— y la hora le da el color: dorado como el sol de día,
 * plateado como la luna de noche. La escena acompaña: de día cielo alto,
 * disco cálido y olas claras; de noche azul de fondo, estrellas y luna.
 */

export type Scene = {
  sky: readonly [string, string, string];
  sea: readonly [string, string];
  /** Disco del sol o la luna; `crescent` recorta con el color del cielo. */
  disc: {
    cx: number;
    cy: number;
    r: number;
    fill: string;
    crescent?: boolean;
    /** Halo cálido alrededor del disco: solo de día, es la luz del sol. */
    halo?: string;
  };
  stars: boolean;
  boat: 'day' | 'night';
  /** La espuma bajo el barco: más luz de día que de noche. */
  espuma: number;
  /** La ola más cercana, la que entra por debajo de todo. */
  ola: string;
};

export const SCENES: Record<'morning' | 'afternoon' | 'evening', Scene> = {
  morning: {
    sky: ['#2a55d6', '#4d7bec', '#8fb4f2'],
    sea: ['#1e42b8', '#17358f'],
    disc: {
      cx: 296,
      cy: 86,
      r: 36,
      fill: 'rgba(255,224,150,0.75)',
      halo: 'rgba(255,224,150,0.25)',
    },
    stars: false,
    boat: 'day',
    espuma: 0.22,
    ola: '#122a75',
  },
  afternoon: {
    sky: ['#3a68e0', '#6b96ef', '#b4cdf7'],
    sea: ['#2450c8', '#1d44a8'],
    disc: {
      cx: 300,
      cy: 66,
      r: 30,
      fill: 'rgba(255,240,200,0.95)',
      halo: 'rgba(255,226,160,0.32)',
    },
    stars: false,
    boat: 'day',
    espuma: 0.26,
    ola: '#16348f',
  },
  evening: {
    sky: ['#050b26', '#0b1847', '#1c3d94'],
    sea: ['#0a1438', '#040a20'],
    disc: { cx: 84, cy: 74, r: 26, fill: '#dfe6f5', crescent: true },
    stars: true,
    boat: 'night',
    espuma: 0.08,
    ola: '#030818',
  },
};

const STARS: readonly (readonly [number, number])[] = [
  [42, 58],
  [96, 116],
  [148, 46],
  [214, 82],
  [258, 38],
  [334, 128],
];

/** El velero de la primera versión, ocultado pero a un gesto de volver. */
const LEGACY_BOAT_VISIBLE = false;

function SceneArt({ scene }: { scene: Scene }) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 375 320"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute' }}
    >
      {scene.disc.crescent ? (
        <>
          <Circle cx={scene.disc.cx} cy={scene.disc.cy} r={scene.disc.r} fill={scene.disc.fill} />
          <Circle
            cx={scene.disc.cx + scene.disc.r * 0.45}
            cy={scene.disc.cy - scene.disc.r * 0.3}
            r={scene.disc.r * 0.85}
            fill={scene.sky[0]}
          />
        </>
      ) : (
        <>
          {scene.disc.halo && (
            <Circle
              cx={scene.disc.cx}
              cy={scene.disc.cy}
              r={scene.disc.r * 1.9}
              fill={scene.disc.halo}
            />
          )}
          <Circle cx={scene.disc.cx} cy={scene.disc.cy} r={scene.disc.r} fill={scene.disc.fill} />
        </>
      )}

      {scene.stars &&
        STARS.map(([cx, cy]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.6} fill="white" fillOpacity={0.55} />
        ))}

      {/* Dos nubes suaves, solo de día: el cielo nocturno va limpio. */}
      {!scene.stars && (
        <G fillOpacity={0.14} fill="white">
          <Circle cx={92} cy={98} r={20} />
          <Circle cx={116} cy={104} r={14} />
          <Circle cx={318} cy={150} r={16} />
        </G>
      )}

      {/* El mar: tres capas de olas, de atrás hacia delante. */}
      <Path
        d="M0 196 C 60 186, 118 206, 187 196 C 256 186, 316 206, 375 196 L 375 320 L 0 320 Z"
        fill={scene.sea[0]}
      />
      <Path
        d="M0 226 C 70 214, 130 236, 187 226 C 254 216, 318 238, 375 226 L 375 320 L 0 320 Z"
        fill={scene.sea[1]}
        fillOpacity={0.85}
      />
      <Path
        d="M0 262 C 80 250, 140 272, 220 262 C 300 252, 340 268, 375 260 L 375 320 L 0 320 Z"
        fill={scene.ola}
      />

      {/* El barco del logo, del color de su astro: sol de día, luna de noche. */}
      <Ellipse cx={178} cy={274} rx={66} ry={5} fill="white" fillOpacity={scene.espuma} />
      <LogoBoat variant={scene.boat} />

      {/* El velero propio de la primera versión. Se **oculta**, no se borra:
          sigue siendo una buena pieza y `LEGACY_BOAT_VISIBLE` lo devuelve a
          la escena cuando se quiera alternar. */}
      {LEGACY_BOAT_VISIBLE && (
        <G>
          <Ellipse cx={178} cy={276} rx={54} ry={5} fill="white" fillOpacity={0.14} />
          <Path d="M180 162 L180 246" stroke="#0c1e4e" strokeWidth={2.5} strokeOpacity={0.4} />
          <Path d="M180 158 L195 163 L180 169 Z" fill="#f1bf5b" />
          <Path
            d="M176 168 L176 240 L132 240 Z"
            fill="#fdf6e6"
            stroke="#0c1e4e"
            strokeWidth={1.5}
            strokeOpacity={0.22}
          />
          <Path
            d="M184 178 L184 240 L216 236 Z"
            fill="#f3e2b8"
            fillOpacity={0.92}
            stroke="#0c1e4e"
            strokeWidth={1.5}
            strokeOpacity={0.22}
          />
          <Path
            d="M124 246 L232 246 L212 272 L144 272 Z"
            fill="#f6e8c8"
            stroke="#0c1e4e"
            strokeWidth={1.5}
            strokeOpacity={0.25}
          />
          <Path d="M124 246 L232 246 L227 254 L129 254 Z" fill="#0c1e4e" fillOpacity={0.18} />
        </G>
      )}
    </Svg>
  );
}

export function DashboardHero({
  total,
  newThisMonth,
  now = new Date(),
}: {
  total: number;
  newThisMonth: number;
  now?: Date;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const session = useLocalSession((state) => state.session);

  const { data: user } = useQuery({
    queryKey: ['local-user', session?.userId],
    queryFn: () => findUser(session!.userId),
    enabled: Boolean(session),
  });

  const name = user?.name.split(' ')[0] ?? '';
  const scene = SCENES[greetingKeyFor(now) as keyof typeof SCENES] ?? SCENES.morning;

  return (
    <View style={{ height: 300 + insets.top }}>
      <LinearGradient colors={[...scene.sky]} style={{ position: 'absolute', inset: 0 }} />
      <SceneArt scene={scene} />

      <View
        className="gap-4 px-5 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View
          className="px-4 py-2 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
        >
          <Text className="text-sm font-medium text-white" numberOfLines={1}>
            {name ? t(greetingKeyFor(now), { name }) : t('home.title')}
          </Text>
        </View>
        <View
          className="px-3.5 py-2 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
        >
          <Text className="text-sm text-white">
            {formatShortDate(now).charAt(0).toUpperCase() + formatShortDate(now).slice(1)}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/believers')}
        className="gap-1 px-5 pt-14 active:opacity-80"
        accessibilityLabel={t('home.believersLink')}
      >
        <Text className="text-5xl font-sans-semibold text-white tabular-nums">
          {formatNumber(total)}
        </Text>
        <View className="gap-0.5">
          <Text className="text-base font-medium text-white">{t('home.believers')}</Text>
          <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {t('home.newThisMonth', { count: newThisMonth })}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
