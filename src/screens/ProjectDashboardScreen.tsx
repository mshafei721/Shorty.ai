import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { ProjectDashboardScreenProps } from '../navigation/types';
import { getStorageItem } from '../storage';
import type { Project, VideoAsset } from '../types';

export default function ProjectDashboardScreen({ route, navigation }: ProjectDashboardScreenProps) {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [videos, setVideos] = useState<VideoAsset[]>([]);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const projects = await getStorageItem('projects');
      const allVideos = await getStorageItem('videos');

      if (projects) {
        const currentProject = projects.find((p) => p.id === projectId);
        setProject(currentProject || null);
      }

      if (allVideos) {
        const projectVideos = allVideos.filter((v) => v.projectId === projectId);
        setVideos(projectVideos);
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
    }
  };

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.projectNiche}>
          {project.niche} - {project.subNiche}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Videos</Text>
          {videos.length === 0 ? (
            <Text style={styles.emptyText}>No videos yet</Text>
          ) : (
            videos.map((video) => (
              <View key={video.id} style={styles.videoCard}>
                <Text style={styles.videoType}>{video.type.toUpperCase()}</Text>
                <Text style={styles.videoStatus}>Status: {video.status}</Text>
                <Text style={styles.videoDuration}>
                  Duration: {video.durationSec}s
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createButtonText}>+ Create New Video</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  projectNiche: {
    fontSize: 14,
    color: '#666666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    fontStyle: 'italic',
  },
  videoCard: {
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
  videoType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  videoStatus: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  videoDuration: {
    fontSize: 14,
    color: '#666666',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#FF0000',
    textAlign: 'center',
    marginTop: 100,
  },
});
