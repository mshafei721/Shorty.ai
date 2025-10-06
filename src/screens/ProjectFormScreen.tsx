import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import type { ProjectFormScreenProps } from '../navigation/types';
import { createProject, updateProject, getUserProfile } from '../utils/projectCrud';
import { getStorageItem } from '../storage';
import type { Project, UserProfile } from '../types';

const SUB_NICHES: Record<string, string[]> = {
  Healthcare: ['Physiotherapy', 'Cardiology', 'Dermatology'],
  Finance: ['Personal Finance', 'Investing', 'Real Estate'],
  Fitness: ['Yoga', 'Weightlifting', 'Running'],
  Education: ['K-12', 'Higher Ed', 'Professional Development'],
  'Real Estate': ['Residential', 'Commercial', 'Property Management'],
  Technology: ['Software Development', 'AI/ML', 'Cybersecurity'],
  'Food & Beverage': ['Restaurants', 'Recipes', 'Food Trucks'],
  Travel: ['Adventure', 'Luxury', 'Budget Travel'],
  Fashion: ['Streetwear', 'Haute Couture', 'Sustainable Fashion'],
};

const NICHES = Object.keys(SUB_NICHES);

export default function ProjectFormScreen({ route, navigation }: ProjectFormScreenProps) {
  const projectId = route.params?.projectId;
  const isEditing = !!projectId;

  const [name, setName] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedSubNiche, setSelectedSubNiche] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      if (isEditing && projectId) {
        const projects = await getStorageItem('projects');
        const project = projects?.find(p => p.id === projectId);
        if (project) {
          setName(project.name);
          setSelectedNiche(project.niche);
          setSelectedSubNiche(project.subNiche);
        }
        setIsLoadingProject(false);
      } else {
        const userProfile = await getUserProfile();
        if (userProfile) {
          setSelectedNiche(userProfile.niche);
          setSelectedSubNiche(userProfile.subNiche);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data');
      setIsLoadingProject(false);
    }
  };

  const handleSave = async () => {
    if (name.trim().length < 3 || name.trim().length > 50) {
      setError('Project name must be between 3 and 50 characters');
      return;
    }

    if (!selectedNiche || !selectedSubNiche) {
      setError('Please select a niche and sub-niche');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && projectId) {
        await updateProject(projectId, {
          name: name.trim(),
          niche: selectedNiche,
          subNiche: selectedSubNiche,
        });
      } else {
        await createProject(name.trim(), selectedNiche, selectedSubNiche);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save project:', error);
      setError('Failed to save project. Please try again.');
      setLoading(false);
    }
  };

  const getAvailableSubNiches = () => {
    return selectedNiche ? SUB_NICHES[selectedNiche] || [] : [];
  };

  if (isLoadingProject) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Project' : 'New Project'}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Project Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter project name (3-50 characters)"
            placeholderTextColor="#999999"
            maxLength={50}
            autoFocus={!isEditing}
          />
          <Text style={styles.characterCount}>{name.length}/50</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Niche</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {NICHES.map((niche) => (
              <TouchableOpacity
                key={niche}
                style={[
                  styles.chipButton,
                  selectedNiche === niche && styles.chipButtonSelected,
                ]}
                onPress={() => {
                  setSelectedNiche(niche);
                  setSelectedSubNiche(null);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedNiche === niche && styles.chipTextSelected,
                  ]}
                >
                  {niche}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedNiche && (
          <View style={styles.section}>
            <Text style={styles.label}>Sub-Niche</Text>
            <View style={styles.subNicheGrid}>
              {getAvailableSubNiches().map((subNiche) => (
                <TouchableOpacity
                  key={subNiche}
                  style={[
                    styles.subNicheButton,
                    selectedSubNiche === subNiche && styles.subNicheButtonSelected,
                  ]}
                  onPress={() => setSelectedSubNiche(subNiche)}
                >
                  <Text
                    style={[
                      styles.subNicheText,
                      selectedSubNiche === subNiche && styles.subNicheTextSelected,
                    ]}
                  >
                    {subNiche}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
  },
  characterCount: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    textAlign: 'right',
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  chipButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    color: '#000000',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  subNicheGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subNicheButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: '30%',
    flexGrow: 1,
  },
  subNicheButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  subNicheText: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
  },
  subNicheTextSelected: {
    color: '#FFFFFF',
  },
});
