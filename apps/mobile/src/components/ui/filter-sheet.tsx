import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View, useWindowDimensions } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';

interface FilterSheetProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    onApply: () => void;
    /**
     * Con `onClear`, el pie ofrece «Quitar los filtros (n)» mientras haya
     * activos — el «Clear all» de Shopify «Manage filters» — y la cancelación
     * queda en la X o en el fondo, que cierran sin aplicar. Sin `onClear`,
     * el pie es el de siempre: Cancelar/Aplicar.
     */
    activeCount?: number;
    onClear?: () => void;
    children: ReactNode;
}

/**
 * Hoja de filtros — Fase 7 (Shopify «Manage filters», Monday.com «Advanced
 * Filters»): Cancelar/Aplicar abajo, los campos arriba. No es un componente
 * nuevo de verdad, es el orden en que se colocan los que ya existen —
 * `SearchField` (Fase 4), `DateRangePicker` (Fase 5), `Checkbox`/`RadioGroup`
 * (Fase 6)— pasados como `children` por quien la use, para no atarla a una
 * lista de filtros fija.
 */
export function FilterSheet({
    visible,
    onClose,
    title,
    onApply,
    activeCount,
    onClear,
    children,
}: FilterSheetProps) {
    const { t } = useTranslation();
    const { height } = useWindowDimensions();
    const hasActive = Boolean(onClear) && (activeCount ?? 0) > 0;

    return (
        <BottomSheet visible={visible} onClose={onClose} title={title}>
            <ScrollView
                style={{ maxHeight: height * 0.55 }}
                contentContainerClassName="gap-4"
                showsVerticalScrollIndicator={false}
            >
                {children}
            </ScrollView>
            <View className="gap-3 pt-2 flex-row">
                {hasActive ? (
                    <Button
                        title={t('common.clearFilters', { total: activeCount })}
                        variant="outline"
                        className="flex-1"
                        onPress={onClear}
                    />
                ) : (
                    <Button
                        title={t('common.cancel')}
                        variant="outline"
                        className="flex-1"
                        onPress={onClose}
                    />
                )}
                <Button
                    title={t('common.apply')}
                    className="flex-1"
                    onPress={() => {
                        onApply();
                        onClose();
                    }}
                />
            </View>
        </BottomSheet>
    );
}
