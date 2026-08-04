import { useCongregations, usePatterns } from '@navis/api-client';
import type { MeetingPattern } from '@navis/shared';
import { CalendarClock, ChevronLeft, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { AddCongregationDialog } from '@/components/calendar/add-congregation-dialog';
import { CongregationRows } from '@/components/calendar/congregation-rows';
import { PatternForm } from '@/components/calendar/pattern-form';
import { PatternRows } from '@/components/calendar/pattern-rows';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';

/**
 * Lo que hay detrás del calendario: las **sedes** y las **reuniones fijas**.
 *
 * Se configura una vez y el mes se llena solo a partir de ahí; por eso no está
 * en la pantalla principal, donde estorbaría todos los días.
 */
export function CalendarSettingsPage() {
  const { t } = useTranslation();
  const { data: congregations = [] } = useCongregations(api);
  const { data: patterns = [] } = usePatterns(api);

  const [addCongregation, setAddCongregation] = useState(false);
  const [editing, setEditing] = useState<MeetingPattern | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <section className="max-w-2xl gap-6 flex flex-col">
      <div className="gap-3 flex items-center">
        <Link
          to="/calendar"
          aria-label={t('common.back')}
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft size={18} aria-hidden />
        </Link>
        <h1 className="text-2xl font-semibold">{t('calendar.settings')}</h1>
      </div>

      <Card>
        <div className="gap-3 mb-2 flex items-center justify-between">
          <CardTitle className="text-base">{t('calendar.congregations')}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAddCongregation(true);
            }}
          >
            <Plus size={15} aria-hidden />
            {t('calendar.addCongregation')}
          </Button>
        </div>

        <CongregationRows congregations={congregations} />
      </Card>

      <Card>
        <div className="gap-3 mb-2 flex items-center justify-between">
          <CardTitle className="text-base">{t('calendar.patterns')}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCreating(true);
            }}
          >
            <Plus size={15} aria-hidden />
            {t('calendar.addPattern')}
          </Button>
        </div>

        {patterns.length === 0 ? (
          <EmptyState icon={CalendarClock} title={t('calendar.empty')}>
            {t('calendar.emptyHint')}
          </EmptyState>
        ) : (
          <PatternRows patterns={patterns} congregations={congregations} onEdit={setEditing} />
        )}
      </Card>

      <AddCongregationDialog
        open={addCongregation}
        onClose={() => {
          setAddCongregation(false);
        }}
      />

      {(creating || editing) && (
        <PatternForm
          open
          congregations={congregations}
          pattern={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
