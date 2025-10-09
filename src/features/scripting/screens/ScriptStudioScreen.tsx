import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ScriptPrompt,
  ScriptDraft,
  ScriptTone,
  ScriptLength,
  PromptPreset,
  PROMPT_PRESETS,
  TONE_LABELS,
  LENGTH_LABELS,
  ScriptGenerationError,
} from '../types';
import { generateScript, regenerateScript } from '../service';
import type { Script } from '../../../storage/schema';

const MAX_DRAFTS = 5;
const DRAFTS_STORAGE_KEY = 'scriptDrafts';

interface Props {
  projectId: string;
  niche?: string;
  subNiche?: string;
  onSendToTeleprompter: (script: Script) => void;
  onClose: () => void;
}

export default function ScriptStudioScreen({
  projectId,
  niche,
  subNiche,
  onSendToTeleprompter,
  onClose,
}: Props) {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [preset, setPreset] = useState<PromptPreset>('hook');
  const [tone, setTone] = useState<ScriptTone>('balanced');
  const [length, setLength] = useState<ScriptLength>(60);

  const [drafts, setDrafts] = useState<ScriptDraft[]>([]);
  const [selectedDraftIndex, setSelectedDraftIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDrafts();
  }, [projectId]);

  async function loadDrafts() {
    try {
      const stored = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY);
      if (stored) {
        const allDrafts: ScriptDraft[] = JSON.parse(stored);
        const projectDrafts = allDrafts
          .filter((d) => d.projectId === projectId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, MAX_DRAFTS);
        setDrafts(projectDrafts);
        if (projectDrafts.length > 0) {
          setSelectedDraftIndex(0);
          const lastDraft = projectDrafts[0];
          setTopic(lastDraft.prompt.topic);
          setDescription(lastDraft.prompt.description || '');
          setPreset(lastDraft.prompt.preset);
          setTone(lastDraft.prompt.tone);
          setLength(lastDraft.prompt.length);
        }
      }
    } catch (err) {
      console.error('Failed to load drafts:', err);
    }
  }

  async function saveDraft(draft: ScriptDraft) {
    try {
      const stored = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY);
      const allDrafts: ScriptDraft[] = stored ? JSON.parse(stored) : [];

      const otherProjectDrafts = allDrafts.filter((d) => d.projectId !== projectId);
      const currentProjectDrafts = [draft, ...drafts].slice(0, MAX_DRAFTS);

      const updated = [...otherProjectDrafts, ...currentProjectDrafts];
      await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updated));

      setDrafts(currentProjectDrafts);
      setSelectedDraftIndex(0);
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      Alert.alert('Topic Required', 'Please enter a topic for your script.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const prompt: ScriptPrompt = {
      topic: topic.trim(),
      description: description.trim() || undefined,
      tone,
      length,
      preset,
      niche,
      subNiche,
    };

    try {
      const response = await generateScript(prompt, projectId);
      await saveDraft(response.draft);
    } catch (err) {
      const genError = err as ScriptGenerationError;
      setError(genError.message);
      if (!genError.retryable) {
        Alert.alert('Generation Failed', genError.message);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegenerate() {
    if (selectedDraftIndex === null) return;

    setIsGenerating(true);
    setError(null);

    try {
      const currentDraft = drafts[selectedDraftIndex];
      const response = await regenerateScript(currentDraft);
      await saveDraft(response.draft);
    } catch (err) {
      const genError = err as ScriptGenerationError;
      setError(genError.message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSendToTeleprompter() {
    if (selectedDraftIndex === null) return;

    const draft = drafts[selectedDraftIndex];
    const script: Script = {
      id: `script_${Date.now()}`,
      projectId,
      text: draft.text,
      wordsCount: draft.wordsCount,
      wpmTarget: 150,
      createdAt: new Date().toISOString(),
      source: 'ai',
    };

    onSendToTeleprompter(script);
  }

  const selectedDraft = selectedDraftIndex !== null ? drafts[selectedDraftIndex] : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Script Studio</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Topic *</Text>
          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g., How to reduce lower back pain"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Additional context or guidance..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Preset</Text>
          <View style={styles.presetGrid}>
            {(Object.keys(PROMPT_PRESETS) as PromptPreset[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.presetButton, preset === key && styles.presetButtonActive]}
                onPress={() => setPreset(key)}
              >
                <Text style={[styles.presetLabel, preset === key && styles.presetLabelActive]}>
                  {PROMPT_PRESETS[key].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tone</Text>
          <View style={styles.toneSlider}>
            {(['casual', 'balanced', 'expert'] as ScriptTone[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.toneButton, tone === t && styles.toneButtonActive]}
                onPress={() => setTone(t)}
              >
                <Text style={[styles.toneLabel, tone === t && styles.toneLabelActive]}>
                  {TONE_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Length</Text>
          <View style={styles.lengthSelector}>
            {([30, 60, 90] as ScriptLength[]).map((len) => (
              <TouchableOpacity
                key={len}
                style={[styles.lengthButton, length === len && styles.lengthButtonActive]}
                onPress={() => setLength(len)}
              >
                <Text style={[styles.lengthLabel, length === len && styles.lengthLabelActive]}>
                  {LENGTH_LABELS[len]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>
              {drafts.length > 0 ? 'Generate New Draft' : 'Generate Script'}
            </Text>
          )}
        </TouchableOpacity>

        {drafts.length > 0 && (
          <View style={styles.draftsSection}>
            <Text style={styles.draftsTitle}>Drafts ({drafts.length}/{MAX_DRAFTS})</Text>
            <View style={styles.draftTabs}>
              {drafts.map((draft, index) => (
                <TouchableOpacity
                  key={draft.id}
                  style={[styles.draftTab, selectedDraftIndex === index && styles.draftTabActive]}
                  onPress={() => setSelectedDraftIndex(index)}
                >
                  <Text style={[styles.draftTabText, selectedDraftIndex === index && styles.draftTabTextActive]}>
                    v{draft.version}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedDraft && (
              <View style={styles.draftPreview}>
                <View style={styles.draftMeta}>
                  <Text style={styles.draftMetaText}>{selectedDraft.wordsCount} words</Text>
                  <Text style={styles.draftMetaText}>
                    ~{Math.round((selectedDraft.wordsCount / 150) * 60)}s
                  </Text>
                </View>
                <Text style={styles.draftText}>{selectedDraft.text}</Text>

                <View style={styles.draftActions}>
                  <TouchableOpacity
                    style={styles.regenerateButton}
                    onPress={handleRegenerate}
                    disabled={isGenerating}
                  >
                    <Text style={styles.regenerateButtonText}>Regenerate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendToTeleprompter}
                  >
                    <Text style={styles.sendButtonText}>Send to Teleprompter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  presetButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  presetLabel: {
    fontSize: 14,
    color: '#333',
  },
  presetLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  toneSlider: {
    flexDirection: 'row',
    gap: 8,
  },
  toneButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  toneButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  toneLabel: {
    fontSize: 14,
    color: '#333',
  },
  toneLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  lengthSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  lengthButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  lengthButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  lengthLabel: {
    fontSize: 14,
    color: '#333',
  },
  lengthLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#C00',
    fontSize: 14,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  draftsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  draftsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  draftTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  draftTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  draftTabActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  draftTabText: {
    fontSize: 14,
    color: '#333',
  },
  draftTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  draftPreview: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  draftMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  draftMetaText: {
    fontSize: 12,
    color: '#666',
  },
  draftText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  draftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  regenerateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#34C759',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
