import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { SplashScreenProps } from '../navigation/types';
import { initializeStorage, getStorageItem } from '../storage';

export default function SplashScreen({ navigation }: SplashScreenProps) {
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeStorage();

        const userProfile = await getStorageItem('userProfile');

        setTimeout(() => {
          if (userProfile) {
            navigation.replace('Main' as any);
          } else {
            navigation.replace('NicheSelection');
          }
        }, 2000);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initialize();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shorty.ai</Text>
      <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 24,
  },
  loader: {
    marginTop: 16,
  },
});
