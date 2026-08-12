import {
  TASK_REPEAT_END_TYPES,
  TASK_REPEAT_FREQS,
  type TaskRepeatEndType,
  type TaskRepeatFreq,
} from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export interface RepeatDraft {
  freq: TaskRepeatFreq;
  interval: number;
  endType: TaskRepeatEndType;
  endDate: string;
  endCount: number;
}

const UNIT_KEY: Record<TaskRepeatFreq, string> = {
  diaria: 'tasks.repeatIntervalDays',
  semanal: 'tasks.repeatIntervalWeeks',
  mensual: 'tasks.repeatIntervalMonths',
};

const FREQ_KEY: Record<TaskRepeatFreq, string> = {
  diaria: 'tasks.repeatDaily',
  semanal: 'tasks.repeatWeekly',
  mensual: 'tasks.repeatMonthly',
};

const END_KEY: Record<TaskRepeatEndType, string> = {
  nunca: 'tasks.repeatEndNever',
  fecha: 'tasks.repeatEndDate',
  cantidad: 'tasks.repeatEndCount',
};

/** La repetición de una tarea (D2): frecuencia, intervalo y condición de fin. */
export function RepeatFields({
  value,
  onChange,
}: {
  value: RepeatDraft;
  onChange: (next: RepeatDraft) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="gap-3 p-3 flex flex-col rounded-lg border bg-muted/30">
      <div className="gap-3 grid grid-cols-2">
        <Select
          label={t('tasks.repeat')}
          value={value.freq}
          onChange={(event) => {
            onChange({ ...value, freq: event.target.value as TaskRepeatFreq });
          }}
        >
          {TASK_REPEAT_FREQS.map((freq) => (
            <option key={freq} value={freq}>
              {t(FREQ_KEY[freq])}
            </option>
          ))}
        </Select>

        <div className="gap-2 flex items-end">
          <Input
            type="number"
            min={1}
            max={365}
            label={t('tasks.repeatEveryNDays')}
            value={value.interval}
            onChange={(event) => {
              onChange({ ...value, interval: Math.max(1, Number(event.target.value)) });
            }}
          />
          <span className="h-11 text-sm flex items-center text-muted-foreground">
            {t(UNIT_KEY[value.freq])}
          </span>
        </div>
      </div>

      <Select
        label={t('tasks.repeatEnd')}
        value={value.endType}
        onChange={(event) => {
          onChange({ ...value, endType: event.target.value as TaskRepeatEndType });
        }}
      >
        {TASK_REPEAT_END_TYPES.map((endType) => (
          <option key={endType} value={endType}>
            {t(END_KEY[endType])}
          </option>
        ))}
      </Select>

      {value.endType === 'fecha' && (
        <Input
          type="date"
          label={t('tasks.repeatEndDate')}
          value={value.endDate}
          onChange={(event) => {
            onChange({ ...value, endDate: event.target.value });
          }}
        />
      )}

      {value.endType === 'cantidad' && (
        <Input
          type="number"
          min={1}
          max={999}
          label={t('tasks.repeatEndCountLabel')}
          value={value.endCount}
          onChange={(event) => {
            onChange({ ...value, endCount: Math.max(1, Number(event.target.value)) });
          }}
        />
      )}
    </div>
  );
}
