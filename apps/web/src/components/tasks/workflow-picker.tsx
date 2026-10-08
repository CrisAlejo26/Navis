import { useWorkflows } from '@navis/api-client';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { WorkflowsManagerDialog } from '@/components/tasks/workflows-manager-dialog';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';

/** Elegir el flujo de una tarea (Fase 7b): uno o ninguno. */
export function WorkflowPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (id: string) => void;
}) {
    const { t } = useTranslation();
    const { data: workflows = [] } = useWorkflows(api);
    const [managing, setManaging] = useState(false);

    return (
        <div className="gap-1.5 flex flex-col">
            <Select
                label={t('tasks.workflow')}
                value={value}
                onChange={(event) => {
                    onChange(event.target.value);
                }}
            >
                <option value="">{t('tasks.noWorkflow')}</option>
                {workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                    </option>
                ))}
            </Select>

            <button
                type="button"
                onClick={() => {
                    setManaging(true);
                }}
                className="gap-1 text-xs font-medium flex w-fit cursor-pointer items-center text-muted-foreground hover:text-primary"
            >
                <Settings2 size={11} aria-hidden />
                {t('tasks.manageWorkflows')}
            </button>

            <WorkflowsManagerDialog
                open={managing}
                onClose={() => {
                    setManaging(false);
                }}
            />
        </div>
    );
}
