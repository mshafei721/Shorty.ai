import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  AccessibilityRole,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/design-system/tokens-mobile';

type CardVariant = 'default' | 'elevated';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  interactive?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);

const springConfig: WithSpringConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  interactive = false,
  onPress,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!interactive || !onPress) return;
    scale.value = withSpring(0.98, springConfig);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    if (!interactive || !onPress) return;
    scale.value = withSpring(1.0, springConfig);
  };

  const handlePress = () => {
    if (!interactive || !onPress) return;
    onPress();
  };

  const cardStyle: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}`],
    style,
  ];

  const getAccessibilityRole = (): AccessibilityRole | undefined => {
    if (interactive && onPress) return 'button';
    return undefined;
  };

  if (interactive && onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[cardStyle, animatedStyle]}
        accessibilityRole={getAccessibilityRole()}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedView
      style={cardStyle}
      testID={testID}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radius.md,
    padding: tokens.components.card.padding,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },

  variant_default: {
    backgroundColor: tokens.colors.surface.card,
    ...tokens.elevation.sm,
  },

  variant_elevated: {
    backgroundColor: tokens.colors.surface.cardElevated,
    ...tokens.elevation.md,
  },
});

export default Card;
