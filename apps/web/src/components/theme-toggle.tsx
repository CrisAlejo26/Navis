import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { useThemeStore } from '@/lib/theme';

const options = [
  { mode: 'light', Icon: Sun, labelKey: 'theme.light' },
  { mode: 'dark', Icon: Moon, labelKey: 'theme.dark' },
  { mode: 'system', Icon: Monitor, labelKey: 'theme.system' },
] as const;

/** Selector de tema con las tres opciones: claro, oscuro y seguir al sistema. */
export function ThemeToggle() {
  const { t } = useTranslation();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <div
      role="radiogroup"
      aria-label={t('theme.label')}
      className="bg-muted inline-flex items-center gap-0.5 rounded-lg p-0.5"
    >
      {options.map(({ mode: value, Icon, labelKey }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          title={t(labelKey)}
          onClick={() => {
            setMode(value);
          }}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md transition',
            mode === value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon size={16} aria-hidden />
          <span className="sr-only">{t(labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
