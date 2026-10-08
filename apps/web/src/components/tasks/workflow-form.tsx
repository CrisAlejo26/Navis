import { useCreateWorkflow, useUpdateWorkflow } from '@navis/api-client';
import { createWorkflowSchema, type WorkflowWithCount } from '@navis/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { formText, optionalText } from '@/lib/form';
import { toast } from '@/lib/toast';

/** Crear o editar un flujo de trabajo (Fase 7b): nombre, descripción y color. */
export function WorkflowForm({
    workflow,
    onSaved,
}: {
    workflow?: WorkflowWithCount;
    onSaved: () => void;
}) {
    const { t } = useTranslation();
    const create = useCreateWorkflow(api);
    const update = useUpdateWorkflow(api);

    const [accent, setAccent] = useState(workflow?.accent ?? '#2140cf');
    const [error, setError] = useState<string | null>(null);

    const nameRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);

        const parsed = createWorkflowSchema.safeParse({
            name: formText(form.get('name')),
            description: optionalText(form.get('description')) ?? null,
            accent,
        });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
            return;
        }

        setError(null);
        const save = workflow
            ? update.mutateAsync({ id: workflow.id, ...parsed.data })
            : create.mutateAsync(parsed.data);

        void save
            .then(() => {
                toast.success(workflow ? t('tasks.workflowUpdated') : t('tasks.workflowCreated'));
                onSaved();
            })
            .catch(() => {
                setError(t('errors.generic'));
            });
    };

    return (
        <form onSubmit={submit} className="gap-4 min-w-0 flex flex-col">
            <Input
                ref={nameRef}
                name="name"
                label={t('tasks.workflowName')}
                placeholder={t('tasks.workflowNamePlaceholder')}
                defaultValue={workflow?.name}
                required
                maxLength={40}
            />

            <Textarea
                name="description"
                label={t('tasks.workflowDescription')}
                defaultValue={workflow?.description ?? ''}
                rows={2}
                maxLength={200}
            />

            <ColorPicker value={accent} onChange={setAccent} label={t('tasks.workflowColor')} />

            <FormError message={error} />

            <Button type="submit" isLoading={create.isPending || update.isPending}>
                {t('common.save')}
            </Button>
        </form>
    );
}
