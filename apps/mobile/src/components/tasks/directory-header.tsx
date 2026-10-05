import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { formatDay } from '@/lib/format';
import type { TaskDirectoryState } from './use-task-directory';
import { TaskHeader } from './task-header';
import { TaskCalendar } from './task-calendar';
import { TaskSkeleton } from './task-skeleton';
export function DirectoryHeader({ state: s }: { state: TaskDirectoryState }) {
    const { t } = useTranslation(),
        page = s.listing.data?.pages[0];
    return (
        <View>
            <TaskHeader
                filters={s.filters}
                onChange={s.setFilters}
                view={s.view}
                onView={s.setView}
                pending={page?.pending ?? 0}
                done={page?.done ?? 0}
                total={page?.total ?? 0}
                onFilters={() => s.setFiltersOpen(true)}
            />
            {s.view === 'calendar' && (
                <>
                    {s.calendar.isPending ? (
                        <TaskSkeleton />
                    ) : s.calendar.isError ? (
                        <Button
                            title={t('common.retry')}
                            onPress={() => void s.calendar.refetch()}
                        />
                    ) : (
                        <TaskCalendar
                            month={s.month}
                            today={s.today}
                            selected={s.day}
                            items={s.calendar.data ?? []}
                            onMonth={s.setMonth}
                            onSelect={s.setDay}
                        />
                    )}
                    <View className="pt-3 flex-row items-center justify-between">
                        <Text className="font-sans-semibold text-sm flex-1 text-foreground">
                            {formatDay(s.day)}
                        </Text>
                        <Button
                            title={t('tasks.todayNav')}
                            variant="ghost"
                            size="sm"
                            onPress={() => {
                                s.setDay(s.today);
                                s.setMonth(s.today);
                            }}
                        />
                    </View>
                </>
            )}
        </View>
    );
}
