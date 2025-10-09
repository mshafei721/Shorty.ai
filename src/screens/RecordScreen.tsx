import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { TeleprompterOverlay } from '../features/recording/components/TeleprompterOverlay';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Record'>;
type RouteProps = RouteProp<RootStackParamList, 'Record'>;

interface Script {
  id: string;
  projectId: string;
  text: string;
  wordsCount: number;
  wpmTarget: number;
  createdAt: string;
  source: 'ai' | 'manual';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAMERA_HEIGHT = SCREEN_WIDTH * (16 / 9);

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function RecordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { scriptId, projectId } = route.params || {};

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [scriptText, setScriptText] = useState('');
  const [loadedScript, setLoadedScript] = useState<Script | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(true);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front'); // Default to selfie camera
  const [showTeleprompter, setShowTeleprompter] = useState(true);

  // Teleprompter state
  const [wpm, setWpm] = useState(140);
  const [fontSize, setFontSize] = useState(18);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const MAX_DURATION_MS = 120000; // 2 minutes

  useEffect(() => {
    if (scriptId) {
      loadScript(scriptId);
    } else {
      setIsLoadingScript(false);
    }
  }, [scriptId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const loadScript = async (id: string) => {
    try {
      setIsLoadingScript(true);
      const scriptsJson = await AsyncStorage.getItem('scripts');
      if (scriptsJson) {
        const scripts: Script[] = JSON.parse(scriptsJson);
        const script = scripts.find(s => s.id === id);

        if (script) {
          setLoadedScript(script);
          setScriptText(script.text);
          setWpm(script.wpmTarget || 140);
        } else {
          Alert.alert('Script Not Found', 'Using manual mode.');
        }
      }
    } catch (error) {
      console.error('Failed to load script:', error);
    } finally {
      setIsLoadingScript(false);
    }
  };

  const startTimer = () => {
    startTimeRef.current = Date.now() - elapsedMs;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedMs(elapsed);

      if (elapsed >= MAX_DURATION_MS) {
        handleStopRecording();
      }
    }, 100);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      setIsRecording(true);
      setIsPaused(false);
      startTimer();

      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION_MS / 1000,
      });

      console.log('Recording saved:', video.uri);

      // Save video metadata to AsyncStorage
      if (projectId && video.uri) {
        const videoId = `video_${Date.now()}`;
        const videoAsset = {
          id: videoId,
          projectId,
          type: 'raw' as const,
          scriptId: scriptId || null,
          localUri: video.uri,
          durationSec: elapsedMs / 1000,
          sizeBytes: 0,
          createdAt: new Date().toISOString(),
          exportedAt: null,
          status: 'ready' as const,
        };

        const videosJson = await AsyncStorage.getItem('videos');
        const videos = videosJson ? JSON.parse(videosJson) : [];
        videos.push(videoAsset);
        await AsyncStorage.setItem('videos', JSON.stringify(videos));

        // Navigate to processing (will skip to preview if backend unavailable)
        navigation.navigate('Processing', {
          projectId,
          videoUri: video.uri,
          scriptId,
          features: {
            subtitles: true,
            backgroundChange: { enabled: false, presetId: null },
            backgroundMusic: { enabled: false, trackId: null, volume: 0.5 },
            introOutro: { enabled: false, templateId: null },
            fillerWordRemoval: true,
          },
        });
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
      stopTimer();
    }
  };

  const handleStopRecording = async () => {
    if (!cameraRef.current) return;

    try {
      stopTimer();
      cameraRef.current.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setElapsedMs(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handlePauseRecording = async () => {
    if (!cameraRef.current) return;

    try {
      await cameraRef.current.pauseAsync();
      setIsPaused(true);
      stopTimer();
      pausedTimeRef.current = Date.now();
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const handleResumeRecording = async () => {
    if (!cameraRef.current) return;

    try {
      await cameraRef.current.resumeAsync();
      setIsPaused(false);
      startTimer();
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  };

  const handleFlipCamera = () => {
    if (isRecording) return;
    setCameraFacing(prev => prev === 'front' ? 'back' : 'front');
  };

  if (isLoadingScript) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color="#999" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          Shorty.ai needs camera access to record videos.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const remainingMs = MAX_DURATION_MS - elapsedMs;
  const isNearEnd = remainingMs <= 15000 && remainingMs > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Record Video</Text>
          {loadedScript && (
            <Text style={styles.headerSubtitle}>
              {loadedScript.wordsCount} words · ~{Math.round((loadedScript.wordsCount / wpm) * 60)}s
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleFlipCamera} disabled={isRecording}>
          <Ionicons name="camera-reverse-outline" size={28} color={isRecording ? '#666' : '#FFF'} />
        </TouchableOpacity>
      </View>

      {/* Camera Preview */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraFacing}
          mode="video"
        />

        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={[styles.recordingDot, isPaused && styles.recordingDotPaused]} />
            <Text style={styles.recordingText}>{isPaused ? 'PAUSED' : 'REC'}</Text>
          </View>
        )}

        {/* Timer */}
        {isRecording && (
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, isNearEnd && styles.timerWarning]}>
              {formatTime(elapsedMs)}
            </Text>
            {isNearEnd && (
              <Text style={styles.timerRemaining}>{formatTime(remainingMs)} left</Text>
            )}
          </View>
        )}

        {/* Teleprompter Overlay */}
        {showTeleprompter && scriptText && (
          <TeleprompterOverlay
            scriptText={scriptText}
            isPlaying={isRecording && !isPaused}
            wpm={wpm}
            fontSize={fontSize}
            onWpmChange={setWpm}
            onFontSizeChange={setFontSize}
            visible={true}
          />
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!isRecording && (
          <>
            {scriptText && (
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowTeleprompter(!showTeleprompter)}
              >
                <Ionicons
                  name={showTeleprompter ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#FFF"
                />
                <Text style={styles.toggleButtonText}>
                  {showTeleprompter ? 'Hide' : 'Show'} Teleprompter
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.startButton} onPress={handleStartRecording}>
              <View style={styles.startButtonInner} />
            </TouchableOpacity>

            <Text style={styles.hintText}>Tap to start recording</Text>
          </>
        )}

        {isRecording && !isPaused && (
          <View style={styles.recordingControls}>
            <TouchableOpacity style={styles.controlButton} onPress={handlePauseRecording}>
              <View style={styles.pauseIcon}>
                <View style={styles.pauseBar} />
                <View style={styles.pauseBar} />
              </View>
              <Text style={styles.controlLabel}>Pause</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleStopRecording}>
              <View style={styles.stopButtonOuter}>
                <View style={styles.stopButtonInner} />
              </View>
              <Text style={styles.controlLabel}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPaused && (
          <View style={styles.recordingControls}>
            <TouchableOpacity style={styles.controlButton} onPress={handleResumeRecording}>
              <View style={styles.resumeIcon} />
              <Text style={styles.controlLabel}>Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleStopRecording}>
              <View style={styles.stopButtonOuter}>
                <View style={styles.stopButtonInner} />
              </View>
              <Text style={styles.controlLabel}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
  controls: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  toggleButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  startButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  startButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF0000',
  },
  hintText: {
    color: '#999',
    fontSize: 14,
  },
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  controlButton: {
    alignItems: 'center',
    gap: 8,
  },
  pauseIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pauseBar: {
    width: 6,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  resumeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonInner: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  controlLabel: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
});
