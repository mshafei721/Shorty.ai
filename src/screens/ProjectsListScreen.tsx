import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Project } from '../storage/schema';

export default function ProjectsListScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [nicheInfo, setNicheInfo] = useState<string>('');

  useEffect(() => {
    loadProjects();
    loadNicheInfo();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsData = await AsyncStorage.getItem('projects');
      if (projectsData) {
        const parsedProjects: Project[] = JSON.parse(projectsData);
        setProjects(parsedProjects.filter(p => !p.isDeleted));
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadNicheInfo = async () => {
    try {
      const userProfileData = await AsyncStorage.getItem('userProfile');
      if (userProfileData) {
        const profile = JSON.parse(userProfileData);
        setNicheInfo(profile.niche || '');
      }
    } catch (error) {
      console.error('Failed to load niche info:', error);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📹</Text>
      <Text style={styles.emptyStateTitle}>No Projects Yet</Text>
      <Text style={styles.emptyStateText}>
        Create your first {nicheInfo} video project to get started
      </Text>
      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonText}>Create Project</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity style={styles.projectCard}>
      <Text style={styles.projectName}>{item.name}</Text>
      <Text style={styles.projectMeta}>
        {item.niche} • {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  projectMeta: {
    fontSize: 14,
    color: '#666',
  },
});
