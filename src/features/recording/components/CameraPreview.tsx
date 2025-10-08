/**
 * Camera Preview Component (B2)
 *
 * Portrait camera preview for video recording (1080x1920@30fps).
 * Displays timer, recording indicator, and capture controls.
 *
 * @module features/recording/components/CameraPreview
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView } from 'expo-camera';

export interface CameraPreviewProps {
  isRecording: boolean;
  isPaused: boolean;
  elapsedMs: number;
  maxDurationMs: number;
  facing: 'front' | 'back';
  onStartPress: () => void;
  onStopPress: () => void;
  onPausePress: () => void;
  onResumePress: () => void;
  onFlipCamera: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function CameraPreview({
  isRecording,
  isPaused,
  elapsedMs,
  maxDurationMs,
  facing,
  onStartPress,
  onStopPress,
  onPausePress,
  onResumePress,
  onFlipCamera,
}: CameraPreviewProps) {
  const remainingMs = maxDurationMs - elapsedMs;
  const isNearEnd = remainingMs <= 15000 && remainingMs > 0;
  const cameraRef = useRef<CameraView>(null);

  const handleStartRecording = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      onStartPress();
      // Actual recording will be started by useRecording hook
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      onStopPress();
      // Actual recording will be stopped by useRecording hook
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera Preview */}
      <CameraView
        ref={cameraRef}
        style={styles.preview}
        facing={facing}
        mode="video"
      >
        {/* Empty - camera view fills container */}
      </CameraView>

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View
            testID="recording-dot"
            style={[styles.recordingDot, isPaused && styles.recordingDotPaused]}
          />
          <Text style={styles.recordingText}>
            {isPaused ? 'PAUSED' : 'REC'}
          </Text>
        </View>
      )}

      {/* Timer */}
      {isRecording && (
        <View style={styles.timerContainer}>
          <Text
            testID="timer-text"
            style={[styles.timerText, isNearEnd && styles.timerWarning]}
          >
            {formatTime(elapsedMs)}
          </Text>
          {isNearEnd && (
            <Text style={styles.timerRemaining}>
              {formatTime(remainingMs)} left
            </Text>
          )}
        </View>
      )}

      {/* Camera Flip Button */}
      {!isRecording && (
        <TouchableOpacity
          testID="flip-camera-button"
          style={styles.flipButton}
          onPress={onFlipCamera}
        >
          <Text style={styles.flipButtonText}>🔄</Text>
        </TouchableOpacity>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {!isRecording && (
          <TouchableOpacity
            testID="start-button"
            style={styles.startButton}
            onPress={handleStartRecording}
          >
            <View style={styles.startButtonInner} />
          </TouchableOpacity>
        )}

        {isRecording && !isPaused && (
          <>
            <TouchableOpacity
              testID="pause-button"
              style={styles.pauseButton}
              onPress={onPausePress}
            >
              <View style={styles.pauseIcon}>
                <View style={styles.pauseBar} />
                <View style={styles.pauseBar} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              testID="stop-button"
              style={styles.stopButton}
              onPress={handleStopRecording}
            >
              <View style={styles.stopButtonInner} />
            </TouchableOpacity>
          </>
        )}

        {isPaused && (
          <>
            <TouchableOpacity
              testID="resume-button"
              style={styles.resumeButton}
              onPress={onResumePress}
            >
              <View style={styles.resumeIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              testID="stop-button"
              style={styles.stopButton}
              onPress={handleStopRecording}
            >
              <View style={styles.stopButtonInner} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  preview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  previewText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    marginRight: 8,
  },
  recordingDotPaused: {
    backgroundColor: '#FFA500',
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  timerContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerWarning: {
    color: '#FF4444',
  },
  timerRemaining: {
    color: '#FFAA00',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  flipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButtonText: {
    fontSize: 24,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  startButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF0000',
  },
  pauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 6,
  },
  pauseBar: {
    width: 6,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  resumeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 16,
    borderRightWidth: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: '#FFFFFF',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 4,
  },
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonInner: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
});
