import type { JournalExportRow } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { toEntriesZip, toEntryMarkdown, type JournalMarkdownLabels } from './journal-markdown';
import { readZip } from './zip-reader';

async function bytesOf(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

const LABELS: JournalMarkdownLabels = {
  frontmatterTitle: 'titulo',
  frontmatterKind: 'tipo',
  frontmatterDate: 'fecha',
  frontmatterReminder: 'recordatorio',
  annotationHeading: 'Anotación',
  learnedHeading: 'Lo aprendido',
};

const fila = (overrides: Partial<JournalExportRow> = {}): JournalExportRow => ({
  id: 'e1',
  title: 'Visita a la familia Gómez',
  kind: 'testimonio',
  occurredAt: '2026-07-14',
  hasLearned: false,
  hasAudio: false,
  remindAt: null,
  remindDoneAt: null,
  authorName: 'Quien acompaña',
  annotation: 'Contó que llevaba dos años sin hablar con su hermano.',
  learned: null,
  remindText: null,
  createdAt: '2026-07-14T10:00:00.000Z',
  ...overrides,
});

describe('exportar una entrada a Markdown', () => {
  it('lleva la cabecera y el cuerpo completos', () => {
    const md = toEntryMarkdown(fila(), 'Testimonio', LABELS);

    expect(md).toContain('titulo: Visita a la familia Gómez');
    expect(md).toContain('tipo: Testimonio');
    expect(md).toContain('fecha: 2026-07-14');
    expect(md).toContain('# Visita a la familia Gómez');
    expect(md).toContain('## Anotación');
    expect(md).toContain('Contó que llevaba dos años sin hablar con su hermano.');
  });

  it('sin lo aprendido, no aparece esa sección', () => {
    const md = toEntryMarkdown(fila(), 'Testimonio', LABELS);
    expect(md).not.toContain('## Lo aprendido');
  });

  it('con lo aprendido, se añade su sección', () => {
    const md = toEntryMarkdown(
      fila({ learned: 'Que a veces la reconciliación empieza por una llamada.' }),
      'Testimonio',
      LABELS,
    );

    expect(md).toContain('## Lo aprendido');
    expect(md).toContain('Que a veces la reconciliación empieza por una llamada.');
  });

  it('con recordatorio, la cabecera lleva día, hora y mensaje', () => {
    const md = toEntryMarkdown(
      fila({ remindAt: '2026-08-12T19:00:00.000Z', remindText: 'Preguntar cómo sigue' }),
      'Testimonio',
      LABELS,
    );

    // La hora se lee en el huso de quien exporta, así que no se fija aquí:
    // solo se comprueba el día y el mensaje.
    expect(md).toMatch(/recordatorio: 2026-08-12 \d{2}:\d{2} — Preguntar cómo sigue/);
  });

  it('sin recordatorio, no hay línea de recordatorio en la cabecera', () => {
    const md = toEntryMarkdown(fila(), 'Testimonio', LABELS);
    expect(md).not.toContain('recordatorio:');
  });
});

describe('exportar varias entradas', () => {
  it('da un .zip con un .md por entrada', async () => {
    const zip = toEntriesZip(
      [fila({ id: 'a', title: 'Primera' }), fila({ id: 'b', title: 'Segunda' })],
      () => 'Testimonio',
      LABELS,
    );

    const entries = readZip(await bytesOf(zip));
    expect(entries.map((entry) => entry.name).sort()).toEqual(['primera.md', 'segunda.md']);
  });

  it('dos entradas con el mismo título no se pisan el fichero', async () => {
    const zip = toEntriesZip(
      [fila({ id: 'a', title: 'Visita' }), fila({ id: 'b', title: 'Visita' })],
      () => 'Testimonio',
      LABELS,
    );

    const entries = readZip(await bytesOf(zip));
    expect(entries.map((entry) => entry.name).sort()).toEqual(['visita-2.md', 'visita.md']);
  });
});
