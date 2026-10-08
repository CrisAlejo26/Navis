import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import { hexAlpha } from '@/lib/color';
import { useJournalTheme } from './journal-theme';

export function JournalCover({
    total,
    pending,
    thisMonth = 0,
}: {
    total: number;
    pending: number;
    thisMonth?: number;
}) {
    const { t } = useTranslation(),
        p = useJournalTheme();
    // A saturating trace shows activity without inventing a monthly target.
    const progress = thisMonth / (thisMonth + 5);
    return (
        <View style={{ gap: 12 }}>
            <Text
                accessibilityRole="header"
                className="font-sans-bold"
                style={{ color: p.ink, fontSize: 28, lineHeight: 38 }}
            >
                {t('journal.title')}
            </Text>
            <Text style={{ color: p.secondaryInk, fontSize: 14, lineHeight: 22 }}>
                {t('journal.lead', { total, pending })}
            </Text>
            <Svg
                accessible={false}
                width="100%"
                height={32}
                viewBox="0 0 400 32"
                preserveAspectRatio="none"
            >
                <Path
                    d="M0 16 C100 9 300 23 400 16"
                    fill="none"
                    stroke={hexAlpha(p.primary, 0.2)}
                    strokeWidth={1.5}
                />
                <Path
                    d="M0 21 C100 16 300 26 400 21"
                    fill="none"
                    stroke={hexAlpha(p.primary, 0.15)}
                    strokeWidth={1.5}
                />
                <Path
                    d="M0 16 C100 9 300 23 400 16"
                    fill="none"
                    stroke={p.link}
                    strokeWidth={1.5}
                    strokeDasharray={`${progress * 405} 405`}
                />
            </Svg>
        </View>
    );
}
