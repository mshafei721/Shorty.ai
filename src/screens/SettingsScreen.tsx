import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function SettingsScreen() {
  return (
    <View style={styles.container} testID="settings-screen">
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>v0.1.0 - M0 Foundations</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
