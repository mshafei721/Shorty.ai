import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ProjectsListScreenProps } from '../navigation/types';
import { getActiveProjects, deleteProject } from '../utils/projectCrud';
import type { Project } from '../types';
import { useFocusEffect } from '@react-navigation/native';

export default function ProjectsListScreen({ navigation }: ProjectsListScreenProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    try {
      const activeProjects = await getActiveProjects();
      setProjects(activeProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleProjectPress = (projectId: string) => {
    navigation.navigate('ProjectDashboard', { projectId });
  };

  const handleProjectLongPress = (project: Project) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedProject(project);
    setShowContextMenu(true);
  };

  const handleNewProject = () => {
    navigation.navigate('ProjectForm');
  };

  const handleEditProject = () => {
    if (selectedProject) {
      setShowContextMenu(false);
      navigation.navigate('ProjectForm', { projectId: selectedProject.id });
      setSelectedProject(null);
    }
  };

  const handleDeleteProject = () => {
    if (selectedProject) {
      setShowContextMenu(false);
      Alert.alert(
        'Delete Project',
        `Delete '${selectedProject.name}'? This cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setSelectedProject(null),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteProject(selectedProject.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                await loadProjects();
                setSelectedProject(null);
              } catch (error) {
                console.error('Failed to delete project:', error);
                Alert.alert('Error', 'Failed to delete project. Please try again.');
              }
            },
          },
        ]
      );
    }
  };

  const handleCloseContextMenu = () => {
    setShowContextMenu(false);
    setSelectedProject(null);
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => handleProjectPress(item.id)}
      onLongPress={() => handleProjectLongPress(item)}
      delayLongPress={500}
    >
      <Text style={styles.projectName}>{item.name}</Text>
      <Text style={styles.projectNiche}>
        {item.niche} - {item.subNiche}
      </Text>
      <Text style={styles.projectDate}>
        Updated {new Date(item.updatedAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Projects</Text>
        <TouchableOpacity style={styles.newButton} onPress={handleNewProject}>
          <Text style={styles.newButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {projects.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No projects yet. Tap + to create.</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={showContextMenu}
        transparent
        animationType="fade"
        onRequestClose={handleCloseContextMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseContextMenu}
        >
          <View style={styles.contextMenu}>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={handleEditProject}
            >
              <Text style={styles.contextMenuText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.contextMenuDivider} />
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={handleDeleteProject}
            >
              <Text style={[styles.contextMenuText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  newButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '400',
  },
  listContent: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  projectNiche: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  projectDate: {
    fontSize: 12,
    color: '#999999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 200,
    overflow: 'hidden',
  },
  contextMenuItem: {
    padding: 16,
  },
  contextMenuText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  deleteText: {
    color: '#FF3B30',
  },
  contextMenuDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
});
