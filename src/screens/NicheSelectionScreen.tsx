import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NICHES = [
  { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'realestate', label: 'Real Estate', icon: '🏠' },
];

export default function NicheSelectionScreen() {
  const navigation = useNavigation();
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedNiche) {
      Alert.alert('Selection Required', 'Please select a niche to continue.');
      return;
    }

    try {
      const userProfile = {
        niche: selectedNiche,
        onboarded: true,
        createdAt: new Date().toISOString(),
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
            onPress={() => setSelectedNiche(niche.id)}
          >
            <Text style={styles.nicheIcon}>{niche.icon}</Text>
            <Text style={styles.nicheLabel}>{niche.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, !selectedNiche && styles.confirmButtonDisabled]}
        onPress={handleConfirm}
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
  nicheGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  nicheCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
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
