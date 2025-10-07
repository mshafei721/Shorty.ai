import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  requestCameraPermissions,
  checkCameraPermissions,
  PermissionResult,
} from '../utils/permissions';
import { PermissionModal } from '../components/PermissionModal';
import { PermissionBanner } from '../components/PermissionBanner';
import { useRecording } from '../features/recording/hooks/useRecording';
import { CameraPreview } from '../features/recording/components/CameraPreview';
import { TeleprompterOverlay } from '../features/recording/components/TeleprompterOverlay';

type NavigationProp = StackNavigationProp<any>;

export default function RecordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [permissionStatus, setPermissionStatus] = useState<PermissionResult>('denied');
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  // Recording state
  const [scriptText] = useState(
    'This is a sample script for testing the teleprompter. You can read along as it scrolls automatically during recording. The speed can be adjusted using the controls below.'
  );
  const [wpm, setWpm] = useState(140);
  const [fontSize, setFontSize] = useState(18);
  const showTeleprompter = true;

  // Recording FSM
  const recording = useRecording({
    maxDurationMs: 120000,
    onStateChange: (state) => {
      console.log('Recording state changed:', state);
    },
  });

  const checkPermissions = async () => {
    const status = await checkCameraPermissions();
    setPermissionStatus(status);

    if (status === 'denied') {
      setShowBanner(true);
    } else if (status === 'blocked') {
      setShowModal(true);
    }
  };

  const requestPermissions = async () => {
    const status = await requestCameraPermissions();
    setPermissionStatus(status);

    if (status === 'denied') {
      setShowBanner(true);
    } else if (status === 'blocked') {
      setShowModal(true);
    } else if (status === 'granted') {
      setShowBanner(false);
      setShowModal(false);
    }
  };

  useEffect(() => {
    const initializePermissions = async () => {
      setIsCheckingPermissions(true);
      const status = await checkCameraPermissions();
      setPermissionStatus(status);

      if (status === 'denied' || status === 'blocked') {
        await requestPermissions();
      }
      setIsCheckingPermissions(false);
    };

    initializePermissions();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      await checkPermissions();
    }
  };

  const handleModalCancel = () => {
    setShowModal(false);
    navigation.goBack();
  };

  const handleBannerPress = async () => {
    setShowBanner(false);
    await requestPermissions();
  };

  const handleBannerDismiss = () => {
    setShowBanner(false);
  };

  const handleStartRecording = () => {
    recording.startRecording();
  };

  const handleStopRecording = () => {
    recording.stopRecording();
  };

  const handlePauseRecording = () => {
    recording.pauseRecording();
  };

  const handleResumeRecording = () => {
    recording.resumeRecording();
  };

  if (isCheckingPermissions) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PermissionBanner
        visible={showBanner}
        onPress={handleBannerPress}
        onDismiss={handleBannerDismiss}
      />

      <PermissionModal
        visible={showModal}
        onCancel={handleModalCancel}
      />

      {permissionStatus === 'granted' ? (
        <View style={styles.recordingContainer}>
          <CameraPreview
            isRecording={recording.state === 'recording' || recording.state === 'paused'}
            isPaused={recording.state === 'paused'}
            elapsedMs={recording.elapsedMs}
            maxDurationMs={120000}
            onStartPress={handleStartRecording}
            onStopPress={handleStopRecording}
            onPausePress={handlePauseRecording}
            onResumePress={handleResumeRecording}
          />

          {showTeleprompter && (
            <TeleprompterOverlay
              scriptText={scriptText}
              isPlaying={recording.state === 'recording'}
              wpm={wpm}
              fontSize={fontSize}
              onWpmChange={setWpm}
              onFontSizeChange={setFontSize}
              visible={recording.state !== 'idle'}
            />
          )}
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.placeholderText}>
            Camera permissions required to continue.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  recordingContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
});
