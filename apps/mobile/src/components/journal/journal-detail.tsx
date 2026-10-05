import { useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import ViewShot, { captureRef, type ViewShotRef } from 'react-native-view-shot';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { File } from 'expo-file-system';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { journalReminderLabel } from './journal-reminder-label';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useJournalEntry, useJournalMutation } from '@/hooks/use-journal';
import { useListContext } from '@/hooks/use-lists';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { deleteJournalEntry, updateJournalEntry } from '@/data/repos/journal-repo';
import { deleteJournalAudio } from '@/data/repos/journal-audios';
import { shareJournalEntries } from '@/lib/journal/export';
import { formatDay } from '@/lib/format';
import { JournalForm } from './journal-form';
import { JournalAudio } from './journal-audio';
import { KIND_ICON, kindColor, useJournalPalette } from './journal-theme';

export function JournalDetail({ id }: { id: string }) {
    const { t } = useTranslation(),
        p = useJournalPalette(),
        padding = usePageBottomPadding();
    const scope = useListContext(),
        result = useJournalEntry(id),
        entry = result.data;
    const [actionsOpen, setActionsOpen] = useState(false);
    const [editing, setEditing] = useState(false),
        [error, setError] = useState<string | null>(null),
        [sharing, setSharing] = useState(false);
    const shot = useRef<ViewShotRef>(null);
    const remove = useJournalMutation(deleteJournalEntry);
    const update = useJournalMutation((context, done: boolean) =>
        updateJournalEntry(context, id, { remindDone: done }),
    );
    const audio = useJournalMutation((context, audioId: string) =>
        deleteJournalAudio(context, id, audioId),
    );
    async function share(image = false) {
        setSharing(true);
        setError(null);
        try {
            if (!image) await shareJournalEntries(scope.context, [id], false);
            else {
                if (!(await isAvailableAsync())) throw new Error('sharing-unavailable');
                const uri = await captureRef(shot, { format: 'png', quality: 1 });
                try {
                    await shareAsync(uri, { mimeType: 'image/png', dialogTitle: entry?.title });
                } finally {
                    const file = new File(uri);
                    if (file.exists) file.delete();
                }
            }
        } catch {
            setError(t('export.failed'));
        } finally {
            setSharing(false);
        }
    }
    function confirmDelete() {
        Alert.alert(t('journal.deleteTitle', { title: entry?.title }), t('journal.deleteBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'),
                style: 'destructive',
                onPress: () => {
                    void remove
                        .mutateAsync(id)
                        .then(() => router.replace('/journal/list'))
                        .catch(() => setError(t('errors.generic')));
                },
            },
        ]);
    }
    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <AppBar
                title={t('nav.journal')}
                transparent
                actions={
                    entry && scope.canManage
                        ? [
                              {
                                  icon: 'create-outline',
                                  label: t('journal.edit'),
                                  onPress: () => setEditing(true),
                              },
                              {
                                  icon: 'ellipsis-horizontal',
                                  label: t('journal.mobile.actions'),
                                  onPress: () => setActionsOpen(true),
                              },
                          ]
                        : []
                }
            />
            {!entry ? (
                result.isPending ? (
                    <Text style={{ padding: 24, color: p.secondaryInk }}>
                        {t('common.loading')}
                    </Text>
                ) : (
                    <EmptyState
                        icon="document-text-outline"
                        title={t('errors.notFound')}
                        action={{ label: t('common.retry'), onPress: () => void result.refetch() }}
                    />
                )
            ) : (
                <ScrollView
                    contentContainerStyle={{
                        padding: 24,
                        paddingBottom: padding,
                        gap: 20,
                        width: '100%',
                        maxWidth: 720,
                        alignSelf: 'center',
                    }}
                >
                    <ViewShot
                        ref={shot}
                        options={{ format: 'png', quality: 1 }}
                        style={{ backgroundColor: p.background }}
                    >
                        <View style={{ gap: 24, padding: 8 }}>
                            <View
                                style={{
                                    gap: 16,
                                    padding: 20,
                                    borderRadius: 24,
                                    backgroundColor: p.surface,
                                }}
                            >
                                <View
                                    style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}
                                >
                                    <Ionicons
                                        accessible={false}
                                        name={KIND_ICON[entry.kind]}
                                        color={kindColor(entry.kind, p)}
                                        size={22}
                                    />
                                    <Text
                                        style={{
                                            color: kindColor(entry.kind, p),
                                            fontSize: 14,
                                            fontWeight: '600',
                                        }}
                                    >
                                        {t(`journal.kind.${entry.kind}`)}
                                    </Text>
                                </View>
                                <Text
                                    accessibilityRole="header"
                                    style={{
                                        color: p.ink,
                                        fontSize: 28,
                                        lineHeight: 36,
                                        fontWeight: '700',
                                        letterSpacing: -0.5,
                                    }}
                                >
                                    {entry.title}
                                </Text>
                                <Text style={{ color: p.secondaryInk, fontSize: 14 }}>
                                    {formatDay(entry.occurredAt)}
                                </Text>
                                <Text style={{ color: p.secondaryInk, fontSize: 12 }}>
                                    {t('journal.authorLabel', {
                                        name: entry.authorName ?? t('journal.unknownAuthor'),
                                    })}
                                </Text>
                            </View>
                            <View style={{ gap: 10 }}>
                                <Text style={{ color: p.ink, fontSize: 17, fontWeight: '700' }}>
                                    {t('journal.annotationField')}
                                </Text>
                                <Text style={{ color: p.ink, fontSize: 16, lineHeight: 27 }}>
                                    {entry.annotation}
                                </Text>
                            </View>
                            {entry.learned && (
                                <View
                                    style={{
                                        backgroundColor: p.surface,
                                        borderRadius: 24,
                                        padding: 20,
                                        gap: 12,
                                    }}
                                >
                                    <Text style={{ color: p.ink, fontSize: 17, fontWeight: '700' }}>
                                        {t('journal.learnedField')}
                                    </Text>
                                    <Text style={{ color: p.ink, fontSize: 16, lineHeight: 27 }}>
                                        {entry.learned}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ViewShot>
                    {entry.remindAt && (
                        <View
                            style={{
                                backgroundColor: p.surface,
                                borderRadius: 24,
                                padding: 20,
                                gap: 12,
                            }}
                        >
                            <Text style={{ color: p.ink, fontWeight: '700', fontSize: 16 }}>
                                {t(
                                    entry.remindDoneAt
                                        ? 'journal.reminderAttended'
                                        : 'journal.reminderPending',
                                )}
                            </Text>
                            <Text style={{ color: p.secondaryInk, fontSize: 14 }}>
                                {journalReminderLabel(entry.remindAt)}
                            </Text>
                            {entry.remindText && (
                                <Text style={{ color: p.ink, fontSize: 16 }}>
                                    {entry.remindText}
                                </Text>
                            )}
                            {scope.canManage && (
                                <Button
                                    title={t(
                                        entry.remindDoneAt
                                            ? 'journal.reminderReopen'
                                            : 'journal.reminderDone',
                                    )}
                                    variant="secondary"
                                    loading={update.isPending}
                                    onPress={() => {
                                        void update
                                            .mutateAsync(!entry.remindDoneAt)
                                            .catch(() => setError(t('errors.generic')));
                                    }}
                                />
                            )}
                        </View>
                    )}
                    {entry.audios.length > 0 && (
                        <View style={{ gap: 12 }}>
                            <Text style={{ color: p.ink, fontSize: 17, fontWeight: '700' }}>
                                {t('journal.audiosField')}
                            </Text>
                            {!entry.audios.length && (
                                <Text style={{ color: p.secondaryInk }}>
                                    {t('journal.audiosEmpty')}
                                </Text>
                            )}
                            {entry.audios.map((one) => (
                                <JournalAudio
                                    key={one.id}
                                    audio={one}
                                    onRemove={
                                        scope.canManage
                                            ? () =>
                                                  Alert.alert(
                                                      t('journal.removeAudio'),
                                                      one.recorded
                                                          ? t('common.audio.recorded')
                                                          : t('common.audio.attached'),
                                                      [
                                                          {
                                                              text: t('common.cancel'),
                                                              style: 'cancel',
                                                          },
                                                          {
                                                              text: t('common.delete'),
                                                              style: 'destructive',
                                                              onPress: () => {
                                                                  void audio
                                                                      .mutateAsync(one.id)
                                                                      .catch(() =>
                                                                          setError(
                                                                              t('errors.generic'),
                                                                          ),
                                                                      );
                                                              },
                                                          },
                                                      ],
                                                  )
                                            : undefined
                                    }
                                />
                            ))}
                        </View>
                    )}
                    {error && (
                        <Text accessibilityRole="alert" style={{ color: p.destructive }}>
                            {error}
                        </Text>
                    )}
                </ScrollView>
            )}
            {actionsOpen && entry && (
                <BottomSheet
                    visible
                    title={t('journal.mobile.actions')}
                    onClose={() => setActionsOpen(false)}
                >
                    <View style={{ gap: 12 }}>
                        <Button
                            title={t('journal.bulkExport')}
                            leadingIcon="download-outline"
                            variant="secondary"
                            loading={sharing}
                            onPress={() => void share()}
                        />
                        <Button
                            title={t('journal.export.shareImage')}
                            leadingIcon="share-outline"
                            variant="secondary"
                            loading={sharing}
                            onPress={() => void share(true)}
                        />
                        <Button
                            title={t('common.delete')}
                            variant="ghost"
                            leadingIcon="trash-outline"
                            loading={remove.isPending}
                            onPress={() => {
                                setActionsOpen(false);
                                confirmDelete();
                            }}
                        />
                        {error && (
                            <Text accessibilityRole="alert" style={{ color: p.destructive }}>
                                {error}
                            </Text>
                        )}
                    </View>
                </BottomSheet>
            )}
            {editing && entry && (
                <JournalForm key={entry.id} entry={entry} onClose={() => setEditing(false)} />
            )}
        </View>
    );
}
