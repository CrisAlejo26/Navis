import { isReminderDue, type BelieverNote } from '@navis/shared';
import { BellRing, Mic } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { NoteHandlers } from '@/components/believers/note-entry';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { accentVars } from '@/lib/accents';
import { NOTE_STYLES } from '@/lib/believers/note-kinds';
import { cn } from '@/lib/cn';
import { formatDay } from '@/lib/format';

/**
 * La bitácora como **lista densa**: una línea por nota.
 *
 * Es la vista de escanear, no la de leer: el texto se trunca a una línea a
 * propósito, porque lo que se busca aquí es «¿de qué hemos hablado este año?»
 * y no el detalle de una conversación. Para eso está la bitácora.
 *
 * De `md` para abajo se cae a dos columnas: seis en un teléfono se leerían
 * desplazándose a lo ancho (Regla 5 §2).
 */
export function NotesList({
  notes,
  onEdit,
  canManage,
}: {
  notes: readonly BelieverNote[];
  onEdit: (note: BelieverNote) => void;
  canManage: NoteHandlers['canManage'];
}) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHead>
            <tr>
              <TableHeader>{t('notes.columnDate')}</TableHeader>
              <TableHeader>{t('notes.columnKind')}</TableHeader>
              <TableHeader>{t('notes.columnTold')}</TableHeader>
              <TableHeader className="lg:table-cell hidden">{t('notes.columnAdvice')}</TableHeader>
            </tr>
          </TableHead>

          <TableBody>
            {notes.map((note) => {
              const { Icon, accent, labelKey } = NOTE_STYLES[note.kind];

              return (
                <TableRow
                  key={note.id}
                  style={accentVars(accent)}
                  className={cn(canManage && 'cursor-pointer')}
                  onClick={
                    canManage
                      ? () => {
                          onEdit(note);
                        }
                      : undefined
                  }
                >
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatDay(note.occurredAt)}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    <span className="gap-1.5 font-medium inline-flex items-center text-[11px] text-[var(--acento)]">
                      <Icon size={12} aria-hidden />
                      {t(labelKey)}
                    </span>
                  </TableCell>

                  {/* `max-w-0` es lo que hace que `truncate` funcione dentro de
                      una celda: sin él, la celda crece con el texto y la tabla
                      se sale a lo ancho en vez de recortar. */}
                  <TableCell className="max-w-0">
                    <span className="gap-2 flex items-center">
                      <span className="text-sm truncate">{note.told}</span>
                      {note.audios.length > 0 && (
                        <Mic
                          size={12}
                          aria-label={t('common.audio.title')}
                          className="shrink-0 text-muted-foreground"
                        />
                      )}
                      {note.remindAt && !note.remindDoneAt && (
                        <BellRing
                          size={12}
                          aria-label={t('notes.reminder.only')}
                          className={cn(
                            'shrink-0',
                            isReminderDue(note) ? 'text-warning' : 'text-muted-foreground',
                          )}
                        />
                      )}
                    </span>
                  </TableCell>

                  <TableCell className="lg:table-cell max-w-0 hidden">
                    <span className="text-sm block truncate text-muted-foreground">
                      {note.advice ?? '—'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
