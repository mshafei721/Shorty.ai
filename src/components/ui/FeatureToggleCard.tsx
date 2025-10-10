import React, { useState } from 'react';
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  WithTimingConfig,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/design-system/tokens-mobile';

export interface FeatureToggleCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  expandedContent?: React.ReactNode;
  testID?: string;
}

const timingConfig: WithTimingConfig = {
  duration: 300,
};

export const FeatureToggleCard: React.FC<FeatureToggleCardProps> = ({
  title,
  description,
  icon,
  enabled,
  onToggle,
  expandedContent,
  testID,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  const handleToggle = (value: boolean) => {
    onToggle(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (value && expandedContent && !isExpanded) {
      setIsExpanded(true);
      height.value = withTiming(120, timingConfig);
      opacity.value = withTiming(1, timingConfig);
    }
  };

  const handleCardPress = () => {
    if (!expandedContent) return;

    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    if (newExpanded) {
      height.value = withTiming(120, timingConfig);
      opacity.value = withTiming(1, timingConfig);
    } else {
      height.value = withTiming(0, timingConfig);
      opacity.value = withTiming(0, timingConfig);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container} testID={testID}>
      <Pressable
        onPress={handleCardPress}
        disabled={!expandedContent}
        style={styles.card}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${title} feature toggle`}
        accessibilityState={{ checked: enabled, expanded: isExpanded }}
      >
        <View style={styles.header}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}

          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{
              false: tokens.colors.neutral[600],
              true: tokens.colors.primary[600],
            }}
            thumbColor={tokens.colors.neutral[0]}
            ios_backgroundColor={tokens.colors.neutral[600]}
            accessibilityLabel={`Toggle ${title}`}
          />
        </View>

        {expandedContent && (
          <Animated.View style={[styles.expandedContent, animatedStyle]}>
            {expandedContent}
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.s3,
  },

  card: {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    ...tokens.elevation.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.s4,
    minHeight: 72,
  },

  iconContainer: {
    width: 40,
    height: 40,
    marginRight: tokens.spacing.s3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textContainer: {
    flex: 1,
    marginRight: tokens.spacing.s3,
  },

  title: {
    fontSize: tokens.typography.fontSize.h4,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.s1,
  },

  description: {
    fontSize: tokens.typography.fontSize.bodySmall,
    color: tokens.colors.text.secondary,
    lineHeight: tokens.typography.lineHeight.bodySmall,
  },

  expandedContent: {
    overflow: 'hidden',
    paddingHorizontal: tokens.spacing.s4,
    paddingBottom: tokens.spacing.s4,
  },
});

export default FeatureToggleCard;
