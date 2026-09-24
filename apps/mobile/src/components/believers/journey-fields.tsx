import type { IsoDate } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { DatePicker } from '@/components/ui/date-picker';
import { TextField } from '@/components/ui/text-field';

export interface JourneyValues {
    arrivedAt: IsoDate | null;
    arrivalSite: string;
    bibleReadings: string;
    vivenciasReadings: string;
    bibleInstituteTimes: string;
}

interface JourneyFieldsProps {
    values: JourneyValues;
    onChange: (values: JourneyValues) => void;
}

/**
 * La trayectoria en la iglesia (RFC 0012): todo opcional, porque son datos
 * que se van completando con los años y una ficha a medias es lo normal, no
 * un error. Las lecturas son números: lo que no es cifra no entra.
 */
export function JourneyFields({ values, onChange }: JourneyFieldsProps) {
    const { t } = useTranslation();

    return (
        <View className="gap-4">
            <DatePicker
                label={t('believers.journey.arrivedLabel')}
                value={values.arrivedAt}
                placeholder={t('believers.journey.monthHint')}
                onChange={(day) => onChange({ ...values, arrivedAt: `${day.slice(0, 8)}01` })}
            />
            <TextField
                label={t('believers.journey.siteLabel')}
                value={values.arrivalSite}
                onChangeText={(text) => onChange({ ...values, arrivalSite: text })}
                placeholder={t('believers.journey.siteHint')}
                autoCapitalize="sentences"
            />
            <TextField
                label={t('believers.journey.bible')}
                value={values.bibleReadings}
                onChangeText={(text) => onChange({ ...values, bibleReadings: text })}
                keyboardType="number-pad"
                placeholder="0"
            />
            <TextField
                label={t('believers.journey.vivencias')}
                value={values.vivenciasReadings}
                onChangeText={(text) => onChange({ ...values, vivenciasReadings: text })}
                keyboardType="number-pad"
                placeholder="0"
            />
            <TextField
                label={t('believers.journey.institute')}
                value={values.bibleInstituteTimes}
                onChangeText={(text) => onChange({ ...values, bibleInstituteTimes: text })}
                keyboardType="number-pad"
                placeholder="0"
            />
        </View>
    );
}

/** Lo que viaja al repo: vacío es `null`, no cero — nadie ha dicho que haya leído cero veces. */
export function journeyInput(values: JourneyValues) {
    const number = (value: string) => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, 500) : null;
    };
    return {
        arrivedAt: values.arrivedAt,
        arrivalSite: values.arrivalSite.trim() || null,
        bibleReadings: number(values.bibleReadings),
        vivenciasReadings: number(values.vivenciasReadings),
        bibleInstituteTimes: number(values.bibleInstituteTimes),
    };
}
