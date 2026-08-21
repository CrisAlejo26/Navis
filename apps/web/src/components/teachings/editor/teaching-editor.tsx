import { EMPTY_TEACHING_BODY, type TeachingBody } from '@navis/shared';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useTranslation } from 'react-i18next';

import { TeachingEditorToolbar } from '@/components/teachings/editor/teaching-editor-toolbar';

/**
 * El editor de una enseñanza (RFC 0022 §4.3): Tiptap, recortado al mismo
 * whitelist de nodos que valida el servidor (§4.2) — sin encabezados, citas,
 * código, regla horizontal ni tachado. Lo único que produce es lo único que
 * se acepta.
 *
 * Vive detrás de esta puerta y ninguna otra: quien quiera el editor lo carga
 * con `React.lazy` (`editor/lazy.tsx`), como recharts (CLAUDE.md).
 */
export function TeachingEditor({
  value,
  onChange,
}: {
  value: TeachingBody;
  onChange: (body: TeachingBody) => void;
}) {
  const { t } = useTranslation();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        hardBreak: false,
      }),
      TaskList,
      TaskItem.configure({ nested: false }),
    ],
    content: value ?? EMPTY_TEACHING_BODY,
    editorProps: {
      attributes: {
        class:
          'min-h-40 max-w-prose text-[17px] leading-[1.75] focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-2 [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0',
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getJSON() as TeachingBody);
    },
  });

  return (
    <div className="min-w-0 rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring">
      <TeachingEditorToolbar editor={editor} />
      <div className="p-3">
        <EditorContent editor={editor} aria-label={t('teachings.notesField')} />
      </div>
    </div>
  );
}
