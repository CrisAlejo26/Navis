import { themeColorsHex, type ThemeColors } from '@navis/theme';
import { Switch as RNSwitch, View } from 'react-native';

import { ControlRow } from '@/components/ui/control-row';
import { useThemeStore } from '@/lib/theme';

type SwitchTone = 'primary' | 'success' | 'warning' | 'destructive';

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** El color del ajuste encendido: `primary` de serie, otro tono cuando el
   * interruptor vive dentro de una pantalla que ya tiñe por estado (§ D6). */
  tone?: SwitchTone;
}

function SwitchGlyph({ checked, tone }: { checked: boolean; tone: SwitchTone }) {
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];

  return (
    // El `Switch` nativo de Android trae su propio gesto de arrastre y se
    // queda con el toque aunque `pointerEvents="none"` vaya puesto en él
    // mismo: el toque no llegaba a ningún sitio en vez de subir al
    // `Pressable` de la fila. Puesto en la `View` que lo envuelve, Android
    // ya no le entrega el toque al hijo, y sube.
    <View pointerEvents="none">
      <RNSwitch
        value={checked}
        trackColor={{ false: palette.muted, true: palette[tone as keyof ThemeColors] }}
        thumbColor={palette.card}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}

/** Ajuste on/off — Fase 6. El control va a la derecha, como en cualquier
 * lista de ajustes nativa. */
export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  tone = 'primary',
}: SwitchProps) {
  return (
    <ControlRow
      label={label}
      description={description}
      accessibilityRole="switch"
      checked={checked}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      control={<SwitchGlyph checked={checked} tone={tone} />}
      controlPosition="trailing"
    />
  );
}
