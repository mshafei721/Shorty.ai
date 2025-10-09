import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import {
  uploadVideo,
  createProcessingJob,
  pollJobStatus,
  cancelProcessingJob,
} from '../services/videoProcessing';
import type { ProcessingJob, FeatureSelections, VideoAsset } from '../storage/schema';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Processing'>;
type RouteProps = RouteProp<RootStackParamList, 'Processing'>;

export default function ProcessingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { projectId, videoUri, scriptId, features } = route.params;

  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [status, setStatus] = useState<'uploading' | 'queued' | 'processing' | 'complete' | 'failed'>('uploading');
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [estimatedTimeMs, setEstimatedTimeMs] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    startProcessing();

    return () => {
      if (jobId && status !== 'complete' && status !== 'failed') {
        cancelProcessingJob(jobId).catch(console.error);
      }
    };
  }, []);

  const startProcessing = async () => {
    try {
      setStatus('uploading');
      setError(null);

      // Try to upload to backend, but continue to preview if it fails
      try {
        const uploadedUrl = await uploadVideo(videoUri, projectId, (progress) => {
          setUploadProgress(Math.round(progress.percentage));
        });

        const videoId = `video_${Date.now()}`;
        setStatus('queued');

        const job = await createProcessingJob(videoId, features || {
          subtitles: true,
          backgroundChange: { enabled: false, presetId: null },
          backgroundMusic: { enabled: false, trackId: null, volume: 0.5 },
          introOutro: { enabled: false, templateId: null },
          fillerWordRemoval: true,
        });

        setJobId(job.id);
        setStatus('processing');

        const completedJob = await pollJobStatus(job.id, (updatedJob) => {
          setProcessingProgress(updatedJob.progress);
          if (updatedJob.status === 'processing') {
            const elapsed = Date.now() - new Date(updatedJob.startedAt).getTime();
            const estimated = (elapsed / updatedJob.progress) * (100 - updatedJob.progress);
            setEstimatedTimeMs(estimated);
          }
        });

        setStatus('complete');

        const processedVideoAsset: VideoAsset = {
          id: videoId,
          projectId,
          type: 'processed',
          scriptId: scriptId || null,
          localUri: completedJob.id,
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
      } catch (backendError) {
        console.log('Backend processing not available, skipping to preview with raw video');
      }

      // Always navigate to preview with the raw video (processed or not)
      setTimeout(() => {
        const videoId = `video_${Date.now()}`;
        navigation.replace('Preview', {
          projectId,
          assetId: videoId,
          rawVideoUri: videoUri,
          preset: features,
        });
      }, 1000);

    } catch (err) {
      console.error('Processing failed:', err);
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Processing failed');
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    startProcessing();
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Processing',
      'Are you sure you want to cancel? Your raw video will be saved.',
      [
        { text: 'Continue Processing', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              if (jobId) {
                await cancelProcessingJob(jobId);
              }

              const rawVideoAsset: VideoAsset = {
                id: `video_${Date.now()}`,
                projectId,
                type: 'raw',
                scriptId: scriptId || null,
                localUri: videoUri,
                durationSec: 0,
                sizeBytes: 0,
                createdAt: new Date().toISOString(),
                exportedAt: null,
                status: 'cancelled',
              };

              const videosJson = await AsyncStorage.getItem('videos');
              const videos: VideoAsset[] = videosJson ? JSON.parse(videosJson) : [];
              videos.push(rawVideoAsset);
              await AsyncStorage.setItem('videos', JSON.stringify(videos));

              navigation.navigate('ProjectDashboard', { projectId });
            } catch (error) {
              console.error('Failed to cancel:', error);
            }
          },
        },
      ]
    );
  };

  const handleKeepRawVideo = async () => {
    try {
      const rawVideoAsset: VideoAsset = {
        id: `video_${Date.now()}`,
        projectId,
        type: 'raw',
        scriptId: scriptId || null,
        localUri: videoUri,
        durationSec: 0,
        sizeBytes: 0,
        createdAt: new Date().toISOString(),
        exportedAt: null,
        status: 'failed',
      };

      const videosJson = await AsyncStorage.getItem('videos');
      const videos: VideoAsset[] = videosJson ? JSON.parse(videosJson) : [];
      videos.push(rawVideoAsset);
      await AsyncStorage.setItem('videos', JSON.stringify(videos));

      navigation.navigate('ProjectDashboard', { projectId });
    } catch (error) {
      console.error('Failed to save raw video:', error);
      Alert.alert('Error', 'Failed to save video. Please try again.');
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === 'uploading' && (
          <>
            <Ionicons name="cloud-upload-outline" size={80} color="#007AFF" style={styles.icon} />
            <Text style={styles.title}>Uploading Video</Text>
            <Text style={styles.subtitle}>Preparing your video for processing...</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          </>
        )}

        {status === 'queued' && (
          <>
            <ActivityIndicator size="large" color="#007AFF" style={styles.icon} />
            <Text style={styles.title}>Queued for Processing</Text>
            <Text style={styles.subtitle}>Your video is in the queue. This usually takes a few seconds...</Text>
          </>
        )}

        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" color="#007AFF" style={styles.icon} />
            <Text style={styles.title}>Processing Video</Text>
            <Text style={styles.subtitle}>
              Applying {features?.subtitles ? 'subtitles, ' : ''}
              {features?.fillerWordRemoval ? 'filler removal, ' : ''}
              and other enhancements...
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${processingProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{processingProgress}%</Text>
            </View>
            {estimatedTimeMs && (
              <Text style={styles.estimatedTime}>
                Estimated time remaining: {formatTime(estimatedTimeMs)}
              </Text>
            )}
          </>
        )}

        {status === 'complete' && (
          <>
            <Ionicons name="checkmark-circle" size={80} color="#34C759" style={styles.icon} />
            <Text style={styles.title}>Processing Complete!</Text>
            <Text style={styles.subtitle}>Redirecting to preview...</Text>
          </>
        )}

        {status === 'failed' && (
          <>
            <Ionicons name="alert-circle" size={80} color="#FF3B30" style={styles.icon} />
            <Text style={styles.title}>Processing Failed</Text>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.failedActions}>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={handleRetry}
                disabled={retryCount >= 3}
              >
                <Text style={styles.buttonText}>
                  {retryCount >= 3 ? 'Max Retries Reached' : `Retry (${retryCount}/3)`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.keepButton]}
                onPress={handleKeepRawVideo}
              >
                <Text style={styles.buttonText}>Keep Raw Video</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {(status === 'uploading' || status === 'processing') && (
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  failedActions: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
  },
  keepButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
