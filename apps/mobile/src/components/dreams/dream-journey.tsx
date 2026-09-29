import { daysBetween } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { LocalDream } from '@/data/repos/dreams-repo';
import { formatDay } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';

/**
 * **El recorrido** (RFC 0005 §7.6, la cuarta lectura): un filete vertical que
 * enhebra lo que ha pasado con el sueño — lo soñaste, le buscaste sentido, pasó
 * — y cuándo. Es la misma primitiva que el hilo de cumplimientos de profecías:
 * el filete cae por el centro del margen y cada hito es un punto, relleno si
 * ya ocurrió y vacío si todavía no. El estado no depende del color: cada hito
 * lleva su texto (Regla 3 §7).
 */
export function DreamJourney({ dream }: { dream: LocalDream }) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const interpreted = Boolean(dream.interpretation?.trim());

    const steps = [
        { done: true, title: t('dreams.journey.dreamed'), note: formatDay(dream.dreamedAt) },
        {
            done: interpreted,
            title: t('dreams.journey.interpreted'),
            note: interpreted ? undefined : t('dreams.journey.pending'),
        },
        {
            done: dream.fulfilledAt !== null,
            title: t('dreams.journey.fulfilled'),
            note: dream.fulfilledAt
                ? `${formatDay(dream.fulfilledAt)} · ${t('dreams.journey.after', {
                      days: daysBetween(dream.dreamedAt, dream.fulfilledAt),
                  })}`
                : t('dreams.journey.pending'),
        },
    ];

    return (
        <View className="p-4 rounded-2xl border bg-card">
            {steps.map((step, index) => (
                <View key={step.title} className="gap-3 flex-row">
                    <View className="items-center">
                        <View
                            className="size-3 mt-1 rounded-full"
                            style={{
                                backgroundColor: step.done ? palette.primary : 'transparent',
                                borderWidth: 2,
                                borderColor: step.done ? palette.primary : palette.border,
                            }}
                        />
                        {index < steps.length - 1 ? (
                            <View
                                className="w-0.5 flex-1"
                                style={{
                                    backgroundColor: step.done ? palette.primary : palette.border,
                                }}
                            />
                        ) : null}
                    </View>
                    <View className="gap-0.5 pb-5 min-w-0 flex-1">
                        <Text className="text-base font-sans-semibold text-foreground">
                            {step.title}
                        </Text>
                        {step.note ? (
                            <Text className="text-sm text-muted-foreground">{step.note}</Text>
                        ) : null}
                    </View>
                </View>
            ))}
        </View>
    );
}
