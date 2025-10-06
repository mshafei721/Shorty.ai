import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { SubNicheConfirmationScreenProps } from '../navigation/types';
import { setStorageItem } from '../storage';
import { Toast } from '../components/Toast';

const SUB_NICHES: Record<string, string[]> = {
  Healthcare: ['Physiotherapy', 'Cardiology', 'Dermatology'],
  Finance: ['Personal Finance', 'Investing', 'Real Estate'],
  Fitness: ['Yoga', 'Weightlifting', 'Running'],
  Education: ['K-12', 'Higher Ed', 'Professional Development'],
  'Real Estate': ['Residential', 'Commercial', 'Property Management'],
  Technology: ['Software Development', 'AI/ML', 'Cybersecurity'],
  'Food & Beverage': ['Restaurants', 'Recipes', 'Food Trucks'],
  Travel: ['Adventure', 'Luxury', 'Budget Travel'],
  Fashion: ['Streetwear', 'Haute Couture', 'Sustainable Fashion'],
};

export default function SubNicheConfirmationScreen({ route, navigation }: SubNicheConfirmationScreenProps) {
  const { niche } = route.params;
  const [selectedSubNiche, setSelectedSubNiche] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const subNiches = SUB_NICHES[niche] || [];

  const handleSubNicheSelect = (subNiche: string) => {
    setSelectedSubNiche(subNiche);
  };

  const handleComplete = async () => {
    if (selectedSubNiche) {
      try {
        await setStorageItem('userProfile', {
          niche,
          subNiche: selectedSubNiche,
          onboardedAt: new Date().toISOString(),
        });

        setShowToast(true);

        setTimeout(() => {
          setShowToast(false);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }, 3000);
      } catch (error) {
        console.error('Failed to save user profile:', error);
      }
    }
  };

  return (
    <View style={styles.container} accessibilityLabel={`Sub-niche selection screen for ${niche}. Choose your specific focus.`}>
      {showToast && <Toast message="Welcome to Shorty.ai!" />}

      <Text style={styles.title}>Choose Your Sub-Niche</Text>
      <Text style={styles.subtitle}>Refine your focus within {niche}</Text>

      <ScrollView style={styles.subNicheList} contentContainerStyle={styles.subNicheListContent}>
        {subNiches.map((subNiche) => (
          <TouchableOpacity
            key={subNiche}
            style={[
              styles.subNicheButton,
              selectedSubNiche === subNiche && styles.subNicheButtonSelected,
            ]}
            onPress={() => handleSubNicheSelect(subNiche)}
            accessibilityLabel={`${subNiche} sub-niche`}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedSubNiche === subNiche }}
          >
            <Text
              style={[
                styles.subNicheText,
                selectedSubNiche === subNiche && styles.subNicheTextSelected,
              ]}
            >
              {subNiche}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.completeButton, !selectedSubNiche && styles.completeButtonDisabled]}
        onPress={handleComplete}
        disabled={!selectedSubNiche}
        accessibilityLabel="Complete onboarding and start using Shorty.ai"
        accessibilityRole="button"
        accessibilityState={{ disabled: !selectedSubNiche }}
      >
        <Text style={styles.completeButtonText}>Complete Setup</Text>
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
  subNicheList: {
    flex: 1,
  },
  subNicheListContent: {
    paddingBottom: 20,
  },
  subNicheButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  subNicheButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  subNicheText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '500',
  },
  subNicheTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  completeButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
