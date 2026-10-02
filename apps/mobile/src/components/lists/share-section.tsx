import type { List } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useListExport } from '@/hooks/use-list-export';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { FieldError } from '@/components/ui/field-error';
import { ExportFields } from './export-fields';
import { ExportPoster } from './export-poster';
import { ExportPreview } from './export-preview';
import { ViewersSection } from './viewers-section';

const FORMATS = [
    { value: 'xlsx', key: 'export.xlsx' },
    { value: 'pdf', key: 'export.pdf' },
    { value: 'image', key: 'export.image' },
    { value: 'markdown', key: 'export.markdown' },
    { value: 'csv', key: 'export.csv' },
] as const;
export function ShareSection({
    list,
    canShare,
    bottom,
}: {
    list: List;
    canShare: boolean;
    bottom: number;
}) {
    const { t } = useTranslation();
    const {
        fields,
        setFields,
        format,
        setFormat,
        busy,
        error,
        members,
        assets,
        poster,
        table,
        imageTooLong,
        send,
    } = useListExport(list, canShare);
    return (
        <ScrollView contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: bottom }}>
            <Text className="text-sm text-muted-foreground">{t('lists.localShareHint')}</Text>
            {canShare ? (
                <>
                    <ViewersSection list={list} />
                    <Text className="text-lg font-sans-semibold text-foreground">
                        {t('lists.exportFields')}
                    </Text>
                    <ExportFields
                        fields={fields}
                        onChange={setFields}
                        disabled={busy}
                        preview={
                            <ExportPreview
                                table={table}
                                showPhotos={
                                    fields.photo && (format === 'image' || format === 'pdf')
                                }
                            />
                        }
                    />
                    {fields.photo ? (
                        <Text className="text-sm text-muted-foreground">
                            {t('lists.exportPhotosHint')}
                        </Text>
                    ) : null}
                    <View className="gap-2 flex-row flex-wrap">
                        {FORMATS.map((one) => (
                            <Chip
                                key={one.value}
                                label={t(one.key)}
                                selected={format === one.value}
                                disabled={busy}
                                onPress={() => setFormat(one.value)}
                            />
                        ))}
                    </View>
                    <Text className="text-sm text-muted-foreground">
                        {t('lists.people', { count: table.rows.length })}
                    </Text>
                    {format === 'image' && imageTooLong ? (
                        <Text className="text-warning">{t('export.imageTooLong')}</Text>
                    ) : null}
                    {error || members.isError || assets.isError ? (
                        <FieldError message={t('lists.downloadFailed')} />
                    ) : null}
                    <Button
                        title={t('export.send')}
                        leadingIcon="share-outline"
                        loading={busy}
                        disabled={
                            members.isPending ||
                            members.isError ||
                            assets.isPending ||
                            assets.isError ||
                            !table.rows.length ||
                            (format === 'image' && imageTooLong)
                        }
                        onPress={() => void send()}
                    />
                    {format === 'image' && !imageTooLong ? (
                        <View
                            pointerEvents="none"
                            style={{ position: 'absolute', left: -9999, top: 0 }}
                        >
                            <ViewShot ref={poster} options={{ format: 'png', quality: 1 }}>
                                <ExportPoster table={table} />
                            </ViewShot>
                        </View>
                    ) : null}
                </>
            ) : null}
        </ScrollView>
    );
}
