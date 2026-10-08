import { useRunningTimer, useStopTimer } from '@navis/api-client';
import { Square, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { RunningClock } from '@/components/tasks/running-clock';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * El cronómetro en marcha, arriba de las pantallas de tareas (Fase 7c). Va en
 * el flujo de la página y no fijo abajo: una banda fija se comería la acción
 * principal en un teléfono. No pinta nada si no hay cronómetro.
 */
export function RunningTimerBar() {
    const { t } = useTranslation();
    const running = useRunningTimer(api);
    const stop = useStopTimer(api);
    const timer = running.data;

    if (!timer) return null;

    return (
        <div
            role="status"
            aria-label={t('tasks.timerOf', { title: timer.task.title })}
            className="gap-3 px-3 py-2 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10"
        >
            <span className="gap-2 min-w-0 flex items-center">
                <Timer size={16} aria-hidden className="shrink-0 text-primary" />
                <span className="min-w-0 flex flex-col">
                    <span className="text-sm font-medium truncate">{timer.task.title}</span>
                    <RunningClock
                        startedAt={timer.entry.startedAt}
                        className="text-xs text-muted-foreground tabular-nums"
                    />
                </span>
            </span>
            <Button
                size="sm"
                variant="secondary"
                isLoading={stop.isPending}
                onClick={() => {
                    void stop.mutateAsync().then(() => {
                        toast.success(t('tasks.timerStopped'));
                    });
                }}
            >
                <Square size={13} aria-hidden />
                {t('tasks.timeStop')}
            </Button>
        </div>
    );
}
