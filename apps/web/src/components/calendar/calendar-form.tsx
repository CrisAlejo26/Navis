import { useCreateCalendar, useMinistries, useUpdateCalendar } from '@navis/api-client';
import { createCalendarSchema, type Calendar } from '@navis/shared';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { FormError } from '@/components/auth/form-error';
import { CalendarTemplatePicker } from '@/components/calendar/calendar-template-picker';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCalendarTemplates, type CalendarTemplateSlug } from '@/lib/calendar/templates';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Alta y renombrado de un calendario (RFC 0002 D15).
 *
 * El **ministerio** no es decoración: es lo que hace que en el calendario de
 * sonido salgan primero los de sonido (D16). Se puede dejar sin ninguno, y
 * entonces se propone a cualquiera.
 *
 * Al **crear**, una plantilla rellena el nombre y la labor, y de paso deja
 * dicho el día, la hora y las fases de una primera reunión: al guardar se va
 * a los ajustes del calendario recién nacido con eso ya propuesto en el
 * formulario de «Añadir reunión fija», no en blanco (`calendar-settings.tsx`).
 * Al **renombrar** no hay plantilla: ya hay un calendario de verdad detrás.
 */
export function CalendarForm({
  open,
  onClose,
  calendar,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, se renombra; si no, se crea. */
  calendar?: Calendar;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const templates = useCalendarTemplates();
  const createCalendar = useCreateCalendar(api);
  const updateCalendar = useUpdateCalendar(api);
  const [error, setError] = useState<string | null>(null);

  const [templateSlug, setTemplateSlug] = useState<CalendarTemplateSlug | null>(null);
  const [name, setName] = useState(calendar?.name ?? '');
  const [ministry, setMinistry] = useState(calendar?.ministry ?? '');

  /*
   * Las **labores** son el catálogo de la iglesia (`ministries`), no el de
   * roles: son lo que casa contra `believer_ministries` al proponer a alguien
   * (D16), y un rol de cuenta —«sonido», «pastor»— es otra cosa (acceso, no
   * disponibilidad). La apagada no se propone, salvo que ya sea la elegida:
   * quitarla de la lista no debe borrar lo que ya tenía este calendario.
   */
  const { data: ministries = [] } = useMinistries(api, open);
  const labores = ministries.filter((one) => one.isActive || one.slug === ministry);

  const selectTemplate = (slug: CalendarTemplateSlug | null) => {
    setTemplateSlug(slug);
    const template = slug ? templates.find((one) => one.slug === slug) : undefined;
    setName(template?.name ?? '');
    setMinistry(template?.ministrySlug ?? '');
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = createCalendarSchema.safeParse({ name, ministry: ministry || null });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);

    if (calendar) {
      updateCalendar.mutate(
        { id: calendar.id, ...parsed.data },
        {
          onSuccess: (guardado) => {
            toast.success(t('calendar.saved', { name: guardado.name }));
            onClose();
          },
          onError: () => {
            setError(t('calendar.saveFailed'));
          },
        },
      );
      return;
    }

    const template = templateSlug ? templates.find((one) => one.slug === templateSlug) : undefined;

    createCalendar.mutate(parsed.data, {
      onSuccess: (creado) => {
        toast.success(t('calendar.calendarCreated', { name: creado.name }));
        onClose();
        if (template) {
          void navigate(`/calendar/${creado.slug}/settings`, {
            state: { patternDefaults: template.pattern },
          });
        } else {
          void navigate(`/calendar/${creado.slug}`);
        }
      },
      onError: () => {
        setError(t('calendar.saveFailed'));
      },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={calendar ? t('calendar.renameCalendar') : t('calendar.addCalendar')}
    >
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        {!calendar && <CalendarTemplatePicker value={templateSlug} onChange={selectTemplate} />}

        <Input
          name="name"
          label={t('calendar.calendarName')}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          required
        />

        <div className="gap-1.5 flex flex-col">
          <Select
            name="ministry"
            label={t('calendar.labor')}
            value={ministry}
            onChange={(event) => {
              setMinistry(event.target.value);
            }}
          >
            <option value="">{t('calendar.laborNone')}</option>
            {labores.map((one) => (
              <option key={one.slug} value={one.slug}>
                {one.name}
              </option>
            ))}
          </Select>

          {/* Dónde se administran, porque la lista no se edita desde aquí. */}
          <p className="gap-1.5 text-xs flex items-start text-muted-foreground">
            <Info size={14} aria-hidden className="mt-0.5 shrink-0" />
            <span>
              {t('calendar.laborHint')}{' '}
              <Link
                to="/believers/ministries"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('ministries.title')}
              </Link>
              .
            </span>
          </p>
        </div>

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={createCalendar.isPending || updateCalendar.isPending}
        >
          {calendar ? t('common.save') : t('calendar.addCalendar')}
        </Button>
      </form>
    </Dialog>
  );
}
