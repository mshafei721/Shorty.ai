import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useNavigation } from '@react-navigation/native';

const NICHES = ['Healthcare', 'Finance', 'Fitness', 'Education', 'RealEstate'];

export function NicheSelectionScreen() {
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const navigation = useNavigation();

  const handleConfirm = async () => {
    if (!selectedNiche) return;

    try {
      // Save user profile with onboarding flag
      const userProfile = {
        niche: selectedNiche,
        subNiche: 'General', // TODO: Add sub-niche selection in A2
        onboarded: true,
      };

      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));

      // Navigate to Main (reset stack)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  };

  return (
    <View style={styles.container} testID="niche-selection-screen">
      <Text style={styles.title}>Select your niche</Text>
      <Text style={styles.subtitle}>
        Choose the industry you create content for
      </Text>

      <View style={styles.nicheList}>
        {NICHES.map((niche) => (
          <TouchableOpacity
            key={niche}
            style={[
              styles.nicheButton,
              selectedNiche === niche && styles.nicheButtonSelected,
            ]}
            onPress={() => setSelectedNiche(niche)}
            testID={`niche-${niche.toLowerCase()}`}
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
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, !selectedNiche && styles.buttonDisabled]}
        onPress={handleConfirm}
        disabled={!selectedNiche}
        testID="confirm-button"
      >
        <Text style={styles.confirmButtonText}>Confirm</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  nicheList: {
    gap: 12,
  },
  nicheButton: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  nicheButtonSelected: {
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
  },
  nicheText: {
    fontSize: 18,
    color: '#666',
  },
  nicheTextSelected: {
    color: '#000',
    fontWeight: '600',
  },
  confirmButton: {
    marginTop: 'auto',
    padding: 16,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
