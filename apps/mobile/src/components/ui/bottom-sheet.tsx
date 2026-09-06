import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';
import Animated, { SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/icon-button';
import { Title } from '@/components/ui/title';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Hoja inferior genérica — Fase 5. Sale de aquí porque `Select`, `DatePicker`
 * y `DateRangePicker` la necesitan los tres; la Fase 13 la reutiliza para lo
 * suyo en vez de montar otra (Regla 1 §5: a la segunda vez ya se comparte).
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          className="inset-0 bg-black absolute opacity-50"
        />
        <Animated.View
          entering={reducedMotion ? undefined : SlideInDown.duration(220).springify().damping(18)}
          className="gap-3 px-4 pt-4 rounded-t-xl bg-card"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {title ? (
            <View className="flex-row items-center justify-between">
              <Title size="md">{title}</Title>
              <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={onClose} />
            </View>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
