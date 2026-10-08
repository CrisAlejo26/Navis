import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ListSummary, ListViewer } from '@navis/shared';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ListPill } from './access-parts';

/** A qué listas llega el acceso, con su botón para cambiarlas, y el interruptor de activo. */
export function AccessListsCard({
    viewer,
    lists,
    busy,
    onChangeLists,
    onActive,
}: {
    viewer: ListViewer;
    lists: readonly ListSummary[];
    busy: boolean;
    onChangeLists: () => void;
    onActive: (active: boolean) => void;
}) {
    const { t } = useTranslation(),
        reached = lists.filter((one) => viewer.listIds.includes(one.id));
    return (
        <View className="gap-3 rounded-3xl p-4 bg-card">
            <Text className="font-sans-semibold text-xs text-muted-foreground uppercase">
                {t('lists.grantLists')}
            </Text>
            <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                {reached.map((list) => (
                    <ListPill key={list.id} list={list} />
                ))}
                {reached.length === 0 ? (
                    <Text className="text-sm text-muted-foreground">{t('lists.noLists')}</Text>
                ) : null}
            </View>
            <Button
                testID="access-lists"
                title={t('roles.accessChangeLists')}
                variant="outline"
                onPress={onChangeLists}
            />
            <Switch
                label={t('lists.active')}
                checked={viewer.isActive}
                disabled={busy}
                onChange={onActive}
            />
        </View>
    );
}
