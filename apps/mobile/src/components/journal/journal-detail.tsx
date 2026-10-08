import { ConfirmationSheet } from '@/components/ui/confirmation-sheet';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ViewShot from 'react-native-view-shot';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useJournalDetail } from '@/hooks/use-journal-detail';
import { useJournalShare } from '@/hooks/use-journal-share';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { JournalForm } from './journal-form';
import { JournalDetailBody } from './journal-detail-body';
import { JournalDetailReminder } from './journal-detail-reminder';
import { JournalDetailAudios } from './journal-detail-audios';
import { JournalCardSkeleton } from './journal-card-skeleton';
import { useJournalTheme } from './journal-theme';

export function JournalDetail({ id }: { id: string }) {
    const { t } = useTranslation(),
        p = useJournalTheme(),
        padding = usePageBottomPadding();
    const d = useJournalDetail(id),
        { shot, sharing, share, shareError } = useJournalShare(id, d.entry?.title);
    return (
        <View
            className={p.dark ? 'dark' : undefined}
            style={{ flex: 1, backgroundColor: p.background }}
        >
            <AppBar title={t('nav.journal')} transparent />
            {!d.entry ? (
                d.result.isPending ? (
                    <View style={{ padding: 22 }}>
                        <JournalCardSkeleton />
                    </View>
                ) : (
                    <EmptyState
                        icon="document-text-outline"
                        title={t(d.result.isError ? 'errors.generic' : 'errors.notFound')}
                        action={{
                            label: t('common.retry'),
                            onPress: () => void d.result.refetch(),
                        }}
                    />
                )
            ) : (
                <ScrollView
                    contentContainerStyle={{
                        padding: 22,
                        paddingBottom: padding,
                        gap: 20,
                        width: '100%',
                        maxWidth: 480,
                        alignSelf: 'center',
                    }}
                >
                    <ViewShot
                        ref={shot}
                        options={{ format: 'png', quality: 1 }}
                        style={{ backgroundColor: p.background }}
                    >
                        <JournalDetailBody entry={d.entry} />
                    </ViewShot>
                    <JournalDetailReminder
                        entry={d.entry}
                        canManage={d.scope.canManage}
                        busy={d.busy}
                        onAttend={d.attend}
                    />
                    <JournalDetailAudios
                        entry={d.entry}
                        canManage={d.scope.canManage && !d.busy}
                        onRemove={d.removeAudio}
                    />
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
                        {d.scope.canManage && (
                            <>
                                <Button
                                    testID="journal-edit"
                                    title={t('journal.edit')}
                                    leadingIcon="create-outline"
                                    disabled={d.busy}
                                    onPress={() => d.setEditing(true)}
                                />
                                <Button
                                    testID="journal-delete"
                                    title={t('common.delete')}
                                    leadingIcon="trash-outline"
                                    variant="ghost"
                                    disabled={d.busy}
                                    onPress={d.confirmDelete}
                                />
                            </>
                        )}
                    </View>
                    {(d.error || shareError) && (
                        <Text accessibilityRole="alert" style={{ color: p.destructive }}>
                            {d.error || shareError}
                        </Text>
                    )}
                </ScrollView>
            )}
            {d.editing && d.entry && d.scope.canManage && (
                <JournalForm key={d.entry.id} entry={d.entry} onClose={() => d.setEditing(false)} />
            )}

            {d.deleting && (
                <ConfirmationSheet
                    title={t('journal.deleteTitle', { title: d.entry?.title })}
                    description={t('journal.deleteBody')}
                    confirmLabel={t('common.delete')}
                    busy={d.busy}
                    failed={Boolean(d.error)}
                    onCancel={d.cancelDeletion}
                    onConfirm={() => void d.deleteConfirmed()}
                />
            )}
        </View>
    );
}
