import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { ACCENT_PALETTE } from '@navis/shared';
import type { LocalCongregation } from '@/data/repos/calendar-repo';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { cn } from '@/lib/cn';
import {
    useCreateCongregation,
    useDeleteCongregation,
    useUpdateCongregation,
} from '@/hooks/use-calendar';

interface CongregationFormSheetProps {
    /** La sede a editar; `undefined` es crear. */
    congregation?: LocalCongregation;
    onClose: () => void;
}

/**
 * Una sede es **un nombre y un color** (D11) — y una ciudad, opcional. Se
 * crea desde donde haga falta; su semana nace sembrada en todos los
 * calendarios (lo hace el repositorio).
 *
 * El cuerpo se monta **con `key`**: tocar el chip de otra sede mientras la
 * hoja ya está abierta cambia `congregation` sin desmontar el componente, y un
 * `useEffect` para copiarlo pisaba lo que se estaba escribiendo tras el primer
 * render (la misma solución que `BelieverFormSheet`).
 */
export function CongregationFormSheet({ congregation, onClose }: CongregationFormSheetProps) {
    return (
        <CongregationFormBody
            key={congregation?.id ?? 'new'}
            congregation={congregation}
            onClose={onClose}
        />
    );
}

function CongregationFormBody({ congregation, onClose }: CongregationFormSheetProps) {
    const { t } = useTranslation();
    const [name, setName] = useState(congregation?.name ?? '');
    const [city, setCity] = useState(congregation?.city ?? '');
    const [accent, setAccent] = useState<string>(congregation?.accent ?? ACCENT_PALETTE[0]);
    const crear = useCreateCongregation();
    const actualizar = useUpdateCongregation();
    const borrar = useDeleteCongregation();

    function guardar() {
        if (!name.trim()) return;
        if (congregation) {
            actualizar.mutate({ id: congregation.id, name, city, accent });
        } else {
            crear.mutate({ name, city, accent });
        }
        onClose();
    }

    return (
        <BottomSheet
            visible={Boolean(congregation) || congregation === undefined}
            onClose={onClose}
            title={congregation ? t('calendar.editCongregation') : t('calendar.addCongregation')}
        >
            <View className="gap-3">
                <TextField
                    label={t('calendar.congregationName')}
                    value={name}
                    onChangeText={setName}
                />
                <TextField
                    label={t('calendar.congregationCity')}
                    value={city}
                    onChangeText={setCity}
                />

                <View className="gap-1.5">
                    <Text className="text-sm font-sans-medium text-foreground">
                        {t('calendar.congregationColor')}
                    </Text>
                    <View className="gap-2 flex-row flex-wrap">
                        {ACCENT_PALETTE.map((hex) => (
                            <Pressable
                                key={hex}
                                accessibilityLabel={hex}
                                accessibilityState={{ selected: accent === hex }}
                                onPress={() => setAccent(hex)}
                                className={cn(
                                    'h-11 w-11 items-center justify-center rounded-lg border-2',
                                    accent === hex ? 'border-foreground' : 'border-transparent',
                                )}
                            >
                                <View
                                    className="h-6 w-6 rounded-full"
                                    style={{ backgroundColor: hex }}
                                />
                            </Pressable>
                        ))}
                    </View>
                </View>

                {congregation ? (
                    <Button
                        variant="ghost"
                        title={t('common.delete')}
                        onPress={() => {
                            borrar.mutate(congregation.id);
                            onClose();
                        }}
                    />
                ) : null}

                <Button
                    title={t('common.save')}
                    onPress={guardar}
                    loading={crear.isPending || actualizar.isPending}
                    disabled={!name.trim()}
                />
            </View>
        </BottomSheet>
    );
}
