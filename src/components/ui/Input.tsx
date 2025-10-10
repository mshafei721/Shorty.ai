import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  WithTimingConfig,
} from 'react-native-reanimated';
import { tokens } from '@/design-system/tokens-mobile';

type InputVariant = 'default' | 'error' | 'success';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  variant?: InputVariant;
  disabled?: boolean;
  fullWidth?: boolean;
  testID?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const timingConfig: WithTimingConfig = {
  duration: 200,
};

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorText,
  variant = 'default',
  disabled = false,
  fullWidth = true,
  testID,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderOpacity = useSharedValue(0.1);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor:
      variant === 'error'
        ? tokens.colors.border.error
        : variant === 'success'
        ? tokens.colors.border.success
        : isFocused
        ? tokens.colors.border.focus
        : `rgba(255, 255, 255, ${borderOpacity.value})`,
  }));

  const handleFocus = (e: any) => {
    setIsFocused(true);
    borderOpacity.value = withTiming(1, timingConfig);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    borderOpacity.value = withTiming(0.1, timingConfig);
    onBlur?.(e);
  };

  const containerStyle: ViewStyle[] = [
    styles.container,
    fullWidth && styles.fullWidth,
  ];

  const inputContainerStyle: ViewStyle[] = [
    styles.inputContainer,
    disabled && styles.inputDisabled,
  ];

  const inputStyle: TextStyle[] = [
    styles.input,
    disabled && styles.textDisabled,
  ];

  const displayHelperText = errorText || helperText;
  const helperTextColor =
    variant === 'error'
      ? tokens.colors.semantic.error
      : tokens.colors.text.secondary;

  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={styles.label}
          accessibilityLabel={`${label} input field`}
        >
          {label}
        </Text>
      )}
      <AnimatedView
        style={[inputContainerStyle, animatedBorderStyle]}
      >
        <TextInput
          {...textInputProps}
          style={inputStyle}
          placeholderTextColor={tokens.colors.text.tertiary}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          testID={testID}
          accessibilityState={{ disabled }}
          accessible
        />
      </AnimatedView>
      {displayHelperText && (
        <Text
          style={[styles.helperText, { color: helperTextColor }]}
          accessibilityLiveRegion={variant === 'error' ? 'polite' : 'off'}
          accessibilityLabel={
            variant === 'error' ? `Error: ${errorText}` : helperText
          }
        >
          {displayHelperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.s4,
  },

  fullWidth: {
    width: '100%',
  },

  label: {
    fontSize: tokens.typography.fontSize.bodySmall,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.s2,
    letterSpacing: tokens.typography.letterSpacing.normal,
  },

  inputContainer: {
    height: tokens.components.input.height,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    paddingHorizontal: tokens.components.input.paddingHorizontal,
    paddingVertical: tokens.components.input.paddingVertical,
    justifyContent: 'center',
  },

  inputDisabled: {
    opacity: 0.5,
  },

  input: {
    fontSize: tokens.typography.fontSize.body,
    lineHeight: tokens.typography.lineHeight.body,
    color: tokens.colors.text.primary,
    fontWeight: tokens.typography.fontWeight.regular,
    padding: 0,
    margin: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },

  textDisabled: {
    color: tokens.colors.text.disabled,
  },

  helperText: {
    fontSize: tokens.typography.fontSize.caption,
    lineHeight: tokens.typography.lineHeight.caption,
    marginTop: tokens.spacing.s2,
    marginLeft: tokens.spacing.s2,
  },
});

export default Input;
