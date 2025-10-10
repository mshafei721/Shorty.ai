import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  cancelAnimation,
  WithSpringConfig,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/design-system/tokens-mobile';

export type RecordingState = 'idle' | 'recording' | 'paused';

export interface RecordingButtonProps {
  state: RecordingState;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const springConfig: WithSpringConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

const getStateColors = (state: RecordingState) => {
  switch (state) {
    case 'idle':
      return {
        outer: tokens.colors.neutral[0],
        inner: tokens.colors.neutral[0],
      };
    case 'recording':
      return {
        outer: tokens.colors.semantic.recording,
        inner: tokens.colors.semantic.recording,
      };
    case 'paused':
      return {
        outer: tokens.colors.semantic.warning,
        inner: tokens.colors.semantic.warning,
      };
  }
};

export const RecordingButton: React.FC<RecordingButtonProps> = ({
  state,
  onPress,
  disabled = false,
  testID,
}) => {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (state === 'recording') {
      pulseScale.value = withRepeat(
        withTiming(
          tokens.animation.recordButton.pulseScale,
          { duration: tokens.animation.recordButton.pulseDuration }
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withTiming(0, { duration: tokens.animation.recordButton.pulseDuration }),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = 1;
      pulseOpacity.value = 0;
    }
  }, [state]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(tokens.animation.recordButton.pressScale, springConfig);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1.0, springConfig);
  };

  const handlePress = () => {
    if (disabled) return;
    onPress();
  };

  const colors = getStateColors(state);

  return (
    <View style={styles.container} testID={testID}>
      {/* Pulse Ring (only visible when recording) */}
      {state === 'recording' && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              backgroundColor: colors.outer,
              opacity: 0.8,
            },
            animatedPulseStyle,
          ]}
        />
      )}

      {/* Main Button */}
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.button,
          { backgroundColor: colors.outer },
          disabled && styles.disabled,
          animatedButtonStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          state === 'idle'
            ? 'Start recording'
            : state === 'recording'
            ? 'Pause recording'
            : 'Resume recording'
        }
        accessibilityState={{
          disabled,
          busy: state === 'recording',
        }}
      >
        <View
          style={[
            styles.innerCircle,
            { backgroundColor: colors.inner },
            state === 'paused' && styles.pausedSquare,
          ]}
        />
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: tokens.components.recordButton.size,
    height: tokens.components.recordButton.size,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pulseRing: {
    position: 'absolute',
    width: tokens.components.recordButton.size,
    height: tokens.components.recordButton.size,
    borderRadius: tokens.components.recordButton.size / 2,
  },

  button: {
    width: tokens.components.recordButton.size,
    height: tokens.components.recordButton.size,
    borderRadius: tokens.components.recordButton.size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.elevation.md,
  },

  innerCircle: {
    width: tokens.components.recordButton.innerCircleSize,
    height: tokens.components.recordButton.innerCircleSize,
    borderRadius: tokens.components.recordButton.innerCircleSize / 2,
  },

  pausedSquare: {
    borderRadius: tokens.radius.sm,
  },

  disabled: {
    opacity: 0.5,
  },
});

export default RecordingButton;
