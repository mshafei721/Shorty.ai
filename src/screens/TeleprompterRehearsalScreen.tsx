import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { TeleprompterOverlay } from '../features/recording/components/TeleprompterOverlay';

type NavigationProp = StackNavigationProp<RootStackParamList, 'TeleprompterRehearsal'>;
type RouteProps = RouteProp<RootStackParamList, 'TeleprompterRehearsal'>;

interface Script {
  id: string;
  projectId: string;
  text: string;
  wordsCount: number;
  wpmTarget: number;
  createdAt: string;
  source: 'ai' | 'manual';
}

export default function TeleprompterRehearsalScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { scriptId, projectId } = route.params;

  const [scriptText, setScriptText] = useState('');
  const [loadedScript, setLoadedScript] = useState<Script | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(140);
  const [fontSize, setFontSize] = useState(18);
  const [isLoadingScript, setIsLoadingScript] = useState(true);

  useEffect(() => {
    loadScript();
  }, [scriptId]);

  const loadScript = async () => {
    try {
      setIsLoadingScript(true);
      const scriptsJson = await AsyncStorage.getItem('scripts');
      if (scriptsJson) {
        const scripts: Script[] = JSON.parse(scriptsJson);
        const script = scripts.find(s => s.id === scriptId);

        if (script) {
          setLoadedScript(script);
          setScriptText(script.text);
          setWpm(script.wpmTarget || 140);
        } else {
          Alert.alert('Script Not Found', 'The requested script could not be found.');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Failed to load script:', error);
      Alert.alert('Error', 'Failed to load script.');
      navigation.goBack();
    } finally {
      setIsLoadingScript(false);
    }
  };

  const handleStartRecording = () => {
    navigation.navigate('Record', {
      scriptId,
      projectId,
    });
  };

  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 100);
  };

  if (isLoadingScript) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading script...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Teleprompter Rehearsal</Text>
            <Text style={styles.headerSubtitle}>Practice your script</Text>
          </View>
        </View>
      </View>

      <View style={styles.teleprompterContainer}>
        <TeleprompterOverlay
          scriptText={scriptText}
          isPlaying={isPlaying}
          wpm={wpm}
          fontSize={fontSize}
          onWpmChange={setWpm}
          onFontSizeChange={setFontSize}
          visible={true}
        />
      </View>

      <View style={styles.controls}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="document-text-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{loadedScript?.wordsCount} words</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              ~{Math.round(((loadedScript?.wordsCount || 0) / wpm) * 60)}s
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="speedometer-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{wpm} WPM</Text>
          </View>
        </View>

        <View style={styles.playbackControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleRestart}>
            <Ionicons name="reload-outline" size={32} color="#007AFF" />
            <Text style={styles.controlLabel}>Restart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.playButton]}
            onPress={handleTogglePlay}
          >
            <View style={styles.playButtonInner}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={48}
                color="#FFF"
              />
            </View>
            <Text style={styles.controlLabel}>
              {isPlaying ? 'Pause' : 'Play'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleStartRecording}>
            <Ionicons name="videocam" size={32} color="#FF3B30" />
            <Text style={styles.controlLabel}>Record</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.readyButton}
          onPress={handleStartRecording}
        >
          <Ionicons name="videocam-outline" size={24} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.readyButtonText}>Ready to Record</Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  teleprompterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
  },
  controlButton: {
    alignItems: 'center',
    gap: 8,
  },
  controlLabel: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  playButton: {
    transform: [{ scale: 1.2 }],
  },
  playButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  readyButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  readyButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
