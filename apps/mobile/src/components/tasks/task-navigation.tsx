import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { RunningTimerBar } from './running-timer-bar';

const destinations = { today: '/tasks', list: '/tasks/list', stats: '/tasks/stats' } as const;
export function TaskNavigation({ active }: { active: keyof typeof destinations }) {
    const { t } = useTranslation();
    return (
        <View
            style={{
                paddingHorizontal: 22,
                paddingBottom: 12,
                width: '100%',
                maxWidth: 480,
                alignSelf: 'center',
            }}
        >
            <SegmentedControl
                value={active}
                onChange={(value) => router.replace(destinations[value])}
                options={(['today', 'list', 'stats'] as const).map((value) => ({
                    value,
                    label: t(`tasks.${value}`),
                }))}
            />
            <RunningTimerBar />
        </View>
    );
}
