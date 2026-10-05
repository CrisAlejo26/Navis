import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { CustomTableWithColumns } from '@navis/shared';
import type { ViewState } from '@/lib/tables/view-state';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Checkbox } from '@/components/ui/checkbox';

export function PresentationSheet({
    table,
    state,
    onChange,
    onClose,
}: {
    table: CustomTableWithColumns;
    state: ViewState;
    onChange: (patch: Partial<ViewState>) => void;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    return (
        <BottomSheet visible onClose={onClose} title={t('tables.columns')}>
            <View className="gap-3">
                {table.columns.map((column) => (
                    <Checkbox
                        key={column.id}
                        label={column.label}
                        checked={!state.hidden.includes(column.key)}
                        onChange={(checked) =>
                            onChange({
                                hidden: checked
                                    ? state.hidden.filter((key) => key !== column.key)
                                    : [...state.hidden, column.key],
                            })
                        }
                    />
                ))}
            </View>
        </BottomSheet>
    );
}
