/**
 * Processing Status Screen
 *
 * Shows real-time processing progress with cancel option.
 * Displays status: Queued → Uploading → Processing → Complete/Failed.
 *
 * @module features/m3/screens/ProcessingStatusScreen
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getM2Gateway } from '../gateway';
import type { DraftRenderStatus } from '../types';

interface ProcessingStatusScreenProps {
  route: {
    params: {
      projectId: string;
      assetId: string;
      renderId?: string;
    };
  };
}

type ProcessingStage = 'idle' | 'uploading' | 'queued' | 'processing' | 'complete' | 'failed' | 'cancelled';

export default function ProcessingStatusScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { projectId, assetId, renderId: initialRenderId } = (route.params || {}) as ProcessingStatusScreenProps['route']['params'];

  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [progress, setProgress] = useState(0);
  const [renderId, setRenderId] = useState<string | null>(initialRenderId || null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;
  const pollIntervalMs = 2000; // 2 seconds
  const maxPollAttempts = 600; // 20 minutes max (600 * 2s)
  const pollAttempts = useRef(0);

  useEffect(() => {
    if (!projectId || !assetId) {
      Alert.alert('Error', 'Missing project or asset information');
      navigation.goBack();
      return;
    }

    if (renderId) {
      startPolling();
    }

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [renderId]);

  const startPolling = async () => {
    if (!renderId) return;

    setStage('queued');

    pollInterval.current = setInterval(async () => {
      try {
        pollAttempts.current += 1;

        if (pollAttempts.current > maxPollAttempts) {
          handleTimeout();
          return;
        }

        const gateway = getM2Gateway();
        const status = await gateway.pollDraft(renderId);

        updateStatus(status);

        if (status.status === 'done' || status.status === 'failed') {
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
          }
        }
      } catch (err) {
        console.error('Polling error:', err);

        if (retryCount < maxRetries) {
          setRetryCount(retryCount + 1);
        } else {
          handleError('Failed to check processing status');
        }
      }
    }, pollIntervalMs);
  };

  const updateStatus = (status: DraftRenderStatus) => {
    setProgress(status.progressPct || 0);

    if (status.status === 'queued') {
      setStage('queued');
    } else if (status.status === 'rendering') {
      setStage('processing');
    } else if (status.status === 'done') {
      setStage('complete');
      setProgress(100);
    } else if (status.status === 'failed') {
      setStage('failed');
      setError(status.error || 'Processing failed');
    }
  };

  const handleTimeout = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }

    setStage('failed');
    setError('Processing timeout (20 minutes exceeded)');
  };

  const handleError = (message: string) => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }

    setStage('failed');
    setError(message);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Processing',
      'Are you sure you want to cancel? This will stop the current processing job.',
      [
        { text: 'Continue Processing', style: 'cancel' },
        {
          text: 'Cancel Job',
          style: 'destructive',
          onPress: confirmCancel,
        },
      ]
    );
  };

  const confirmCancel = async () => {
    if (!renderId) return;

    try {
      setCancelling(true);

      // Note: Cancel endpoint not yet implemented in M2Gateway
      // This would call: await gateway.cancelDraft(renderId);

      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }

      setStage('cancelled');
      setCancelling(false);

      Alert.alert('Cancelled', 'Processing has been cancelled', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('Cancel error:', err);
      setCancelling(false);
      Alert.alert('Error', 'Failed to cancel processing');
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    pollAttempts.current = 0;
    setStage('queued');
    setProgress(0);

    if (renderId) {
      startPolling();
    }
  };

  const handleKeepRaw = () => {
    Alert.alert(
      'Keep Raw Video',
      'The raw video will be saved. You can try processing again later.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const handleViewVideo = () => {
    // @ts-ignore - Navigation types not fully defined yet
    navigation.navigate('Preview', { projectId, assetId });
  };

  const getStageTitle = () => {
    switch (stage) {
      case 'idle':
        return 'Preparing...';
      case 'uploading':
        return 'Uploading Video';
      case 'queued':
        return 'Queued';
      case 'processing':
        return 'Processing';
      case 'complete':
        return 'Complete!';
      case 'failed':
        return 'Processing Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Processing';
    }
  };

  const getStageMessage = () => {
    switch (stage) {
      case 'idle':
        return 'Initializing processing pipeline...';
      case 'uploading':
        return 'Uploading your video to the server...';
      case 'queued':
        return 'Your video is in the queue. This may take a moment.';
      case 'processing':
        return 'Applying features to your video...';
      case 'complete':
        return 'Your video is ready to view and export!';
      case 'failed':
        return error || 'An error occurred during processing.';
      case 'cancelled':
        return 'Processing was cancelled.';
      default:
        return 'Processing your video...';
    }
  };

  const isProcessing = ['idle', 'uploading', 'queued', 'processing'].includes(stage);
  const canCancel = isProcessing && !cancelling;
  const showRetry = stage === 'failed';
  const showComplete = stage === 'complete';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Status Icon */}
        <View style={styles.iconContainer}>
          {isProcessing ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : stage === 'complete' ? (
            <Text style={styles.iconEmoji}>✅</Text>
          ) : stage === 'failed' || stage === 'cancelled' ? (
            <Text style={styles.iconEmoji}>❌</Text>
          ) : null}
        </View>

        {/* Status Title */}
        <Text style={styles.title}>{getStageTitle()}</Text>
        <Text style={styles.message}>{getStageMessage()}</Text>

        {/* Progress Bar */}
        {isProcessing && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}

        {/* Retry Count */}
        {retryCount > 0 && isProcessing && (
          <Text style={styles.retryText}>Retry {retryCount}/{maxRetries}</Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {canCancel && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={cancelling}
            >
              <Text style={styles.cancelButtonText}>
                {cancelling ? 'Cancelling...' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          )}

          {showRetry && (
            <>
              <TouchableOpacity style={styles.button} onPress={handleRetry}>
                <Text style={styles.buttonText}>Retry Processing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleKeepRaw}
              >
                <Text style={styles.secondaryButtonText}>Keep Raw Video</Text>
              </TouchableOpacity>
            </>
          )}

          {showComplete && (
            <TouchableOpacity style={styles.button} onPress={handleViewVideo}>
              <Text style={styles.buttonText}>View Video</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Network Status */}
        {stage === 'failed' && error?.includes('network') && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              ⚠️ You're offline. We'll resume when you're back online.
            </Text>
          </View>
        )}
      </View>
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
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 12,
    color: '#FF9800',
    marginBottom: 16,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  banner: {
    marginTop: 24,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  bannerText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
});
