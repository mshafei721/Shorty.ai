import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initializeSchema } from './src/storage/schema';

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        await initializeSchema();
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        // In production, show error screen
        setIsInitialized(true); // For now, continue anyway
      }
    }

    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.container} testID="app-loading">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <RootNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
