import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { listCover, saveListCover } from '@/data/repos/list-cover';
import { listsKey, useListContext, useListMutation } from '@/hooks/use-lists';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';

export function CoverField({ id }: { id: string }) {
    const { t } = useTranslation();
    const [pickError, setPickError] = useState(false);
    const { context, enabled } = useListContext();
    const cover = useQuery({
        queryKey: [...listsKey(context), id, 'cover'],
        queryFn: () => listCover(context, id),
        enabled,
    });
    const save = useListMutation((scope, uri: string | null) => saveListCover(scope, id, uri));
    async function pick() {
        setPickError(false);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) await save.mutateAsync(result.assets[0].uri);
        } catch {
            setPickError(true);
        }
    }
    return (
        <View className="gap-2">
            {cover.data ? (
                <Image
                    source={{ uri: cover.data }}
                    accessibilityLabel={t('lists.cover')}
                    style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }}
                />
            ) : null}
            <Button
                title={t('lists.cover')}
                variant="secondary"
                loading={save.isPending}
                onPress={() => void pick()}
            />
            {cover.data ? (
                <Button
                    title={t('lists.removeCover')}
                    variant="ghost"
                    disabled={save.isPending}
                    onPress={() => save.mutate(null)}
                />
            ) : null}
            {pickError || save.isError || cover.isError ? (
                <FieldError message={t('lists.saveFailed')} />
            ) : null}
        </View>
    );
}
