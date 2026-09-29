import type { DreamNight } from '@navis/shared';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatDay, initialOf } from '@/lib/format';

const WEEK = 7;
/** Opacidad del blanco según la noche: 0, 1, 2 y 3 o más sueños. */
const ON_SCENE = [0.14, 0.4, 0.68, 0.95];

/**
 * **La franja de noches**, la firma de la portada (RFC 0005 D19): doce columnas
 * —una por semana— de siete celdas, teñidas según lo que se soñó esa noche.
 * Va dentro de la escena azul, así que las celdas son blancas con distinta
 * opacidad, y la intensidad **no informa sola** (Regla 3 §7): cada celda lleva
 * su etiqueta accesible con la fecha y el número, y abre el listado de esa
 * noche (D16).
 */
export function NightsStrip({ nights }: { nights: readonly DreamNight[] }) {
    const { t } = useTranslation();
    const columns: DreamNight[][] = [];
    for (let index = 0; index < nights.length; index += WEEK) {
        columns.push(nights.slice(index, index + WEEK));
    }
    const firstColumn = columns[0] ?? [];

    return (
        <View className="gap-2 px-4 pb-8">
            <Text className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                {t('dreams.nights')}
            </Text>
            {/* Una fila por día de la semana, con su inicial delante: la etiqueta y las
          doce celdas comparten fila, así que no pueden desalinearse. */}
            <View className="gap-1">
                {(columns[0] ?? []).map((first, row) => (
                    <View key={first.day} className="gap-1 flex-row items-center">
                        <Text
                            aria-hidden
                            className="w-3 text-center text-[10px]"
                            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                            {initialOf(new Date(`${first.day}T00:00:00Z`), 'weekday')}
                        </Text>
                        {columns.map((column) => {
                            const night = column[row];
                            return night ? (
                                <Pressable
                                    key={night.day}
                                    accessibilityRole="button"
                                    accessibilityLabel={t('dreams.nightLabel', {
                                        date: formatDay(night.day),
                                        total: night.count,
                                    })}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/dreams/list',
                                            params: { from: night.day, to: night.day },
                                        })
                                    }
                                    className="flex-1 rounded-[4px] active:opacity-70"
                                    style={{
                                        aspectRatio: 1,
                                        backgroundColor: `rgba(255, 255, 255, ${String(ON_SCENE[Math.min(night.count, ON_SCENE.length - 1)])})`,
                                    }}
                                />
                            ) : null;
                        })}
                    </View>
                ))}
            </View>
        </View>
    );
}
