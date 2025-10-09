/**
 * Preview Screen
 *
 * Video player with caption overlay, draft generation, and playback controls.
 * Uses expo-video (SDK 54 compatible).
 *
 * @module features/m3/screens/PreviewScreen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { M3Preset } from '../types';
import type { VideoAsset } from '../../../storage/schema';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import {
  createInitialContext,
  transition,
  loadPreviewData,
  generateDraft,
  type PreviewMachineState,
} from '../state/previewMachine';

type RouteParams = {
  PreviewScreen: {
    projectId: string;
    assetId: string;
    rawVideoUri: string;
    preset: M3Preset;
  };
};

export default function PreviewScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RouteParams, 'PreviewScreen'>>();
  const { projectId, assetId, rawVideoUri, preset } = route.params;

  const [machine, setMachine] = useState<PreviewMachineState>({
    state: 'idle',
    context: createInitialContext(),
  });

  const [positionMs, setPositionMs] = useState(0);

  const videoSource = machine.context.draftArtifactUrl || rawVideoUri;
  const player = useVideoPlayer(videoSource, player => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (player) {
        setPositionMs(player.currentTime * 1000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player]);

  useEffect(() => {
    initializePreview();
  }, []);

  const initializePreview = async () => {
    try {
      const next = await transition(machine, {
        type: 'LOAD_DATA',
        projectId,
        assetId,
        rawVideoUri,
      });
      setMachine(next);

      const data = await loadPreviewData(projectId, assetId);

      const ready = await transition(
        { ...next, context: { ...next.context, ...data } },
        { type: 'DATA_OK' }
      );
      setMachine(ready);
    } catch (error) {
      const err = await transition(machine, {
        type: 'DATA_ERR',
        error: error instanceof Error ? error.message : 'Failed to load preview data',
      });
      setMachine(err);
    }
  };

  const handleGenerateDraft = async () => {
    try {
      const generating = await transition(machine, {
        type: 'GENERATE_DRAFT',
        preset,
      });
      setMachine(generating);

      const artifactUrl = await generateDraft(projectId, assetId, preset, pct => {
        setMachine(prev => ({
          ...prev,
          context: { ...prev.context, progressPct: pct },
        }));
      });

      const done = await transition(machine, {
        type: 'DRAFT_OK',
        artifactUrl,
      });
      setMachine(done);

      Alert.alert('Success', 'Draft render complete!');
    } catch (error) {
      const err = await transition(machine, {
        type: 'DRAFT_ERR',
        error: error instanceof Error ? error.message : 'Draft generation failed',
      });
      setMachine(err);
      Alert.alert('Error', machine.context.error || 'Failed to generate draft');
    }
  };

  const handlePlayPause = () => {
    if (!player) return;

    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleExport = async () => {
    try {
      const videoToExport = machine.context.draftArtifactUrl || rawVideoUri;

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(videoToExport, {
          mimeType: 'video/mp4',
          dialogTitle: 'Share your video',
        });

        await updateVideoExportTimestamp();

        Alert.alert(
          'Success',
          'Video shared successfully! Returning to dashboard...',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ProjectDashboard', { projectId }),
            },
          ]
        );
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(videoToExport);
          await updateVideoExportTimestamp();

          Alert.alert(
            'Success',
            'Video saved to your media library! Returning to dashboard...',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('ProjectDashboard', { projectId }),
              },
            ]
          );
        } else {
          Alert.alert('Permission Denied', 'Cannot save video without media library permission.');
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Failed to export video. Please try again.');
    }
  };

  const updateVideoExportTimestamp = async () => {
    try {
      const videosJson = await AsyncStorage.getItem('videos');
      if (videosJson) {
        const videos: VideoAsset[] = JSON.parse(videosJson);
        const updatedVideos = videos.map(v =>
          v.id === assetId
            ? { ...v, exportedAt: new Date().toISOString() }
            : v
        );
        await AsyncStorage.setItem('videos', JSON.stringify(updatedVideos));
      }
    } catch (error) {
      console.error('Failed to update export timestamp:', error);
    }
  };

  const getCurrentCaption = (): string | null => {
    const { transcript } = machine.context;
    if (!transcript || !preset.captions.enabled) return null;

    const token = transcript.tokens.find(
      t => positionMs >= t.startMs && positionMs <= t.endMs
    );

    if (!token) return null;

    const index = transcript.tokens.indexOf(token);
    const windowSize = 5;
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(transcript.tokens.length, start + windowSize);

    return transcript.tokens
      .slice(start, end)
      .map(t => t.text)
      .join(' ');
  };

  const caption = getCurrentCaption();

  return (
    <View style={styles.container}>
      {/* Loading State */}
      {machine.state === 'loading_data' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading preview data...</Text>
        </View>
      )}

      {/* Error State */}
      {machine.state === 'error' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{machine.context.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializePreview}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Ready/Playing State */}
      {(machine.state === 'ready' ||
        machine.state === 'draft_ready' ||
        machine.state === 'generating_draft') && (
        <>
          {/* Video Player */}
          <View style={styles.playerContainer}>
            <VideoView
              style={styles.video}
              player={player}
              contentFit="contain"
              nativeControls={false}
            />

            {/* Caption Overlay */}
            {caption && (
              <View
                style={[
                  styles.captionContainer,
                  preset.captions.style === 'boxed' && styles.captionBoxed,
                ]}
              >
                <Text
                  style={[
                    styles.captionText,
                    { fontSize: preset.captions.size },
                    preset.captions.style === 'shadow' && styles.captionShadow,
                    preset.captions.style === 'outline' && styles.captionOutline,
                  ]}
                  testID="caption-text"
                >
                  {caption}
                </Text>
              </View>
            )}

            {/* Play/Pause Button */}
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              testID="play-pause-button"
            >
              <Text style={styles.playButtonText}>
                {player?.playing ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Generating Draft Overlay */}
          {machine.state === 'generating_draft' && (
            <View style={styles.generatingOverlay}>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.generatingText}>
                Generating draft... {machine.context.progressPct}%
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {machine.state === 'ready' && (
              <TouchableOpacity
                style={styles.draftButton}
                onPress={handleGenerateDraft}
                testID="generate-draft-button"
              >
                <Text style={styles.draftButtonText}>Generate Draft</Text>
              </TouchableOpacity>
            )}

            {machine.state === 'draft_ready' && (
              <View style={styles.draftReady}>
                <Text style={styles.draftReadyText}>✓ Draft Ready</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExport}
              testID="export-button"
            >
              <Text style={styles.exportButtonText}>Share Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              testID="back-button"
            >
              <Text style={styles.backButtonText}>← Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  playerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    aspectRatio: 9 / 16,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  captionBoxed: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
  },
  captionText: {
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  captionShadow: {
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  captionOutline: {
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playButton: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 32,
    color: '#FFF',
  },
  generatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatingText: {
    color: '#FFF',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  draftButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  draftButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  draftReady: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  draftReadyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
