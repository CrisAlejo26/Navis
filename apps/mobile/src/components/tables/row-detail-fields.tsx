import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Text, View } from 'react-native';
import type { CustomTableWithColumns, CustomTableRow } from '@navis/shared';
import { revealPassword } from '@/data/repos/table-rows-read';
import { useTableContext } from '@/hooks/use-tables';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field-error';
import { formatCell } from '@/lib/tables/format';
import { Icon } from '@/components/ui/icon';
import { RowValue, fieldIcons } from './row-value';

export function RowDetailFields({
    table,
    row,
}: {
    table: CustomTableWithColumns;
    row: CustomTableRow;
}) {
    const { t } = useTranslation(),
        { context, canEditRows } = useTableContext();
    const [revealed, setRevealed] = useState<Record<string, string>>({}),
        [failed, setFailed] = useState(false);
    const generation = useRef(0);
    useEffect(() => {
        const counter = generation;
        const subscription = AppState.addEventListener('change', () => {
            counter.current++;
            setRevealed({});
        });
        return () => {
            counter.current++;
            subscription.remove();
        };
    }, []);
    useEffect(() => {
        if (!Object.keys(revealed).length) return;
        const timeout = setTimeout(() => setRevealed({}), 15000);
        return () => clearTimeout(timeout);
    }, [revealed]);
    async function reveal(key: string) {
        const current = ++generation.current;
        try {
            const value = await revealPassword(context, table.id, row.id, key);
            if (current === generation.current) {
                setFailed(false);
                setRevealed({ [key]: value });
            }
        } catch {
            setFailed(true);
        }
    }
    return (
        <>
            {table.columns.map((column) => (
                <Card key={column.id} className="gap-3 rounded-3xl">
                    <View className="gap-2 flex-row items-center">
                        <Icon name={fieldIcons[column.type]} size="sm" />
                        <Text className="font-sans-medium text-xs flex-1 text-muted-foreground">
                            {column.label}
                        </Text>
                        {column.believerField && table.source === 'believers' ? (
                            <Icon
                                name="link-outline"
                                size="sm"
                                accessibilityLabel={t('tables.boundCellHint')}
                            />
                        ) : null}
                    </View>
                    {column.type === 'password' ? (
                        <Text className="font-sans-medium text-base text-foreground" selectable>
                            {revealed[column.key] ?? formatCell(column, row.data[column.key])}
                        </Text>
                    ) : (
                        <RowValue column={column} value={row.data[column.key]} />
                    )}
                    {column.type === 'password' && row.data[column.key] && canEditRows ? (
                        <Button
                            variant="link"
                            leadingIcon="eye-outline"
                            title={t('tables.reveal')}
                            onPress={() => void reveal(column.key)}
                        />
                    ) : null}
                    {column.type === 'url' &&
                    typeof row.data[column.key] === 'string' &&
                    /^https?:\/\//.test(String(row.data[column.key])) ? (
                        <Button
                            variant="link"
                            leadingIcon="open-outline"
                            title={t('tables.mobile.openLink')}
                            onPress={() =>
                                void Linking.openURL(String(row.data[column.key])).catch(() =>
                                    setFailed(true),
                                )
                            }
                        />
                    ) : null}
                </Card>
            ))}
            {failed ? <FieldError message={t('errors.generic')} /> : null}
        </>
    );
}
