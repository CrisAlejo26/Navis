import { Ionicons } from '@expo/vector-icons';
import { NOTE_KIND_ACCENTS } from '@navis/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { NOTE_KIND_ICONS } from '@/components/believers/note-kind-icons';
import { AppBar } from '@/components/ui/app-bar';
import type { LocalNote } from '@/data/repos/notes-repo';
import { hexShade } from '@/lib/color';
import { formatDay, formatMonthShort } from '@/lib/format';

/**
 * La cabecera de una nota: un degradado **del color de su tipo** —el mismo
 * acento de la tarjeta de la bitácora, hundido hacia el fondo para que el
 * texto blanco cumpla contraste— y, como firma, la **placa de la fecha**: el
 * día en grande, el mes y el año, al modo de las entradas de Lake. Al lado, el
 * tipo escrito (el color nunca informa solo) y de quién es la nota.
 */
export function NoteHero({ note, believerName }: { note: LocalNote; believerName: string }) {
    const { t } = useTranslation();
    const accent = NOTE_KIND_ACCENTS[note.kind];
    const date = new Date(`${note.occurredAt.slice(0, 10)}T00:00:00Z`);

    return (
        <View className="rounded-b-3xl overflow-hidden">
            <LinearGradient colors={[hexShade(accent, 0.8), hexShade(accent, 0.42)]}>
                <AppBar onScene title="" />
                <View
                    className="gap-4 px-5 pb-6 flex-row items-center"
                    accessibilityLabel={`${t(`notes.kinds.${note.kind}`)} · ${formatDay(note.occurredAt)}`}
                >
                    <View className="w-20 py-3 rounded-2xl bg-white/20 items-center">
                        <Text className="text-4xl leading-10 font-sans-bold text-white tabular-nums">
                            {note.occurredAt.slice(8, 10).replace(/^0/, '')}
                        </Text>
                        <Text className="text-xs tracking-widest font-sans-semibold text-white uppercase">
                            {formatMonthShort(date)}
                        </Text>
                        <Text className="text-white/80 text-[11px] tabular-nums">
                            {note.occurredAt.slice(0, 4)}
                        </Text>
                    </View>
                    <View className="gap-1.5 min-w-0 flex-1">
                        <View className="gap-1.5 px-2.5 py-1 bg-white/20 flex-row items-center self-start rounded-full">
                            <Ionicons
                                name={NOTE_KIND_ICONS[note.kind]}
                                size={13}
                                color="#fff"
                                aria-hidden
                            />
                            <Text className="text-xs font-sans-semibold text-white">
                                {t(`notes.kinds.${note.kind}`)}
                                {note.giftName ? ` · ${note.giftName}` : ''}
                            </Text>
                        </View>
                        <Text className="text-2xl font-sans-bold text-white" numberOfLines={2}>
                            {believerName}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}
