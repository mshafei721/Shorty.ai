import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Script } from '../storage/schema';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = StackNavigationProp<RootStackParamList, 'PasteScript'>;
type RouteProps = RouteProp<RootStackParamList, 'PasteScript'>;

const MIN_WORDS = 20;
const MAX_WORDS = 500;
const DEFAULT_WPM = 140;

export default function PasteScriptScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { projectId } = route.params;

  const [scriptText, setScriptText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const wordCount = countWords(scriptText);
  const isValid = wordCount >= MIN_WORDS && wordCount <= MAX_WORDS;
  const estimatedDurationSec = Math.round((wordCount / DEFAULT_WPM) * 60);

  const handleSendToTeleprompter = async () => {
    if (!isValid) {
      Alert.alert(
        'Invalid Script',
        `Script must be between ${MIN_WORDS} and ${MAX_WORDS} words. Current: ${wordCount} words.`
      );
      return;
    }

    try {
      setIsSaving(true);

      const script: Script = {
        id: `script_${Date.now()}`,
        projectId,
        text: scriptText.trim(),
        wordsCount: wordCount,
        wpmTarget: DEFAULT_WPM,
        createdAt: new Date().toISOString(),
        source: 'manual',
      };

      const scriptsJson = await AsyncStorage.getItem('scripts');
      const scripts: Script[] = scriptsJson ? JSON.parse(scriptsJson) : [];
      scripts.push(script);
      await AsyncStorage.setItem('scripts', JSON.stringify(scripts));

      navigation.navigate('Record', {
        scriptId: script.id,
        projectId,
      });
    } catch (error) {
      console.error('Failed to save script:', error);
      Alert.alert('Error', 'Failed to save script. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getValidationColor = () => {
    if (wordCount === 0) return '#999';
    if (wordCount < MIN_WORDS) return '#FF9500';
    if (wordCount > MAX_WORDS) return '#FF3B30';
    return '#34C759';
  };

  const getValidationMessage = () => {
    if (wordCount === 0) return 'Start typing your script...';
    if (wordCount < MIN_WORDS) return `${MIN_WORDS - wordCount} more words needed`;
    if (wordCount > MAX_WORDS) return `${wordCount - MAX_WORDS} words over limit`;
    return 'Script is valid!';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="clipboard-outline" size={48} color="#007AFF" />
          <Text style={styles.title}>Paste Your Script</Text>
          <Text style={styles.subtitle}>
            Enter or paste a pre-written script ({MIN_WORDS}-{MAX_WORDS} words)
          </Text>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            value={scriptText}
            onChangeText={setScriptText}
            placeholder={`Paste your script here...\n\nExample:\nHey there! Today I'm going to show you the top 5 exercises for lower back pain relief. These are the same exercises I recommend to my patients every single day.\n\nFirst up is the Cat-Cow stretch...`}
            placeholderTextColor="#999"
            multiline
            numberOfLines={15}
            textAlignVertical="top"
            autoFocus
          />

          <View style={styles.statsBar}>
            <View style={styles.stat}>
              <Ionicons name="document-text-outline" size={20} color={getValidationColor()} />
              <Text style={[styles.statText, { color: getValidationColor() }]}>
                {wordCount} words
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.statText}>~{estimatedDurationSec}s</Text>
            </View>
          </View>

          <View style={[styles.validationBanner, { borderColor: getValidationColor() }]}>
            <Ionicons
              name={isValid ? 'checkmark-circle' : 'information-circle'}
              size={20}
              color={getValidationColor()}
            />
            <Text style={[styles.validationText, { color: getValidationColor() }]}>
              {getValidationMessage()}
            </Text>
          </View>
        </View>

        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>Script Guidelines</Text>
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
            <Text style={styles.guidelineText}>Keep it between {MIN_WORDS}-{MAX_WORDS} words</Text>
          </View>
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
            <Text style={styles.guidelineText}>Target 60-90 seconds duration</Text>
          </View>
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
            <Text style={styles.guidelineText}>Write in a conversational tone</Text>
          </View>
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
            <Text style={styles.guidelineText}>Include a hook at the beginning</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!isValid || isSaving) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendToTeleprompter}
          disabled={!isValid || isSaving}
        >
          <Ionicons name="videocam-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.sendButtonText}>
            {isSaving ? 'Saving...' : 'Send to Teleprompter'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inputSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    fontSize: 16,
    color: '#000',
    minHeight: 300,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  validationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  guidelines: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guidelinesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  guidelineText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
