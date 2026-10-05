import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { hexAlpha } from '@/lib/color';
import { useJournalPalette } from './journal-theme';

export function JournalCover({
    total,
    pending,
    compact = false,
}: {
    total: number;
    pending: number;
    compact?: boolean;
}) {
    const { t } = useTranslation(),
        p = useJournalPalette();
    if (compact)
        return (
            <View style={{ gap: 6 }}>
                <Text
                    accessibilityRole="header"
                    style={{ color: p.ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}
                >
                    {t('journal.title')}
                </Text>
                <Text style={{ color: p.secondaryInk, fontSize: 13, lineHeight: 21 }}>
                    {t('journal.lead', { total, pending })}
                </Text>
            </View>
        );
    return (
        <View
            style={{
                backgroundColor: p.surface,
                borderRadius: 28,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: p.line,
            }}
        >
            <View style={{ padding: 20, paddingBottom: 12, gap: 12 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                    }}
                >
                    <View style={{ flex: 1, gap: 8 }}>
                        <Text
                            style={{
                                color: p.primary,
                                fontSize: 11,
                                letterSpacing: 2,
                                fontWeight: '700',
                                textTransform: 'uppercase',
                            }}
                        >
                            {t('nav.journal')}
                        </Text>
                        <Text
                            accessibilityRole="header"
                            style={{
                                color: p.ink,
                                fontSize: 28,
                                fontWeight: '700',
                                letterSpacing: -1,
                                lineHeight: 34,
                            }}
                        >
                            {t('journal.title')}
                        </Text>
                    </View>
                    {!compact && (
                        <View
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                            style={{
                                width: 56,
                                height: 68,
                                borderRadius: 18,
                                backgroundColor: p.card,
                                borderWidth: 1,
                                borderColor: p.line,
                                transform: [{ rotate: '8deg' }],
                                padding: 10,
                                paddingLeft: 18,
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <View
                                style={{
                                    position: 'absolute',
                                    left: 10,
                                    top: 0,
                                    bottom: 0,
                                    width: 2,
                                    backgroundColor: hexAlpha(p.primary, 0.25),
                                }}
                            />
                            <Ionicons name="leaf-outline" size={26} color={p.primary} />
                            <View style={{ height: 2, borderRadius: 2, backgroundColor: p.line }} />
                            <View
                                style={{
                                    height: 2,
                                    width: '70%',
                                    borderRadius: 2,
                                    backgroundColor: p.line,
                                }}
                            />
                        </View>
                    )}
                </View>
                <Text style={{ color: p.secondaryInk, fontSize: 14, lineHeight: 22 }}>
                    {t('journal.lead', { total, pending })}
                </Text>
            </View>
            {!compact && (
                <Svg
                    accessible={false}
                    width="100%"
                    height={20}
                    viewBox="0 0 360 30"
                    preserveAspectRatio="none"
                >
                    <Path
                        d="M0 16C55 0 93 33 153 18S250 0 300 14S340 20 360 7V30H0Z"
                        fill={hexAlpha(p.primary, 0.08)}
                    />
                    <Path
                        d="M0 25C50 9 99 29 155 23S259 6 308 22S345 24 360 18V30H0Z"
                        fill={hexAlpha(p.primary, 0.12)}
                    />
                </Svg>
            )}
        </View>
    );
}
