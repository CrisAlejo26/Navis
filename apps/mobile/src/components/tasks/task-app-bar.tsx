import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppBar } from '@/components/ui/app-bar';
export function TaskAppBar({ title, date }: { title: string; date?: string }) {
    const { t } = useTranslation();
    return (
        <AppBar
            title={title}
            actions={[
                {
                    icon: 'repeat-outline',
                    label: t('tasks.series'),
                    onPress: () => router.push('/tasks/series'),
                },
                {
                    icon: 'pricetags-outline',
                    label: t('tasks.manageTags'),
                    onPress: () => router.push('/tasks/tags'),
                },
                {
                    icon: 'create-outline',
                    label: t('tasks.add'),
                    onPress: () => router.push({ pathname: '/tasks/edit', params: { date } }),
                },
            ]}
        />
    );
}
