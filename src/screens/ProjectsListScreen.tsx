import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ProjectsListScreen() {
  return (
    <View style={styles.container} testID="projects-list-screen">
      <Text style={styles.emptyText}>No projects yet. Tap + to create.</Text>
      <Text style={styles.subtitle}>Coming in Ticket A3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
});
