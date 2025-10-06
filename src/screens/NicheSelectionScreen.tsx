import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { NicheSelectionScreenProps } from '../navigation/types';

const NICHES = [
  'Technology',
  'Health & Fitness',
  'Food & Cooking',
  'Travel',
  'Education',
  'Entertainment',
  'Business',
  'Lifestyle',
];

export default function NicheSelectionScreen({ navigation }: NicheSelectionScreenProps) {
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);

  const handleNicheSelect = (niche: string) => {
    setSelectedNiche(niche);
  };

  const handleContinue = () => {
    if (selectedNiche) {
      navigation.navigate('SubNicheConfirmation', { niche: selectedNiche });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Niche</Text>
      <Text style={styles.subtitle}>Select the primary topic for your content</Text>

      <ScrollView style={styles.nicheList} contentContainerStyle={styles.nicheListContent}>
        {NICHES.map((niche) => (
          <TouchableOpacity
            key={niche}
            style={[
              styles.nicheButton,
              selectedNiche === niche && styles.nicheButtonSelected,
            ]}
            onPress={() => handleNicheSelect(niche)}
          >
            <Text
              style={[
                styles.nicheText,
                selectedNiche === niche && styles.nicheTextSelected,
              ]}
            >
              {niche}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.continueButton, !selectedNiche && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={!selectedNiche}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
  },
  nicheList: {
    flex: 1,
  },
  nicheListContent: {
    paddingBottom: 20,
  },
  nicheButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  nicheButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  nicheText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '500',
  },
  nicheTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
