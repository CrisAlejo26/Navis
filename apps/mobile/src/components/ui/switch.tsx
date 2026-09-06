import { themeColorsHex } from '@navis/theme';
import { Switch as RNSwitch } from 'react-native';

import { ControlRow } from '@/components/ui/control-row';
import { useThemeStore } from '@/lib/theme';

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function SwitchGlyph({ checked }: { checked: boolean }) {
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];

  return (
    <RNSwitch
      value={checked}
      trackColor={{ false: palette.muted, true: palette.primary }}
      thumbColor={palette.card}
      // Decorativo: la fila entera ya anuncia el estado (Regla 2), y así
      // tocar cualquier punto de la fila alterna el ajuste, no solo el
      // dibujo del interruptor.
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** Ajuste on/off — Fase 6. El control va a la derecha, como en cualquier
 * lista de ajustes nativa. */
export function Switch({ label, description, checked, onChange, disabled = false }: SwitchProps) {
  return (
    <ControlRow
      label={label}
      description={description}
      accessibilityRole="switch"
      checked={checked}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      control={<SwitchGlyph checked={checked} />}
      controlPosition="trailing"
    />
  );
}
