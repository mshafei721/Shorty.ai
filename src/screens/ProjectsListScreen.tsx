import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Project } from '../storage/schema';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function ProjectsListScreen() {
  const navigation = useNavigation<NavigationProp>();
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

  const handleCreateProject = () => {
    if (Platform.OS === 'web') {
      // Web fallback - prompt not supported
      Alert.alert('Create Project', 'Project creation requires native platform', [{ text: 'OK' }]);
      return;
    }

    Alert.prompt(
      'Create New Project',
      'Enter project name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (projectName?: string) => {
            if (!projectName || projectName.trim().length === 0) {
              Alert.alert('Error', 'Project name cannot be empty');
              return;
            }

            try {
              const userProfileData = await AsyncStorage.getItem('userProfile');
              const profile = userProfileData ? JSON.parse(userProfileData) : {};

              const newProject: Project = {
                id: `project_${Date.now()}`,
                name: projectName.trim(),
                niche: profile.niche || 'General',
                subNiche: profile.subNiche || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isDeleted: false,
              };

              const existingProjects = await AsyncStorage.getItem('projects');
              const projects: Project[] = existingProjects ? JSON.parse(existingProjects) : [];
              projects.push(newProject);
              await AsyncStorage.setItem('projects', JSON.stringify(projects));

              setProjects(projects.filter(p => !p.isDeleted));
              Alert.alert('Success', `Project "${projectName}" created!`);
            } catch (error) {
              console.error('Failed to create project:', error);
              Alert.alert('Error', 'Failed to create project. Please try again.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📹</Text>
      <Text style={styles.emptyStateTitle}>No Projects Yet</Text>
      <Text style={styles.emptyStateText}>
        Create your first {nicheInfo} video project to get started
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateProject}>
        <Text style={styles.createButtonText}>Create Project</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.createButton, styles.recordButton]}
        onPress={() => navigation.navigate('Record')}
      >
        <Text style={styles.createButtonText}>Test Record Screen</Text>
      </TouchableOpacity>
    </View>
  );

  const handleProjectPress = (project: Project) => {
    navigation.navigate('ProjectDashboard', { projectId: project.id });
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => handleProjectPress(item)}
      testID="project-card"
      accessibilityRole="button"
      accessibilityLabel={`Open project ${item.name}`}
    >
      <Text style={styles.projectName} testID="project-name">{item.name}</Text>
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
      {projects.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateProject}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
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
  recordButton: {
    backgroundColor: '#10B981',
    marginTop: 12,
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
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
});
