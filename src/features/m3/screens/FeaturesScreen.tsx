/**
 * Features Selection Screen
 *
 * Allows users to configure editing features (filler removal, captions, etc.)
 * and persist presets per project.
 *
 * @module features/m3/screens/FeaturesScreen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import type { M3Preset, CaptionStyle } from '../types';
import { DEFAULT_M3_PRESET } from '../types';
import { loadPreset, savePreset, resetPreset } from '../storage/presetStorage';

type RouteParams = {
  FeaturesScreen: {
    projectId: string;
    assetId: string;
    rawVideoUri: string;
  };
};

export default function FeaturesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'FeaturesScreen'>>();
  const { projectId, assetId, rawVideoUri } = route.params;

  const [preset, setPreset] = useState<M3Preset>(DEFAULT_M3_PRESET);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresetData();
  }, [projectId]);

  const loadPresetData = async () => {
    try {
      const loaded = await loadPreset(projectId);
      setPreset(loaded);
    } catch (error) {
      console.error('Failed to load preset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await savePreset(projectId, preset);
      Alert.alert('Success', 'Preset saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save preset');
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset Preset',
      'Are you sure you want to reset to default settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetPreset(projectId);
              setPreset({ ...DEFAULT_M3_PRESET });
              Alert.alert('Success', 'Preset reset to defaults');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset preset');
            }
          },
        },
      ]
    );
  };

  const handlePreview = () => {
    navigation.navigate('Preview', {
      projectId,
      assetId,
      rawVideoUri,
      preset,
    });
  };

  const toggleCaptionStyle = () => {
    const styles: CaptionStyle[] = ['boxed', 'shadow', 'outline'];
    const currentIndex = styles.indexOf(preset.captions.style);
    const nextIndex = (currentIndex + 1) % styles.length;
    setPreset({
      ...preset,
      captions: { ...preset.captions, style: styles[nextIndex] },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading preset...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Features</Text>

        {/* Filler Removal */}
        <View style={styles.control}>
          <View style={styles.controlHeader}>
            <Text style={styles.controlLabel}>Remove Fillers</Text>
            <Switch
              value={preset.fillerRemoval}
              onValueChange={val => setPreset({ ...preset, fillerRemoval: val })}
              testID="filler-removal-toggle"
            />
          </View>
          <Text style={styles.controlDesc}>Remove "um", "uh", and other filler words</Text>
        </View>

        {/* Jump Cuts */}
        <View style={styles.control}>
          <View style={styles.controlHeader}>
            <Text style={styles.controlLabel}>Jump Cuts</Text>
            <Switch
              value={preset.jumpCuts}
              onValueChange={val => setPreset({ ...preset, jumpCuts: val })}
              testID="jump-cuts-toggle"
            />
          </View>
          <Text style={styles.controlDesc}>Enable jump-cuts at detected dead air</Text>
        </View>

        {/* Intro/Outro */}
        <View style={styles.control}>
          <View style={styles.controlHeader}>
            <Text style={styles.controlLabel}>Intro/Outro</Text>
            <Switch
              value={preset.introOutro}
              onValueChange={val => setPreset({ ...preset, introOutro: val })}
              testID="intro-outro-toggle"
            />
          </View>
          <Text style={styles.controlDesc}>Apply brand intro and outro</Text>
        </View>

        {/* Captions */}
        <View style={styles.control}>
          <View style={styles.controlHeader}>
            <Text style={styles.controlLabel}>Show Captions</Text>
            <Switch
              value={preset.captions.enabled}
              onValueChange={val =>
                setPreset({
                  ...preset,
                  captions: { ...preset.captions, enabled: val },
                })
              }
              testID="captions-toggle"
            />
          </View>
          <Text style={styles.controlDesc}>Display captions during preview</Text>
        </View>

        {/* Caption Size */}
        {preset.captions.enabled && (
          <View style={styles.control}>
            <Text style={styles.controlLabel}>
              Caption Size: {preset.captions.size}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={12}
              maximumValue={32}
              step={1}
              value={preset.captions.size}
              onValueChange={val =>
                setPreset({
                  ...preset,
                  captions: { ...preset.captions, size: val },
                })
              }
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E5E5EA"
              testID="caption-size-slider"
            />
          </View>
        )}

        {/* Caption Style */}
        {preset.captions.enabled && (
          <View style={styles.control}>
            <Text style={styles.controlLabel}>Caption Style</Text>
            <TouchableOpacity
              style={styles.styleButton}
              onPress={toggleCaptionStyle}
              testID="caption-style-button"
            >
              <Text style={styles.styleButtonText}>
                {preset.captions.style.charAt(0).toUpperCase() +
                  preset.captions.style.slice(1)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Frame Margin */}
        <View style={styles.control}>
          <Text style={styles.controlLabel}>Frame Margin: {preset.frameMarginPx}px</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={48}
            step={2}
            value={preset.frameMarginPx}
            onValueChange={val => setPreset({ ...preset, frameMarginPx: val })}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E5E5EA"
            testID="frame-margin-slider"
          />
          <Text style={styles.controlDesc}>Margin around video frame</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={handleReset}
          testID="reset-button"
        >
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          testID="save-button"
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.previewButton]}
          onPress={handlePreview}
          testID="preview-button"
        >
          <Text style={styles.buttonText}>Preview →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
  },
  control: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  controlLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  controlDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  styleButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  styleButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFF',
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: '#F5F5F5',
  },
  resetButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  previewButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
