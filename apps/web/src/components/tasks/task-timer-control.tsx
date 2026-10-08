import {
    useDeleteTimeEntry,
    useRunningTimer,
    useStartTimer,
    useStopTimer,
    useTaskTime,
} from '@navis/api-client';
import { entrySeconds, formatClock, formatDurationShort } from '@navis/shared';
import { Play, Square, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { RunningClock } from '@/components/tasks/running-clock';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * El cronómetro de una tarea (Fase 7c): empezar, parar, su total y sus
 * entradas. Solo hay un cronómetro en marcha por persona: empezar aquí detiene
 * el de otra tarea, y el botón lo dice con la palabra, no solo con el icono.
 */
export function TaskTimerControl({ taskId }: { taskId: string }) {
    const { t } = useTranslation();
    const running = useRunningTimer(api);
    const time = useTaskTime(api, taskId);
    const start = useStartTimer(api);
    const stop = useStopTimer(api);
    const remove = useDeleteTimeEntry(api);

    const here = running.data?.entry.taskId === taskId ? running.data : null;
    const closed = (time.data?.entries ?? []).filter((entry) => entry.endedAt);

    return (
        <section aria-label={t('tasks.timeSection')} className="gap-3 flex flex-col">
            <div className="gap-3 flex items-center justify-between">
                <div className="gap-0.5 flex flex-col">
                    <h3 className="text-sm font-medium">{t('tasks.timeSection')}</h3>
                    <p className="text-xs text-muted-foreground">
                        {here ? (
                            <span className="gap-1.5 font-medium flex items-center text-primary">
                                {t('tasks.timeRunning')} ·{' '}
                                <RunningClock startedAt={here.entry.startedAt} />
                            </span>
                        ) : time.data && time.data.totalSeconds > 0 ? (
                            t('tasks.timeTotal', {
                                time: formatDurationShort(time.data.totalSeconds),
                            })
                        ) : (
                            t('tasks.timeNone')
                        )}
                    </p>
                </div>

                {here ? (
                    <Button
                        variant="secondary"
                        isLoading={stop.isPending}
                        onClick={() => {
                            void stop.mutateAsync().then(() => {
                                toast.success(t('tasks.timerStopped'));
                            });
                        }}
                    >
                        <Square size={14} aria-hidden />
                        {t('tasks.timeStop')}
                    </Button>
                ) : (
                    <Button
                        isLoading={start.isPending}
                        onClick={() => {
                            void start.mutateAsync(taskId).then(() => {
                                toast.success(t('tasks.timerStarted'));
                            });
                        }}
                    >
                        <Play size={14} aria-hidden />
                        {t('tasks.timeStart')}
                    </Button>
                )}
            </div>

            {closed.length > 0 && (
                <ul aria-label={t('tasks.timeHistory')} className="gap-1 flex flex-col">
                    {closed.slice(0, 5).map((entry) => (
                        <li
                            key={entry.id}
                            className="gap-2 py-1 text-xs flex items-center justify-between text-muted-foreground"
                        >
                            <span>{new Date(entry.startedAt).toLocaleString()}</span>
                            <span className="gap-2 flex items-center">
                                <span className="tabular-nums">
                                    {formatClock(entrySeconds(entry, new Date()))}
                                </span>
                                <button
                                    type="button"
                                    aria-label={t('tasks.timeEntryDelete')}
                                    onClick={() => {
                                        void remove.mutateAsync(entry.id);
                                    }}
                                    className="h-7 w-7 flex cursor-pointer items-center justify-center rounded-md hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Trash2 size={13} aria-hidden />
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
