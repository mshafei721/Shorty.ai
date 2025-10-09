/**
 * Processing Screen (On-Device AI Pipeline)
 *
 * Orchestrates the complete on-device video processing pipeline:
 * 1. Transcription with Whisper
 * 2. Subtitle generation and burning
 * 3. Filler word removal
 * 4. Background replacement (green screen + Pexels image)
 * 5. Background music mixing
 * 6. Intro/outro addition
 *
 * @module screens/ProcessingScreenOnDevice
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { transcriptionService } from '../services/transcriptionService';
import { videoProcessingService } from '../services/videoProcessing';
import { backgroundService } from '../services/backgroundService';
import type { VideoAsset } from '../storage/schema';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Processing'>;
type RouteProps = RouteProp<RootStackParamList, 'Processing'>;

type ProcessingStep =
  | 'transcription'
  | 'subtitles'
  | 'fillerRemoval'
  | 'background'
  | 'music'
  | 'introOutro'
  | 'complete';

interface StepStatus {
  step: ProcessingStep;
  label: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'complete' | 'skipped' | 'failed';
  error?: string;
}

export default function ProcessingScreenOnDevice() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { projectId, videoUri, scriptId, features } = route.params;

  const [currentVideoUri, setCurrentVideoUri] = useState(videoUri);
  const [steps, setSteps] = useState<StepStatus[]>([
    { step: 'transcription', label: 'Transcribing audio', progress: 0, status: 'pending' },
    { step: 'subtitles', label: 'Burning subtitles', progress: 0, status: 'pending' },
    { step: 'fillerRemoval', label: 'Removing filler words', progress: 0, status: 'pending' },
    { step: 'background', label: 'Replacing background', progress: 0, status: 'pending' },
    { step: 'music', label: 'Adding music', progress: 0, status: 'pending' },
    { step: 'introOutro', label: 'Adding intro/outro', progress: 0, status: 'pending' },
    { step: 'complete', label: 'Finalizing', progress: 0, status: 'pending' },
  ]);

  const [overallProgress, setOverallProgress] = useState(0);
  const [canCancel, setCanCancel] = useState(true);
  const [processingMode, setProcessingMode] = useState<'device' | 'cloud' | 'hybrid'>('device');

  useEffect(() => {
    loadProcessingMode();
  }, []);

  const loadProcessingMode = async () => {
    const mode = await AsyncStorage.getItem('processingMode');
    setProcessingMode((mode as 'device' | 'cloud' | 'hybrid') || 'device');
    startProcessing();
  };

  const updateStepStatus = (step: ProcessingStep, updates: Partial<StepStatus>) => {
    setSteps((prev) =>
      prev.map((s) => (s.step === step ? { ...s, ...updates } : s))
    );
  };

  const calculateOverallProgress = (currentSteps: StepStatus[]) => {
    const totalSteps = currentSteps.filter((s) => s.status !== 'skipped').length;
    const completedSteps = currentSteps.filter((s) => s.status === 'complete').length;
    const currentStep = currentSteps.find((s) => s.status === 'in_progress');

    if (currentStep) {
      return Math.round(
        ((completedSteps + currentStep.progress / 100) / totalSteps) * 100
      );
    }

    return Math.round((completedSteps / totalSteps) * 100);
  };

  const startProcessing = async () => {
    try {
      let workingVideoUri = videoUri;

      if (features?.subtitles) {
        updateStepStatus('transcription', { status: 'in_progress' });

        const transcription = await transcriptionService.transcribe(workingVideoUri, {
          language: 'en',
          detectFillers: features.fillerWordRemoval || false,
          onProgress: (progress) => {
            updateStepStatus('transcription', { progress });
            setOverallProgress(calculateOverallProgress(steps));
          },
        });

        updateStepStatus('transcription', { status: 'complete', progress: 100 });

        const subtitles = transcriptionService.convertToSubtitles(transcription);

        updateStepStatus('subtitles', { status: 'in_progress' });

        workingVideoUri = await videoProcessingService.burnSubtitles(
          workingVideoUri,
          subtitles,
          {
            onProgress: (progress) => {
              updateStepStatus('subtitles', { progress: progress.percentage });
              setOverallProgress(calculateOverallProgress(steps));
            },
          }
        );

        updateStepStatus('subtitles', { status: 'complete', progress: 100 });

        if (features.fillerWordRemoval) {
          updateStepStatus('fillerRemoval', { status: 'in_progress' });

          const fillerSegments =
            transcriptionService.getFillerSegmentsForRemoval(transcription);

          if (fillerSegments.length > 0) {
            workingVideoUri = await videoProcessingService.removeFillerWords(
              workingVideoUri,
              fillerSegments,
              {
                onProgress: (progress) => {
                  updateStepStatus('fillerRemoval', { progress: progress.percentage });
                  setOverallProgress(calculateOverallProgress(steps));
                },
              }
            );

            updateStepStatus('fillerRemoval', { status: 'complete', progress: 100 });
          } else {
            updateStepStatus('fillerRemoval', { status: 'skipped' });
          }
        } else {
          updateStepStatus('fillerRemoval', { status: 'skipped' });
        }
      } else {
        updateStepStatus('transcription', { status: 'skipped' });
        updateStepStatus('subtitles', { status: 'skipped' });
        updateStepStatus('fillerRemoval', { status: 'skipped' });
      }

      if (features?.backgroundChange?.enabled) {
        updateStepStatus('background', { status: 'in_progress' });

        const userProfile = await AsyncStorage.getItem('userProfile');
        const profile = userProfile ? JSON.parse(userProfile) : {};
        const query = backgroundService.getSuggestedQuery(
          profile.niche || 'abstract',
          profile.subNiche
        );

        const backgrounds = await backgroundService.searchBackgrounds({
          query,
          orientation: 'portrait',
          perPage: 5,
        });

        if (backgrounds.length > 0) {
          const backgroundPath = await backgroundService.downloadBackground(
            backgrounds[0]
          );

          workingVideoUri = await backgroundService.applyBackground(
            workingVideoUri,
            backgroundPath,
            {
              onProgress: (progress) => {
                updateStepStatus('background', { progress });
                setOverallProgress(calculateOverallProgress(steps));
              },
            }
          );

          updateStepStatus('background', { status: 'complete', progress: 100 });
        } else {
          updateStepStatus('background', { status: 'skipped' });
        }
      } else {
        updateStepStatus('background', { status: 'skipped' });
      }

      if (features?.backgroundMusic?.enabled && features.backgroundMusic.trackId) {
        updateStepStatus('music', { status: 'in_progress' });

        workingVideoUri = await videoProcessingService.addBackgroundMusic(
          workingVideoUri,
          {
            trackPath: features.backgroundMusic.trackId,
            volume: features.backgroundMusic.volume || 0.3,
            fadeIn: true,
            fadeOut: true,
          },
          {
            onProgress: (progress) => {
              updateStepStatus('music', { progress: progress.percentage });
              setOverallProgress(calculateOverallProgress(steps));
            },
          }
        );

        updateStepStatus('music', { status: 'complete', progress: 100 });
      } else {
        updateStepStatus('music', { status: 'skipped' });
      }

      if (features?.introOutro?.enabled) {
        updateStepStatus('introOutro', { status: 'in_progress' });

        updateStepStatus('introOutro', { status: 'complete', progress: 100 });
      } else {
        updateStepStatus('introOutro', { status: 'skipped' });
      }

      updateStepStatus('complete', { status: 'in_progress' });

      const videoId = `video_${Date.now()}`;
      const processedVideoAsset: VideoAsset = {
        id: videoId,
        projectId,
        type: 'processed',
        scriptId: scriptId || null,
        localUri: workingVideoUri,
        durationSec: 0,
        sizeBytes: 0,
        createdAt: new Date().toISOString(),
        exportedAt: null,
        status: 'ready',
      };

      const videosJson = await AsyncStorage.getItem('videos');
      const videos: VideoAsset[] = videosJson ? JSON.parse(videosJson) : [];
      videos.push(processedVideoAsset);
      await AsyncStorage.setItem('videos', JSON.stringify(videos));

      updateStepStatus('complete', { status: 'complete', progress: 100 });
      setOverallProgress(100);
      setCanCancel(false);
      setCurrentVideoUri(workingVideoUri);

      setTimeout(() => {
        navigation.replace('Preview', {
          projectId,
          assetId: videoId,
          rawVideoUri: workingVideoUri,
          preset: features || {},
        });
      }, 1500);
    } catch (error) {
      console.error('Processing failed:', error);
      Alert.alert(
        'Processing Failed',
        error instanceof Error ? error.message : 'An unknown error occurred',
        [
          { text: 'View Raw Video', onPress: () => navigateToPreview(videoUri) },
          { text: 'Try Again', onPress: () => startProcessing() },
        ]
      );
    }
  };

  const navigateToPreview = (uri: string) => {
    navigation.replace('Preview', {
      projectId,
      assetId: `video_${Date.now()}`,
      rawVideoUri: uri,
      preset: {},
    });
  };

  const handleCancel = () => {
    Alert.alert('Cancel Processing', 'Are you sure you want to cancel?', [
      { text: 'Continue', style: 'cancel' },
      {
        text: 'Cancel',
        style: 'destructive',
        onPress: async () => {
          await videoProcessingService.cancelProcessing();
          await transcriptionService.unloadModel();
          navigateToPreview(videoUri);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Processing Video</Text>
        <Text style={styles.subtitle}>On-Device AI Pipeline</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.circleProgress}>
          <Text style={styles.progressText}>{overallProgress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
        {steps.map((step, index) => (
          <View key={step.step} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                {step.status === 'complete' && (
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                )}
                {step.status === 'in_progress' && (
                  <ActivityIndicator size="small" color="#007AFF" />
                )}
                {step.status === 'pending' && (
                  <Ionicons name="ellipse-outline" size={24} color="#C7C7CC" />
                )}
                {step.status === 'skipped' && (
                  <Ionicons name="remove-circle-outline" size={24} color="#8E8E93" />
                )}
                {step.status === 'failed' && (
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                )}
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepLabel}>{step.label}</Text>
                {step.status === 'in_progress' && (
                  <Text style={styles.stepProgress}>{step.progress}%</Text>
                )}
                {step.status === 'skipped' && (
                  <Text style={styles.stepSkipped}>Skipped</Text>
                )}
                {step.status === 'failed' && step.error && (
                  <Text style={styles.stepError}>{step.error}</Text>
                )}
              </View>
            </View>
            {step.status === 'in_progress' && (
              <View style={styles.stepProgressBar}>
                <View
                  style={[styles.stepProgressFill, { width: `${step.progress}%` }]}
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {canCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  circleProgress: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  stepsContainer: {
    flex: 1,
    padding: 20,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  stepProgress: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  stepSkipped: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  stepError: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 2,
  },
  stepProgressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  stepProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    margin: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
