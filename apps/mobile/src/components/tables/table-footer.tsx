import { useTranslation } from 'react-i18next';
import { View, useWindowDimensions } from 'react-native';
import { useTableContext } from '@/hooks/use-tables';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { Button } from '@/components/ui/button';
export function TableFooter({
    linked,
    onCreate,
    onExport,
}: {
    linked: boolean;
    onCreate: () => void;
    onExport: () => void;
}) {
    const { t } = useTranslation(),
        scope = useTableContext(),
        bottom = usePageBottomPadding();
    const { height, fontScale } = useWindowDimensions();
    const compact = height < 500 || fontScale >= 1.6;
    return (
        <View
            className={
                compact
                    ? 'px-4 pt-2 gap-2 flex-row items-center border-t border-border'
                    : 'px-4 pt-2 gap-2 border-t border-border'
            }
            style={{ paddingBottom: bottom }}
        >
            {scope.canEditRows ? (
                <Button
                    size={compact ? 'md' : 'lg'}
                    className={compact ? 'flex-1' : undefined}
                    leadingIcon="add"
                    title={t(linked ? 'tables.addBelievers' : 'tables.newRow')}
                    onPress={onCreate}
                />
            ) : null}
            {scope.canExport ? (
                <Button variant="link" title={t('export.title')} onPress={onExport} />
            ) : null}
        </View>
    );
}
