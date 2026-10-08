import { useTimeSummary } from '@navis/api-client';
import { formatDurationShort } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Card, CardTitle } from '@/components/ui/card';
import { accentVars } from '@/lib/accents';
import { api } from '@/lib/api';

/**
 * El tiempo trabajado del rango, por flujo y por tarea (Fase 7c). Las barras
 * llevan la duración escrita: el ancho no es la única forma de leerlo.
 */
export function TimeSummaryCard({ from, to }: { from: string; to: string }) {
    const { t } = useTranslation();
    const { data } = useTimeSummary(api, { from, to });

    if (!data) return null;
    const maxWorkflow = Math.max(...data.byWorkflow.map((row) => row.seconds), 1);

    return (
        <Card className="gap-3 flex flex-col">
            <div className="gap-2 flex items-baseline justify-between">
                <CardTitle className="text-sm">{t('tasks.timeSummary')}</CardTitle>
                {data.totalSeconds > 0 && (
                    <span className="text-sm font-semibold tabular-nums">
                        {formatDurationShort(data.totalSeconds)}
                    </span>
                )}
            </div>

            {data.totalSeconds === 0 ? (
                <p className="text-sm text-muted-foreground">{t('tasks.timeNoSummary')}</p>
            ) : (
                <>
                    <p className="text-xs font-medium text-muted-foreground">
                        {t('tasks.timeByWorkflow')}
                    </p>
                    <ul className="gap-2.5 flex flex-col">
                        {data.byWorkflow.map((row) => (
                            <li
                                key={row.workflowId ?? 'none'}
                                style={accentVars(row.accent ?? 'primary')}
                                className="gap-2 text-sm flex items-center"
                            >
                                <span className="w-28 font-medium shrink-0 truncate text-[var(--acento)]">
                                    {row.name ?? t('tasks.timeNoWorkflow')}
                                </span>
                                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                    <span
                                        className="animate-track-in block h-full origin-left rounded-full bg-[var(--acento)]"
                                        style={{
                                            transform: `scaleX(${String(row.seconds / maxWorkflow)})`,
                                        }}
                                    />
                                </span>
                                <span className="w-16 shrink-0 text-right text-muted-foreground tabular-nums">
                                    {formatDurationShort(row.seconds)}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                        {t('tasks.timeByTask')}
                    </p>
                    <ul className="gap-1.5 flex flex-col">
                        {data.byTask.slice(0, 6).map((row) => (
                            <li key={row.taskId} className="gap-2 text-sm flex justify-between">
                                <span className="truncate">{row.title}</span>
                                <span className="shrink-0 text-muted-foreground tabular-nums">
                                    {formatDurationShort(row.seconds)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </Card>
    );
}
