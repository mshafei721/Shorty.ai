import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { tokens } from '@/design-system/tokens-mobile';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
  testID?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = tokens.colors.accent[500],
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  showPercentage = true,
  children,
  testID,
}) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    animatedProgress.value = withTiming(clampedProgress, { duration: 400 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset =
      circumference - (animatedProgress.value / 100) * circumference;
    return {
      strokeDashoffset,
    };
  });

  const center = size / 2;
  const roundedProgress = Math.round(progress);

  return (
    <View style={[styles.container, { width: size, height: size }]} testID={testID}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      <View style={styles.content}>
        {children || (
          showPercentage && (
            <Text
              style={styles.percentage}
              accessibilityLabel={`Progress ${roundedProgress} percent`}
              accessibilityLiveRegion="polite"
            >
              {roundedProgress}%
            </Text>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  percentage: {
    fontSize: tokens.typography.fontSize.h2,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
});

export default CircularProgress;
