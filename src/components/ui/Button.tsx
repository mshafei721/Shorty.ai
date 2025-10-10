import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
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

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const springConfig: WithSpringConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.95, springConfig);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1.0, springConfig);
  };

  const handlePress = () => {
    if (disabled || loading) return;
    onPress();
  };

  const buttonStyle: ViewStyle[] = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`textSize_${size}`],
    styles[`textVariant_${variant}`],
    (disabled || loading) && styles.textDisabled,
  ];

  const getAccessibilityRole = (): AccessibilityRole => 'button';

  const getAccessibilityState = () => ({
    disabled: disabled || loading,
    busy: loading,
  });

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[buttonStyle, animatedStyle]}
      accessibilityRole={getAccessibilityRole()}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={getAccessibilityState()}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'ghost' || variant === 'secondary'
              ? tokens.colors.primary[600]
              : tokens.colors.text.onPrimary
          }
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.sm,
    minHeight: tokens.accessibility.minTouchTarget,
  },

  size_small: {
    height: tokens.components.button.height.small,
    paddingHorizontal: tokens.components.button.paddingHorizontal.small,
  },

  size_medium: {
    height: tokens.components.button.height.medium,
    paddingHorizontal: tokens.components.button.paddingHorizontal.medium,
  },

  size_large: {
    height: tokens.components.button.height.large,
    paddingHorizontal: tokens.components.button.paddingHorizontal.large,
  },

  variant_primary: {
    backgroundColor: tokens.colors.primary[600],
    ...tokens.elevation.sm,
  },

  variant_secondary: {
    backgroundColor: tokens.colors.surface.card,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },

  variant_ghost: {
    backgroundColor: 'transparent',
  },

  variant_destructive: {
    backgroundColor: tokens.colors.semantic.error,
    ...tokens.elevation.sm,
  },

  fullWidth: {
    width: '100%',
  },

  disabled: {
    opacity: 0.5,
  },

  text: {
    fontWeight: tokens.typography.fontWeight.semibold,
    textAlign: 'center',
    letterSpacing: tokens.typography.letterSpacing.normal,
  },

  textSize_small: {
    fontSize: tokens.typography.fontSize.bodySmall,
    lineHeight: tokens.typography.lineHeight.bodySmall,
  },

  textSize_medium: {
    fontSize: tokens.typography.fontSize.body,
    lineHeight: tokens.typography.lineHeight.body,
  },

  textSize_large: {
    fontSize: tokens.typography.fontSize.h4,
    lineHeight: tokens.typography.lineHeight.h4,
  },

  textVariant_primary: {
    color: tokens.colors.text.onPrimary,
  },

  textVariant_secondary: {
    color: tokens.colors.text.primary,
  },

  textVariant_ghost: {
    color: tokens.colors.primary[600],
  },

  textVariant_destructive: {
    color: tokens.colors.text.onError,
  },

  textDisabled: {
    color: tokens.colors.text.disabled,
  },
});

export default Button;
