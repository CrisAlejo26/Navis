import { useDeleteWorkflow, useWorkflows } from '@navis/api-client';
import type { WorkflowWithCount } from '@navis/shared';
import { Compass, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { WorkflowChip } from '@/components/tasks/workflow-chip';
import { WorkflowForm } from '@/components/tasks/workflow-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/** Los flujos de trabajo de la cuenta (Fase 7b). Mismo patrón que `TagsManagerDialog`. */
export function WorkflowsManagerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { t } = useTranslation();
    const { data: workflows = [] } = useWorkflows(api);
    const remove = useDeleteWorkflow(api);

    const [editing, setEditing] = useState<WorkflowWithCount | 'new' | null>(null);
    const [deleting, setDeleting] = useState<WorkflowWithCount | null>(null);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={t('tasks.manageWorkflows')}
            width="min(28rem, calc(100vw - 2rem))"
        >
            <div className="gap-4 flex flex-col">
                <p className="text-sm text-muted-foreground">{t('tasks.workflowsIntro')}</p>

                <button
                    type="button"
                    onClick={() => {
                        setEditing('new');
                    }}
                    className="gap-2 px-3.5 h-10 text-sm font-medium flex cursor-pointer items-center rounded-lg border border-dashed text-muted-foreground hover:border-primary hover:text-primary"
                >
                    <Plus size={15} aria-hidden />
                    {t('tasks.addWorkflow')}
                </button>

                {workflows.length === 0 ? (
                    <EmptyState icon={Compass} title={t('tasks.noWorkflowsYet')} />
                ) : (
                    <ul className="gap-1.5 flex flex-col">
                        {workflows.map((workflow) => (
                            <li
                                key={workflow.id}
                                className="gap-2 p-2 flex items-center justify-between rounded-lg hover:bg-muted"
                            >
                                <div className="gap-0.5 min-w-0 flex flex-col">
                                    <span>
                                        <WorkflowChip workflow={workflow} />
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {t('tasks.workflowTaskCount', { count: workflow.count })}
                                    </span>
                                </div>
                                <div className="gap-1 flex shrink-0">
                                    <button
                                        type="button"
                                        aria-label={`${t('tasks.editWorkflow')}: ${workflow.name}`}
                                        onClick={() => {
                                            setEditing(workflow);
                                        }}
                                        className="h-8 w-8 flex cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                                    >
                                        <Pencil size={14} aria-hidden />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={`${t('common.delete')}: ${workflow.name}`}
                                        onClick={() => {
                                            setDeleting(workflow);
                                        }}
                                        className="h-8 w-8 flex cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Trash2 size={14} aria-hidden />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Dialog
                open={editing !== null}
                onClose={() => {
                    setEditing(null);
                }}
                title={editing === 'new' ? t('tasks.addWorkflow') : t('tasks.editWorkflow')}
            >
                {editing && (
                    <WorkflowForm
                        key={editing === 'new' ? 'new' : editing.id}
                        workflow={editing === 'new' ? undefined : editing}
                        onSaved={() => {
                            setEditing(null);
                        }}
                    />
                )}
            </Dialog>

            {deleting && (
                <ConfirmDialog
                    open
                    destructive
                    title={t('tasks.workflowDeleteTitle', { name: deleting.name })}
                    description={t('tasks.workflowDeleteBody')}
                    confirmLabel={t('common.delete')}
                    isPending={remove.isPending}
                    onClose={() => {
                        setDeleting(null);
                    }}
                    onConfirm={() => {
                        void remove.mutateAsync(deleting.id).then(() => {
                            toast.success(t('tasks.workflowRemoved'));
                            setDeleting(null);
                        });
                    }}
                />
            )}
        </Dialog>
    );
}
