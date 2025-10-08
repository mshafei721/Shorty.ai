import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NICHES = [
  { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'realestate', label: 'Real Estate', icon: '🏠' },
];

const SUB_NICHES: Record<string, Array<{ id: string; label: string }>> = {
  healthcare: [
    { id: 'physiotherapy', label: 'Physiotherapy' },
    { id: 'mental-health', label: 'Mental Health' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'nursing', label: 'Nursing' },
    { id: 'dentistry', label: 'Dentistry' },
  ],
  finance: [
    { id: 'investing', label: 'Investing' },
    { id: 'personal-finance', label: 'Personal Finance' },
    { id: 'crypto', label: 'Cryptocurrency' },
    { id: 'accounting', label: 'Accounting' },
    { id: 'insurance', label: 'Insurance' },
  ],
  fitness: [
    { id: 'weightlifting', label: 'Weightlifting' },
    { id: 'cardio', label: 'Cardio & Running' },
    { id: 'yoga', label: 'Yoga' },
    { id: 'crossfit', label: 'CrossFit' },
    { id: 'nutrition', label: 'Sports Nutrition' },
  ],
  education: [
    { id: 'k12', label: 'K-12 Teaching' },
    { id: 'higher-ed', label: 'Higher Education' },
    { id: 'tutoring', label: 'Tutoring' },
    { id: 'online-courses', label: 'Online Courses' },
    { id: 'stem', label: 'STEM Education' },
  ],
  realestate: [
    { id: 'residential', label: 'Residential' },
    { id: 'commercial', label: 'Commercial' },
    { id: 'property-mgmt', label: 'Property Management' },
    { id: 'investing', label: 'Real Estate Investing' },
    { id: 'flipping', label: 'House Flipping' },
  ],
};

type OnboardingStep = 'niche' | 'subNiche';

export default function NicheSelectionScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<OnboardingStep>('niche');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedSubNiche, setSelectedSubNiche] = useState<string | null>(null);

  const handleNicheSelect = (nicheId: string) => {
    setSelectedNiche(nicheId);
    setSelectedSubNiche(null);
  };

  const handleNicheContinue = () => {
    if (!selectedNiche) {
      Alert.alert('Selection Required', 'Please select a niche to continue.');
      return;
    }
    setStep('subNiche');
  };

  const handleSubNicheConfirm = async () => {
    if (!selectedSubNiche) {
      Alert.alert('Selection Required', 'Please select a sub-niche to continue.');
      return;
    }

    try {
      const userProfile = {
        niche: selectedNiche,
        subNiche: selectedSubNiche,
        onboarded: true,
        completedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error) {
      console.error('Failed to save niche selection:', error);
      Alert.alert('Error', 'Failed to save your selection. Please try again.');
    }
  };

  const handleBack = () => {
    setStep('niche');
    setSelectedSubNiche(null);
  };

  const subNiches = selectedNiche ? SUB_NICHES[selectedNiche] || [] : [];

  if (step === 'subNiche') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Choose Sub-Niche</Text>
        <Text style={styles.subtitle}>
          Narrow down your focus within {NICHES.find(n => n.id === selectedNiche)?.label}
        </Text>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.subNicheList}>
            {subNiches.map((subNiche) => (
              <TouchableOpacity
                key={subNiche.id}
                style={[
                  styles.subNicheCard,
                  selectedSubNiche === subNiche.id && styles.subNicheCardSelected,
                ]}
                onPress={() => setSelectedSubNiche(subNiche.id)}
              >
                <Text style={styles.subNicheLabel}>{subNiche.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.confirmButton, !selectedSubNiche && styles.confirmButtonDisabled]}
          onPress={handleSubNicheConfirm}
          disabled={!selectedSubNiche}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Niche</Text>
      <Text style={styles.subtitle}>
        Select the industry you want to create content for
      </Text>

      <View style={styles.nicheGrid}>
        {NICHES.map((niche) => (
          <TouchableOpacity
            key={niche.id}
            style={[
              styles.nicheCard,
              selectedNiche === niche.id && styles.nicheCardSelected,
            ]}
            onPress={() => handleNicheSelect(niche.id)}
          >
            <Text style={styles.nicheIcon}>{niche.icon}</Text>
            <Text style={styles.nicheLabel}>{niche.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, !selectedNiche && styles.confirmButtonDisabled]}
        onPress={handleNicheContinue}
        disabled={!selectedNiche}
      >
        <Text style={styles.confirmButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  backButton: {
    marginTop: 48,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 60,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  scrollContainer: {
    flex: 1,
  },
  nicheGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nicheCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  nicheCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  nicheIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  nicheLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  subNicheList: {
    marginBottom: 24,
  },
  subNicheCard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    padding: 20,
    marginBottom: 12,
  },
  subNicheCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  subNicheLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
