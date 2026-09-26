import type { TeachingListItem } from '@navis/shared';
import { GraduationCap, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@/components/data-table/data-table';
import { DeleteTeachingDialog } from '@/components/teachings/delete-teaching-dialog';
import { TeachingForm } from '@/components/teachings/teaching-form';
import { TeachingListCard } from '@/components/teachings/teaching-list-card';
import { BackLink } from '@/components/ui/back-link';
import { Button } from '@/components/ui/button';
import { useTeachingsScreen } from '@/lib/teachings/use-teachings-screen';

/** El listado de enseñanzas, en tabla o en fichas según el ancho (Regla 5). */
export function TeachingsListPage() {
    const { t } = useTranslation();

    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<TeachingListItem | null>(null);
    const [deleting, setDeleting] = useState<TeachingListItem | null>(null);

    const screen = useTeachingsScreen({ onEdit: setEditing, onDelete: setDeleting });
    const searching = screen.state.request.search !== '';

    return (
        <section className="gap-4 flex flex-col">
            <BackLink to="/teachings" label={t('teachings.title')} />

            <header className="gap-3 sm:flex-row sm:items-center sm:justify-between flex flex-col">
                <h1 className="text-2xl font-semibold tracking-[-0.02em]">
                    {t('teachings.title')}
                </h1>
                <Button
                    size="lg"
                    onClick={() => {
                        setCreating(true);
                    }}
                >
                    <Plus size={18} aria-hidden />
                    {t('teachings.add')}
                </Button>
            </header>

            <DataTable
                columns={screen.columns}
                state={screen.state}
                source={screen.source}
                getKey={(teaching) => teaching.id}
                emptyIcon={GraduationCap}
                emptyTitle={searching ? t('teachings.noResults') : t('teachings.emptyTitle')}
                searchLabel={t('teachings.search')}
                rowClassName={() => 'animate-rise-in'}
                rowStyle={(_teaching, index) => ({
                    animationDelay: `${String(Math.min(index, 12) * 35)}ms`,
                })}
                renderCard={(teaching, index) => (
                    <TeachingListCard
                        teaching={teaching}
                        index={index}
                        onEdit={() => {
                            setEditing(teaching);
                        }}
                        onDelete={() => {
                            setDeleting(teaching);
                        }}
                    />
                )}
            />

            {(creating || editing) && (
                <TeachingForm
                    open
                    teachingId={editing?.id}
                    onClose={() => {
                        setCreating(false);
                        setEditing(null);
                    }}
                />
            )}

            <DeleteTeachingDialog
                teaching={deleting}
                onClose={() => {
                    setDeleting(null);
                }}
            />
        </section>
    );
}
