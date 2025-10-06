import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import type { ProjectDashboardScreenProps } from '../navigation/types';
import { getStorageItem } from '../storage';
import type { Project, VideoAsset } from '../types';

export default function ProjectDashboardScreen({ route, navigation }: ProjectDashboardScreenProps) {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotFoundBanner, setShowNotFoundBanner] = useState(false);
  const { width } = useWindowDimensions();

  const numColumns = width >= 768 ? 3 : 2;

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  useEffect(() => {
    if (showNotFoundBanner) {
      const timer = setTimeout(() => {
        navigation.navigate('ProjectsList');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotFoundBanner, navigation]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const projects = await getStorageItem('projects');
      const allVideos = await getStorageItem('videos');

      if (projects) {
        const currentProject = projects.find((p) => p.id === projectId && !p.isDeleted);
        if (!currentProject) {
          setShowNotFoundBanner(true);
          setProject(null);
          setVideos([]);
          return;
        }
        setProject(currentProject);
      } else {
        setShowNotFoundBanner(true);
        setProject(null);
        setVideos([]);
        return;
      }

      if (allVideos) {
        const projectVideos = allVideos.filter((v) => {
          if (v.projectId !== projectId) return false;
          if (v.type === 'processed') return true;
          if (v.type === 'raw' && v.status === 'failed') return true;
          return false;
        });
        setVideos(projectVideos);
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProjectData();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVideoItem = ({ item }: { item: VideoAsset }) => (
    <View style={[styles.videoCard, { width: (width - 48) / numColumns }]}>
      <View style={styles.videoThumbnail}>
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.thumbnailIcon}>▶</Text>
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.durationSec)}</Text>
        </View>
      </View>
      {item.status === 'failed' && (
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>FAILED</Text>
        </View>
      )}
    </View>
  );

  if (showNotFoundBanner) {
    return (
      <View style={styles.container}>
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>Project not found</Text>
          <Text style={styles.errorBannerSubtext}>Redirecting to Projects List...</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!project) {
    return null;
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

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Videos</Text>
        </View>
        {videos.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No videos yet. Tap + to create.</Text>
          </View>
        ) : (
          <FlatList
            data={videos}
            renderItem={renderVideoItem}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            key={numColumns}
            contentContainerStyle={styles.videoGrid}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}

        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createButtonText}>+ Create New Video</Text>
        </TouchableOpacity>
      </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  videoGrid: {
    paddingBottom: 16,
  },
  videoCard: {
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoThumbnail: {
    aspectRatio: 9 / 16,
    position: 'relative',
  },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailIcon: {
    fontSize: 48,
    color: '#999999',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  errorBanner: {
    margin: 20,
    marginTop: 100,
    padding: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
  },
  errorBannerText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  errorBannerSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
