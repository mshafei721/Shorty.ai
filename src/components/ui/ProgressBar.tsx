import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  WithTimingConfig,
} from 'react-native-reanimated';
import { tokens } from '@/design-system/tokens-mobile';

export interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
  testID?: string;
}

const timingConfig: WithTimingConfig = {
  duration: 400,
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = true,
  height = 6,
  color = tokens.colors.accent[500],
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  testID,
}) => {
  const width = useSharedValue(0);

  useEffect(() => {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    width.value = withTiming(clampedProgress, timingConfig);
  }, [progress]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const trackStyle: ViewStyle = {
    height,
    backgroundColor,
  };

  const fillStyle: ViewStyle = {
    height,
    backgroundColor: color,
  };

  const roundedProgress = Math.round(progress);

  return (
    <View style={styles.container} testID={testID}>
      {showPercentage && (
        <Text
          style={styles.percentage}
          accessibilityLabel={`Progress ${roundedProgress} percent`}
          accessibilityLiveRegion="polite"
        >
          {roundedProgress}%
        </Text>
      )}
      <View
        style={[styles.track, trackStyle]}
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: roundedProgress,
        }}
      >
        <Animated.View
          style={[styles.fill, fillStyle, animatedFillStyle]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  percentage: {
    fontSize: tokens.typography.fontSize.h4,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.s2,
    textAlign: 'center',
  },

  track: {
    width: '100%',
    borderRadius: tokens.radius.xs,
    overflow: 'hidden',
  },

  fill: {
    borderRadius: tokens.radius.xs,
  },
});

export default ProgressBar;
