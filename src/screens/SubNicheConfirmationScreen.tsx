import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { SubNicheConfirmationScreenProps } from '../navigation/types';
import { setStorageItem } from '../storage';

const SUB_NICHES: Record<string, string[]> = {
  Technology: ['AI & Machine Learning', 'Web Development', 'Mobile Apps', 'Cybersecurity'],
  'Health & Fitness': ['Nutrition', 'Workout Routines', 'Mental Health', 'Yoga & Meditation'],
  'Food & Cooking': ['Quick Recipes', 'Baking', 'Healthy Eating', 'International Cuisine'],
  Travel: ['Budget Travel', 'Luxury Travel', 'Adventure Travel', 'Travel Tips'],
  Education: ['Study Tips', 'Online Learning', 'Career Development', 'Language Learning'],
  Entertainment: ['Movies & TV', 'Gaming', 'Music', 'Pop Culture'],
  Business: ['Entrepreneurship', 'Marketing', 'Finance', 'Productivity'],
  Lifestyle: ['Home Decor', 'Fashion', 'Personal Development', 'Relationships'],
};

export default function SubNicheConfirmationScreen({ route, navigation }: SubNicheConfirmationScreenProps) {
  const { niche } = route.params;
  const [selectedSubNiche, setSelectedSubNiche] = useState<string | null>(null);
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

        navigation.reset({
          index: 0,
          routes: [{ name: 'Splash' }],
        });
      } catch (error) {
        console.error('Failed to save user profile:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
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
