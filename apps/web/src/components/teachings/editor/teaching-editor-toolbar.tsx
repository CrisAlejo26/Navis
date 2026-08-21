import type { Editor } from '@tiptap/react';
import { Bold, Italic, List, ListChecks, ListOrdered } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

/** Los cinco botones del whitelist (§4.2): negrita, cursiva y las tres listas. */
export function TeachingEditorToolbar({ editor }: { editor: Editor | null }) {
  const { t } = useTranslation();
  if (!editor) return null;

  const buttons = [
    {
      key: 'bold',
      label: t('teachings.editor.bold'),
      Icon: Bold,
      active: editor.isActive('bold'),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: 'italic',
      label: t('teachings.editor.italic'),
      Icon: Italic,
      active: editor.isActive('italic'),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: 'bulletList',
      label: t('teachings.editor.bulletList'),
      Icon: List,
      active: editor.isActive('bulletList'),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'orderedList',
      label: t('teachings.editor.orderedList'),
      Icon: ListOrdered,
      active: editor.isActive('orderedList'),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: 'taskList',
      label: t('teachings.editor.taskList'),
      Icon: ListChecks,
      active: editor.isActive('taskList'),
      onClick: () => editor.chain().focus().toggleTaskList().run(),
    },
  ] as const;

  return (
    <div className="gap-1 p-1.5 flex flex-wrap border-b">
      {buttons.map(({ key, label, Icon, active, onClick }) => (
        <button
          key={key}
          type="button"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            'size-8 inline-flex items-center justify-center rounded-md text-muted-foreground',
            'hover:bg-muted hover:text-foreground',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            active && 'bg-accent text-accent-foreground',
          )}
        >
          <Icon size={16} aria-hidden />
        </button>
      ))}
    </div>
  );
}
