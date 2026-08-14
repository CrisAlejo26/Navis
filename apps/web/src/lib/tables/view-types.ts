import type { TableViewType } from '@navis/shared';
import { Calendar, Columns3, LayoutGrid, type LucideIcon } from 'lucide-react';

export const VIEW_TYPE_ICON: Record<TableViewType, LucideIcon> = {
  grid: LayoutGrid,
  kanban: Columns3,
  calendar: Calendar,
};

export const VIEW_TYPE_LABEL_KEY: Record<TableViewType, string> = {
  grid: 'tables.view.grid',
  kanban: 'tables.view.kanban',
  calendar: 'tables.view.calendar',
};
