/**
 * El catálogo de iconos de tareas y hábitos (RFC 0018 §7.1).
 *
 * Es una lista de **claves**, sin componente ni SVG (D14): quien lo pinta es
 * cada plataforma, con su propia librería — lucide en web
 * (`apps/web/src/lib/tasks/icon-map.ts`), Ionicons el día que exista móvil
 * (Regla 7 §6: no son el mismo catálogo). Mismo patrón que
 * `lib/believers/note-kinds.ts`, a mayor escala.
 *
 * Ciento veinte iconos en doce categorías, curados uno a uno contra la Regla
 * 7: ninguno se lee como una cruz, un «+» grande o dos barras cruzadas (D15).
 */
export const TASK_ICON_CATEGORIES = [
  'work',
  'study',
  'spiritual',
  'home',
  'health',
  'finance',
  'family',
  'nature',
  'tech',
  'travel',
  'food',
  'time',
] as const;

export type TaskIconCategory = (typeof TASK_ICON_CATEGORIES)[number];

export function isTaskIconCategory(value: string): value is TaskIconCategory {
  return (TASK_ICON_CATEGORIES as readonly string[]).includes(value);
}

export interface TaskIconEntry {
  key: string;
  category: TaskIconCategory;
}

export const TASK_ICON_CATALOG: readonly TaskIconEntry[] = [
  { key: 'briefcase', category: 'work' },
  { key: 'file-text', category: 'work' },
  { key: 'printer', category: 'work' },
  { key: 'paperclip', category: 'work' },
  { key: 'calculator', category: 'work' },
  { key: 'mail', category: 'work' },
  { key: 'clipboard', category: 'work' },
  { key: 'clipboard-list', category: 'work' },
  { key: 'folder', category: 'work' },
  { key: 'archive', category: 'work' },
  { key: 'inbox', category: 'work' },
  { key: 'send', category: 'work' },
  { key: 'book-open', category: 'study' },
  { key: 'graduation-cap', category: 'study' },
  { key: 'notebook-pen', category: 'study' },
  { key: 'pencil', category: 'study' },
  { key: 'search', category: 'study' },
  { key: 'book', category: 'study' },
  { key: 'book-marked', category: 'study' },
  { key: 'library', category: 'study' },
  { key: 'highlighter', category: 'study' },
  { key: 'pen-tool', category: 'study' },
  { key: 'compass', category: 'spiritual' },
  { key: 'anchor', category: 'spiritual' },
  { key: 'life-buoy', category: 'spiritual' },
  { key: 'heart-handshake', category: 'spiritual' },
  { key: 'mic', category: 'spiritual' },
  { key: 'music', category: 'spiritual' },
  { key: 'users', category: 'spiritual' },
  { key: 'handshake', category: 'spiritual' },
  { key: 'sparkles', category: 'spiritual' },
  { key: 'home', category: 'home' },
  { key: 'sofa', category: 'home' },
  { key: 'utensils', category: 'home' },
  { key: 'trash-2', category: 'home' },
  { key: 'lightbulb', category: 'home' },
  { key: 'wrench', category: 'home' },
  { key: 'washing-machine', category: 'home' },
  { key: 'door-open', category: 'home' },
  { key: 'armchair', category: 'home' },
  { key: 'lamp', category: 'home' },
  { key: 'key', category: 'home' },
  { key: 'activity', category: 'health' },
  { key: 'dumbbell', category: 'health' },
  { key: 'salad', category: 'health' },
  { key: 'pill', category: 'health' },
  { key: 'bed', category: 'health' },
  { key: 'droplet', category: 'health' },
  { key: 'stethoscope', category: 'health' },
  { key: 'thermometer', category: 'health' },
  { key: 'moon', category: 'health' },
  { key: 'wallet', category: 'finance' },
  { key: 'piggy-bank', category: 'finance' },
  { key: 'credit-card', category: 'finance' },
  { key: 'receipt', category: 'finance' },
  { key: 'trending-up', category: 'finance' },
  { key: 'banknote', category: 'finance' },
  { key: 'coins', category: 'finance' },
  { key: 'shopping-cart', category: 'finance' },
  { key: 'shopping-bag', category: 'finance' },
  { key: 'baby', category: 'family' },
  { key: 'cake', category: 'family' },
  { key: 'gift', category: 'family' },
  { key: 'party-popper', category: 'family' },
  { key: 'users-round', category: 'family' },
  { key: 'smile', category: 'family' },
  { key: 'shirt', category: 'family' },
  { key: 'glasses', category: 'family' },
  { key: 'crown', category: 'family' },
  { key: 'award', category: 'family' },
  { key: 'trees', category: 'nature' },
  { key: 'mountain', category: 'nature' },
  { key: 'sun', category: 'nature' },
  { key: 'cloud-rain', category: 'nature' },
  { key: 'bike', category: 'nature' },
  { key: 'footprints', category: 'nature' },
  { key: 'leaf', category: 'nature' },
  { key: 'flower', category: 'nature' },
  { key: 'sprout', category: 'nature' },
  { key: 'recycle', category: 'nature' },
  { key: 'laptop', category: 'tech' },
  { key: 'smartphone', category: 'tech' },
  { key: 'wifi', category: 'tech' },
  { key: 'camera', category: 'tech' },
  { key: 'headphones', category: 'tech' },
  { key: 'monitor', category: 'tech' },
  { key: 'tablet', category: 'tech' },
  { key: 'phone', category: 'tech' },
  { key: 'video', category: 'tech' },
  { key: 'battery', category: 'tech' },
  { key: 'car', category: 'travel' },
  { key: 'plane', category: 'travel' },
  { key: 'train-front', category: 'travel' },
  { key: 'map', category: 'travel' },
  { key: 'luggage', category: 'travel' },
  { key: 'sailboat', category: 'travel' },
  { key: 'ship', category: 'travel' },
  { key: 'route', category: 'travel' },
  { key: 'ticket', category: 'travel' },
  { key: 'bus', category: 'travel' },
  { key: 'chef-hat', category: 'food' },
  { key: 'coffee', category: 'food' },
  { key: 'apple', category: 'food' },
  { key: 'utensils-crossed', category: 'food' },
  { key: 'cookie', category: 'food' },
  { key: 'pizza', category: 'food' },
  { key: 'ice-cream-cone', category: 'food' },
  { key: 'milk', category: 'food' },
  { key: 'carrot', category: 'food' },
  { key: 'soup', category: 'food' },
  { key: 'clock', category: 'time' },
  { key: 'calendar', category: 'time' },
  { key: 'alarm-clock', category: 'time' },
  { key: 'timer', category: 'time' },
  { key: 'flag', category: 'time' },
  { key: 'star', category: 'time' },
  { key: 'bell', category: 'time' },
  { key: 'target', category: 'time' },
  { key: 'list-checks', category: 'time' },
  { key: 'check-check', category: 'time' },
];

export type TaskIconKey = (typeof TASK_ICON_CATALOG)[number]['key'];

const ICON_KEYS = new Set(TASK_ICON_CATALOG.map((entry) => entry.key));

export function isTaskIconKey(value: string): value is TaskIconKey {
  return ICON_KEYS.has(value);
}

/** El icono por defecto al crear una etiqueta, si nadie elige otro. */
export const DEFAULT_TASK_ICON: TaskIconKey = 'star';

/** Las claves de un icono, agrupadas por categoría, en el orden del catálogo. */
export function taskIconsByCategory(): Record<TaskIconCategory, TaskIconEntry[]> {
  const grouped = {} as Record<TaskIconCategory, TaskIconEntry[]>;
  for (const category of TASK_ICON_CATEGORIES) grouped[category] = [];
  for (const entry of TASK_ICON_CATALOG) grouped[entry.category].push(entry);
  return grouped;
}
