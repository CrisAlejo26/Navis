import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import type { CustomTableWithColumns } from '@navis/shared';
import type { TableQuery } from '@/data/repos/table-query';
import { useTableExport } from '@/hooks/use-table-export';
import { ExportPoster } from '@/components/lists/export-poster';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';

export function TableExport({
    table,
    query,
    onClose,
}: {
    table: CustomTableWithColumns;
    query: TableQuery;
    onClose: () => void;
}) {
    const { t } = useTranslation(),
        {
            keys,
            setKeys,
            format,
            setFormat,
            busy,
            error,
            output,
            cancelExport,
            poster,
            send,
            passwordWarning,
            resolvePassword,
        } = useTableExport(table, query);
    return (
        <BottomSheet
            visible
            title={t('export.title')}
            onClose={() => {
                cancelExport();
                onClose();
            }}
        >
            {passwordWarning !== null ? (
                <View className="gap-4">
                    <Text className="font-sans text-base leading-6 text-foreground">
                        {t('tables.exportPasswordWarning', { count: passwordWarning })}
                    </Text>
                    <Button title={t('export.send')} onPress={() => resolvePassword(true)} />
                    <Button title={t('common.cancel')} variant="secondary" onPress={cancelExport} />
                </View>
            ) : (
                <View className="gap-3">
                    <Text className="font-sans text-muted-foreground">
                        {t('tables.mobile.exportScope')}
                    </Text>
                    <Select
                        label={t('export.format')}
                        value={format}
                        placeholder={t('export.format')}
                        options={[
                            { value: 'xlsx', label: t('export.xlsx') },
                            { value: 'pdf', label: t('export.pdf') },
                            { value: 'image', label: t('export.image') },
                            { value: 'markdown', label: t('export.markdown') },
                            { value: 'csv', label: t('export.csv') },
                        ]}
                        onChange={setFormat}
                        disabled={busy}
                    />
                    {table.columns.map((column) => (
                        <Checkbox
                            key={column.id}
                            label={column.label}
                            checked={keys.includes(column.key)}
                            disabled={busy}
                            onChange={(checked) =>
                                setKeys(
                                    checked
                                        ? [...keys, column.key]
                                        : keys.filter((key) => key !== column.key),
                                )
                            }
                        />
                    ))}
                    {error ? (
                        <FieldError
                            message={t(
                                error === 'image-too-long'
                                    ? 'tables.mobile.imageLimit'
                                    : error === 'empty-export'
                                      ? 'tables.mobile.exportEmpty'
                                      : 'export.failed',
                            )}
                        />
                    ) : null}
                    <Button
                        title={t('export.send')}
                        disabled={!keys.length}
                        loading={busy}
                        onPress={() => void send()}
                    />
                    {busy ? (
                        <Button title={t('common.cancel')} variant="link" onPress={cancelExport} />
                    ) : null}
                    {output && format === 'image' ? (
                        <View
                            style={{ position: 'absolute', left: -10000 }}
                            pointerEvents="none"
                            accessibilityElementsHidden
                        >
                            <ViewShot ref={poster} options={{ format: 'png', quality: 1 }}>
                                <ExportPoster table={output} pixelExact />
                            </ViewShot>
                        </View>
                    ) : null}
                </View>
            )}
        </BottomSheet>
    );
}
