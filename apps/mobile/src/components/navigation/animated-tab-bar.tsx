import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { TAB_BAR_ENTRIES, type TabBarEntry } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

const BAR_HEIGHT = 60;
const PILL_WIDTH = 52;
const PILL_HEIGHT = 34;
const PILL_SPRING = { stiffness: 240, damping: 24 };

interface AnimatedTabBarProps extends BottomTabBarProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
}

function TabButton({
  entry,
  active,
  highlighted,
  iconColor,
  accent,
  label,
  onPress,
}: {
  entry: TabBarEntry;
  active: boolean;
  highlighted: boolean;
  iconColor: string;
  accent: string;
  label: string;
  onPress: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(active ? 1 : 0.9);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = active ? 1 : 0.9;
      return;
    }
    if (active) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 140 }),
        withSpring(1, { stiffness: 260, damping: 16 }),
      );
    } else {
      scale.value = withTiming(0.9, { duration: 120 });
    }
  }, [active, reducedMotion, scale]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      className="gap-1 flex-1 items-center justify-center"
      style={{ height: BAR_HEIGHT }}
    >
      <Animated.View style={iconStyle}>
        {highlighted ? (
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: accent }}
          >
            <Ionicons name={entry.icon[0]} size={18} color={iconColor} />
          </View>
        ) : (
          <Ionicons name={active ? entry.icon[0] : entry.icon[1]} size={22} color={iconColor} />
        )}
      </Animated.View>
      <Text
        className={active || highlighted ? 'font-semibold' : ''}
        style={{ color: iconColor, fontSize: 10 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Barra inferior animada: pill que se desliza al tab activo con spring. */
export function AnimatedTabBar({
  state,
  navigation,
  insets,
  menuOpen,
  onToggleMenu,
}: AnimatedTabBarProps) {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((store) => store.resolvedTheme)];
  const reducedMotion = useReducedMotion();
  const [containerWidth, setContainerWidth] = useState(0);
  const pillX = useSharedValue(state.index);

  useEffect(() => {
    pillX.value = state.index;
  }, [state.index, pillX]);

  const tabWidth = containerWidth / TAB_BAR_ENTRIES.length;
  const pillStyle = useAnimatedStyle(() => {
    const x = pillX.value * tabWidth + (tabWidth - PILL_WIDTH) / 2;
    return { transform: [{ translateX: reducedMotion ? x : withSpring(x, PILL_SPRING) }] };
  }, [tabWidth, reducedMotion]);

  const onLayout = (event: LayoutChangeEvent) => setContainerWidth(event.nativeEvent.layout.width);

  function handlePress(index: number): void {
    const entry = TAB_BAR_ENTRIES[index];
    if (entry.name === 'more') {
      onToggleMenu();
      return;
    }
    if (state.index !== index) void Haptics.selectionAsync();
    navigation.navigate(entry.name);
  }

  return (
    <View className="border-t border-border bg-card" style={{ paddingBottom: insets.bottom }}>
      <View className="relative flex-row" onLayout={onLayout}>
        <Animated.View
          style={[
            pillStyle,
            {
              position: 'absolute',
              top: (BAR_HEIGHT - PILL_HEIGHT) / 2,
              width: PILL_WIDTH,
              height: PILL_HEIGHT,
              borderRadius: PILL_HEIGHT / 2,
              backgroundColor: palette.primary,
            },
          ]}
        />
        {TAB_BAR_ENTRIES.map((entry, index) => {
          const isMore = entry.name === 'more';
          const isActive = state.index === index && !isMore;
          const isMenuOpen = isMore && menuOpen;
          const color =
            isActive || isMenuOpen ? palette.primaryForeground : palette.mutedForeground;
          return (
            <TabButton
              key={entry.name}
              entry={entry}
              active={isActive}
              highlighted={isMenuOpen}
              iconColor={color}
              accent={palette.accent}
              label={t(entry.labelKey)}
              onPress={() => handlePress(index)}
            />
          );
        })}
      </View>
    </View>
  );
}
