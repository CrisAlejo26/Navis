import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

import { themeColorsHex } from '@navis/theme';

import { Icon } from '@/components/ui/icon';
import { useThemeStore } from '@/lib/theme';

const BOX = 56;

/**
 * El campo de fotografía del formulario (la pareja de `photo-field` de la
 * web): un círculo con la vista previa —o un hueco con su icono— y dos
 * acciones de texto, subir y quitar. La imagen se elige de la galería, ya
 * recortada a cuadrado por el propio selector, que es como se verá: redonda.
 *
 * El campo solo mueve URIs: copiar el fichero a su sitio definitivo lo hace
 * el repositorio al guardar, y así «Cancelar» en la hoja no deja ficheros.
 */
export function PhotoField({
    uri,
    onChange,
}: {
    uri: string | null;
    onChange: (uri: string | null) => void;
}) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];

    async function pick() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        if (asset) onChange(asset.uri);
    }

    const label = uri ? t('believers.photoChange') : t('believers.photoAdd');

    return (
        <View className="gap-3 flex-row items-center">
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={() => void pick()}
                className="items-center justify-center overflow-hidden rounded-full active:opacity-80"
                style={{ width: BOX, height: BOX, backgroundColor: palette.muted }}
            >
                {uri ? (
                    <Image
                        source={{ uri }}
                        style={{ width: BOX, height: BOX }}
                        resizeMode="cover"
                    />
                ) : (
                    <Icon name="image-outline" size="md" tone="primary" />
                )}
            </Pressable>

            <View className="gap-0.5 flex-1">
                <Text className="text-sm font-sans-medium text-foreground">
                    {t('believers.photo')}
                </Text>
                <Text className="text-xs text-muted-foreground">{t('believers.photoHint')}</Text>
                <View className="gap-4 mt-0.5 flex-row items-center">
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        onPress={() => void pick()}
                        className="active:opacity-70"
                    >
                        <Text
                            className="text-sm font-sans-medium"
                            style={{ color: palette.primary }}
                        >
                            {label}
                        </Text>
                    </Pressable>
                    {uri ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('believers.photoRemove')}
                            onPress={() => onChange(null)}
                            className="active:opacity-70"
                        >
                            <Text
                                className="text-sm font-sans-medium"
                                style={{ color: palette.destructive }}
                            >
                                {t('believers.photoRemove')}
                            </Text>
                        </Pressable>
                    ) : null}
                </View>
            </View>
        </View>
    );
}
