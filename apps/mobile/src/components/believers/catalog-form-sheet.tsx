import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';

/**
 * La hoja de alta/edición de una entrada de catálogo (dones, labores,
 * etiquetas): un solo campo de nombre, porque el color lo reparte la paleta.
 * La validación mínima y el error de duplicado los cuenta quien la usa.
 */
export function CatalogFormSheet({
  visible,
  onClose,
  title,
  nameLabel,
  initialName = '',
  error,
  saving = false,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  nameLabel: string;
  initialName?: string;
  error?: string | null;
  saving?: boolean;
  onSave: (name: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View className="gap-4">
        <TextField
          label={nameLabel}
          value={name}
          onChangeText={setName}
          error={error ?? undefined}
          autoFocus
        />
        <Button
          title={t('common.save')}
          loading={saving}
          onPress={() => {
            void onSave(name.trim()).then(onClose);
          }}
        />
      </View>
    </BottomSheet>
  );
}
