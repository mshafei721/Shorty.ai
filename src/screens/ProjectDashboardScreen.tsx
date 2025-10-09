/**
 * Project Dashboard Screen
 *
 * Consolidated hub showing active videos, AI script drafts, and quick actions.
 * Central navigation point for creators after onboarding.
 *
 * @module screens/ProjectDashboardScreen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { StorageBanner } from '../components/StorageBanner';
import { checkStorageStatus, type StorageStatus } from '../utils/storageGuards';

interface Project {
  id: string;
  name: string;
  niche: string;
  subNiche: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

interface VideoAsset {
  id: string;
  projectId: string;
  type: 'raw' | 'processed';
  status: 'ready' | 'processing' | 'failed' | 'cancelled';
  createdAt: string;
}

interface Script {
  id: string;
  projectId: string;
  text: string;
  createdAt: string;
  source: 'ai' | 'manual';
}

export default function ProjectDashboardScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProjectDashboard'>>();
  const { projectId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [projectId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all projects to find current project
      const projectsJson = await AsyncStorage.getItem('projects');
      const projectsData = projectsJson ? JSON.parse(projectsJson) : [];
      const allProjects = projectsData.filter((p: Project) => !p.isDeleted);
      setProjects(allProjects);

      // Find current project
      const project = allProjects.find((p: Project) => p.id === projectId);
      setCurrentProject(project || null);

      // Load videos filtered by projectId
      const videosJson = await AsyncStorage.getItem('videos');
      const videosData = videosJson ? JSON.parse(videosJson) : [];
      setVideos(videosData.filter((v: VideoAsset) => v.projectId === projectId));

      // Load scripts filtered by projectId
      const scriptsJson = await AsyncStorage.getItem('scripts');
      const scriptsData = scriptsJson ? JSON.parse(scriptsJson) : [];
      setScripts(scriptsData.filter((s: Script) => s.projectId === projectId));

      // Check storage
      const storage = await checkStorageStatus();
      setStorageStatus(storage);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleCreateProject = () => {
    navigation.navigate('CreateProject');
  };

  const handleGenerateScript = () => {
    navigation.navigate('ScriptStudio', {
      projectId,
      niche: currentProject?.niche,
      subNiche: currentProject?.subNiche,
    });
  };

  const handleStartRecording = () => {
    navigation.navigate('Record', {});
  };

  const getVideosByProject = (projectId: string) => {
    return videos.filter(v => v.projectId === projectId);
  };

  const getRecentScripts = () => {
    return scripts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getActiveVideos = () => {
    return videos
      .filter(v => v.status === 'processing' || v.status === 'ready')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return '#4CAF50';
      case 'processing':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const activeVideos = getActiveVideos();
  const recentScripts = getRecentScripts();

  return (
    <View style={styles.container}>
      {storageStatus && <StorageBanner status={storageStatus} />}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>{currentProject?.name || 'Project Dashboard'}</Text>
          <Text style={styles.subtitle}>
            {currentProject?.niche} {currentProject?.subNiche && `→ ${currentProject.subNiche}`}
          </Text>
          <Text style={styles.projectMeta}>
            {videos.length} {videos.length === 1 ? 'video' : 'videos'} · {scripts.length} {scripts.length === 1 ? 'script' : 'scripts'}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleCreateProject}>
              <Ionicons name="add-circle-outline" size={32} color="#007AFF" style={styles.actionIconView} />
              <Text style={styles.actionLabel}>New Project</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleGenerateScript}>
              <Ionicons name="sparkles-outline" size={32} color="#007AFF" style={styles.actionIconView} />
              <Text style={styles.actionLabel}>Generate Script</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleStartRecording}>
              <Ionicons name="videocam-outline" size={32} color="#007AFF" style={styles.actionIconView} />
              <Text style={styles.actionLabel}>Record Video</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Videos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Videos</Text>
          {activeVideos.length === 0 ? (
            <Text style={styles.emptyText}>No active videos yet</Text>
          ) : (
            <View style={styles.videoList}>
              {activeVideos.map(video => {
                const project = projects.find(p => p.id === video.projectId);
                return (
                  <View key={video.id} style={styles.videoCard}>
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoProject}>{project?.name || 'Unknown'}</Text>
                      <Text style={styles.videoType}>
                        {video.type === 'raw' ? 'Raw' : 'Processed'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(video.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{video.status}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* AI Script Drafts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Scripts</Text>
          {recentScripts.length === 0 ? (
            <Text style={styles.emptyText}>No scripts yet</Text>
          ) : (
            <View style={styles.scriptList}>
              {recentScripts.map(script => {
                const project = projects.find(p => p.id === script.projectId);
                return (
                  <View key={script.id} style={styles.scriptCard}>
                    <View style={styles.scriptHeader}>
                      <Text style={styles.scriptProject}>{project?.name || 'Unknown'}</Text>
                      <View style={styles.scriptSourceBadge}>
                        <Ionicons
                          name={script.source === 'ai' ? 'sparkles' : 'create-outline'}
                          size={14}
                          color={script.source === 'ai' ? '#9C27B0' : '#666'}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.scriptSource}>
                          {script.source === 'ai' ? 'AI' : 'Manual'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.scriptPreview} numberOfLines={2}>
                      {script.text}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Projects List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Projects</Text>
          {projects.length === 0 ? (
            <Text style={styles.emptyText}>No projects yet. Create one to get started!</Text>
          ) : (
            <View style={styles.projectList}>
              {projects.map(project => {
                const projectVideos = getVideosByProject(project.id);
                return (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.projectCard}
                    onPress={() => {
                      // Navigate to current project dashboard (self-referential)
                      if (project.id !== projectId) {
                        navigation.navigate('ProjectDashboard', { projectId: project.id });
                      }
                    }}
                  >
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectNiche}>
                      {project.niche} → {project.subNiche}
                    </Text>
                    <Text style={styles.projectVideos}>
                      {projectVideos.length} {projectVideos.length === 1 ? 'video' : 'videos'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  projectMeta: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconView: {
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  videoList: {
    gap: 12,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  videoInfo: {
    flex: 1,
  },
  videoProject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  videoType: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  scriptList: {
    gap: 12,
  },
  scriptCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  scriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scriptProject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  scriptSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scriptSource: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  scriptPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  projectList: {
    gap: 12,
    marginBottom: 24,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  projectNiche: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  projectVideos: {
    fontSize: 12,
    color: '#999',
  },
});
