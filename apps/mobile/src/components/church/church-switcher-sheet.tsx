import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ChurchList } from './church-list';

export function ChurchSwitcherSheet({
    visible,
    onClose,
}: {
    visible: boolean;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    return (
        <BottomSheet visible={visible} onClose={onClose} title={t('church.switch')}>
            {visible ? <ChurchList onClose={onClose} /> : null}
        </BottomSheet>
    );
}
