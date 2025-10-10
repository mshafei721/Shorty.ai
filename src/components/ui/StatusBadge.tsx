import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { tokens } from '@/design-system/tokens-mobile';

export type StatusType =
  | 'idle'
  | 'uploading'
  | 'queued'
  | 'processing'
  | 'complete'
  | 'failed'
  | 'cancelled';

export interface StatusBadgeProps {
  status: StatusType;
  testID?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; backgroundColor: string; textColor: string }
> = {
  idle: {
    label: 'IDLE',
    backgroundColor: tokens.colors.neutral[600],
    textColor: tokens.colors.text.secondary,
  },
  uploading: {
    label: 'UPLOADING',
    backgroundColor: tokens.colors.accent[500],
    textColor: tokens.colors.text.onAccent,
  },
  queued: {
    label: 'QUEUED',
    backgroundColor: tokens.colors.neutral[600],
    textColor: tokens.colors.text.secondary,
  },
  processing: {
    label: 'PROCESSING',
    backgroundColor: tokens.colors.accent[500],
    textColor: tokens.colors.text.onAccent,
  },
  complete: {
    label: 'COMPLETE',
    backgroundColor: tokens.colors.semantic.success,
    textColor: tokens.colors.text.onSuccess,
  },
  failed: {
    label: 'FAILED',
    backgroundColor: tokens.colors.semantic.error,
    textColor: tokens.colors.text.onError,
  },
  cancelled: {
    label: 'CANCELLED',
    backgroundColor: tokens.colors.neutral[600],
    textColor: tokens.colors.text.secondary,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  testID,
}) => {
  const config = statusConfig[status];

  const badgeStyle: ViewStyle = {
    backgroundColor: config.backgroundColor,
  };

  const textStyleCustom: TextStyle = {
    color: config.textColor,
  };

  return (
    <View
      style={[styles.badge, badgeStyle]}
      testID={testID}
      accessible
      accessibilityLabel={`Status: ${config.label}`}
      accessibilityRole="text"
    >
      <Text style={[styles.text, textStyleCustom]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: tokens.spacing.s2,
    paddingVertical: tokens.spacing.s1,
    borderRadius: tokens.radius.xs,
    alignSelf: 'flex-start',
  },

  text: {
    fontSize: tokens.typography.fontSize.label,
    fontWeight: tokens.typography.fontWeight.semibold,
    letterSpacing: tokens.typography.letterSpacing.wide,
    lineHeight: tokens.typography.lineHeight.label,
  },
});

export default StatusBadge;
