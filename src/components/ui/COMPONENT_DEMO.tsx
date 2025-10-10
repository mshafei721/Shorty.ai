/**
 * Component Demo - Usage examples for Shorty.ai UI components
 *
 * This file demonstrates how to use the base component library.
 * Copy examples into your screens as needed.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Input,
  Card,
  BottomSheet,
  ProgressBar,
  StatusBadge,
} from './index';
import { tokens } from '@/design-system/tokens-mobile';

export const ComponentDemo = () => {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [progress, setProgress] = useState(45);
  const [inputValue, setInputValue] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Buttons Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buttons</Text>

          <Button
            title="Primary Button"
            onPress={() => console.log('Primary pressed')}
            variant="primary"
            size="medium"
          />

          <View style={styles.spacer} />

          <Button
            title="Secondary Button"
            onPress={() => console.log('Secondary pressed')}
            variant="secondary"
            size="medium"
          />

          <View style={styles.spacer} />

          <Button
            title="Ghost Button"
            onPress={() => console.log('Ghost pressed')}
            variant="ghost"
            size="medium"
          />

          <View style={styles.spacer} />

          <Button
            title="Delete"
            onPress={() => console.log('Delete pressed')}
            variant="destructive"
            size="medium"
          />

          <View style={styles.spacer} />

          <Button
            title="Loading..."
            onPress={() => {}}
            variant="primary"
            size="medium"
            loading
          />

          <View style={styles.spacer} />

          <Button
            title="Disabled"
            onPress={() => {}}
            variant="primary"
            size="medium"
            disabled
          />
        </View>

        {/* Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inputs</Text>

          <Input
            label="Email"
            placeholder="Enter your email"
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            placeholder="Enter password"
            secureTextEntry
            helperText="Must be at least 8 characters"
          />

          <Input
            label="Project Name"
            placeholder="My Video Project"
            variant="error"
            errorText="Project name is required"
          />

          <Input
            label="Video Title"
            placeholder="Title"
            variant="success"
            helperText="Great title!"
          />
        </View>

        {/* Cards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cards</Text>

          <Card variant="default">
            <Text style={styles.cardTitle}>Default Card</Text>
            <Text style={styles.cardBody}>
              This is a basic card with default styling.
            </Text>
          </Card>

          <View style={styles.spacer} />

          <Card variant="elevated">
            <Text style={styles.cardTitle}>Elevated Card</Text>
            <Text style={styles.cardBody}>
              This card has more shadow/elevation.
            </Text>
          </Card>

          <View style={styles.spacer} />

          <Card
            variant="default"
            interactive
            onPress={() => console.log('Card pressed')}
          >
            <Text style={styles.cardTitle}>Interactive Card</Text>
            <Text style={styles.cardBody}>
              Tap me! I have press animations and haptics.
            </Text>
          </Card>
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>

          <ProgressBar progress={progress} showPercentage />

          <View style={styles.spacer} />

          <View style={styles.buttonRow}>
            <Button
              title="-10%"
              onPress={() => setProgress(Math.max(0, progress - 10))}
              variant="secondary"
              size="small"
            />
            <Button
              title="+10%"
              onPress={() => setProgress(Math.min(100, progress + 10))}
              variant="secondary"
              size="small"
            />
          </View>
        </View>

        {/* Status Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Badges</Text>

          <View style={styles.badgeRow}>
            <StatusBadge status="idle" />
            <StatusBadge status="uploading" />
            <StatusBadge status="queued" />
          </View>

          <View style={styles.spacer} />

          <View style={styles.badgeRow}>
            <StatusBadge status="processing" />
            <StatusBadge status="complete" />
            <StatusBadge status="failed" />
          </View>
        </View>

        {/* Bottom Sheet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bottom Sheet</Text>

          <Button
            title="Open Bottom Sheet"
            onPress={() => setSheetVisible(true)}
            variant="primary"
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Bottom Sheet Example */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        size="medium"
        showHandle
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Bottom Sheet Title</Text>
          <Text style={styles.sheetBody}>
            This is a bottom sheet. You can:
            {'\n'}• Swipe down to dismiss
            {'\n'}• Tap the backdrop to close
            {'\n'}• Add any content here
          </Text>

          <View style={styles.spacer} />

          <Button
            title="Close"
            onPress={() => setSheetVisible(false)}
            variant="primary"
            fullWidth
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.surface.background,
  },

  scrollView: {
    flex: 1,
    padding: tokens.spacing.s4,
  },

  section: {
    marginBottom: tokens.spacing.s8,
  },

  sectionTitle: {
    fontSize: tokens.typography.fontSize.h2,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.s4,
  },

  spacer: {
    height: tokens.spacing.s3,
  },

  cardTitle: {
    fontSize: tokens.typography.fontSize.h4,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.s2,
  },

  cardBody: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text.secondary,
    lineHeight: tokens.typography.lineHeight.body,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.s2,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.s2,
  },

  sheetContent: {
    flex: 1,
  },

  sheetTitle: {
    fontSize: tokens.typography.fontSize.h2,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.s3,
  },

  sheetBody: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text.secondary,
    lineHeight: tokens.typography.lineHeight.body,
  },
});

export default ComponentDemo;
