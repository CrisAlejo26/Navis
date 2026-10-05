import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { FieldButton } from '@/components/ui/field-button';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState } from '@/components/ui/empty-state';
import { mobileTaskIcons, taskIcon } from '@/lib/tasks/icon-map';
import { useSheetBodyMaxHeight } from '@/lib/ui/keyboard';
import { useTaskPalette } from './task-theme';
import { hexAlpha, readableAccent } from '@/lib/color';
const labelKey = (key: string) =>
    `tasks.icons.${key.replace(/-([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase())}`;
export function TagIconPicker({
    value,
    accent,
    onChange,
    disabled,
}: {
    value: string;
    accent: string;
    onChange: (icon: string) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false),
        [search, setSearch] = useState('');
    const { t } = useTranslation(),
        p = useTaskPalette(),
        maxHeight = useSheetBodyMaxHeight(0.5);
    const color = p.accent(accent),
        ink = readableAccent(color, p.card, p.foreground);
    const fold = (value: string) =>
        value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    const filtered = mobileTaskIcons.filter((entry) =>
        fold(`${t(labelKey(entry.key))} ${t(`tasks.icons.categories.${entry.category}`)}`).includes(
            fold(search.trim()),
        ),
    );
    return (
        <>
            <FieldButton
                label={t('tasks.tagIcon')}
                value={t(labelKey(value))}
                icon={taskIcon(value)}
                placeholder={t('tasks.tagIcon')}
                disabled={disabled}
                onPress={() => {
                    setSearch('');
                    setOpen(true);
                }}
            />
            <BottomSheet
                visible={open}
                title={t('tasks.tagIcon')}
                scrollable={false}
                onClose={() => setOpen(false)}
            >
                <View className="gap-3">
                    <SearchField
                        value={search}
                        onChangeText={setSearch}
                        placeholder={t('tasks.searchIcons')}
                    />
                    <FlatList
                        data={filtered}
                        numColumns={5}
                        keyExtractor={(item) => item.key}
                        style={{ height: maxHeight }}
                        contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
                        columnWrapperStyle={{ gap: 8 }}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={<EmptyState title={t('tasks.noIconResults')} />}
                        renderItem={({ item }) => (
                            <Pressable
                                accessibilityRole="radio"
                                accessibilityLabel={t(labelKey(item.key))}
                                accessibilityState={{ selected: item.key === value }}
                                onPress={() => {
                                    onChange(item.key);
                                    setOpen(false);
                                }}
                                style={{
                                    flex: 1,
                                    minHeight: 48,
                                    maxWidth: '20%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 15,
                                    backgroundColor: hexAlpha(color, 0.12),
                                    borderWidth: 1.5,
                                    borderColor: item.key === value ? p.primary : 'transparent',
                                }}
                            >
                                <Ionicons name={item.icon} size={24} color={ink} aria-hidden />
                            </Pressable>
                        )}
                    />
                </View>
            </BottomSheet>
        </>
    );
}
