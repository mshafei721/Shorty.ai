/**
 * Create Project Screen
 *
 * Form to create new projects with name and niche selection.
 * Validates input and saves to AsyncStorage.
 *
 * @module screens/CreateProjectScreen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Project {
  id: string;
  name: string;
  niche: string;
  subNiche: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

const NICHES = [
  'Healthcare',
  'Finance',
  'Fitness',
  'Education',
  'Technology',
  'Real Estate',
  'Food & Cooking',
  'Travel',
  'Fashion',
  'Business',
];

const SUB_NICHES: Record<string, string[]> = {
  Healthcare: ['Physiotherapy', 'Nutrition', 'Mental Health', 'General Practice'],
  Finance: ['Personal Finance', 'Investing', 'Banking', 'Crypto'],
  Fitness: ['Yoga', 'Weight Training', 'Running', 'CrossFit'],
  Education: ['STEM', 'Languages', 'History', 'Arts'],
  Technology: ['Software', 'Hardware', 'AI/ML', 'Web Dev'],
  'Real Estate': ['Residential', 'Commercial', 'Rentals', 'Investment'],
  'Food & Cooking': ['Recipes', 'Baking', 'Meal Prep', 'Nutrition'],
  Travel: ['Adventure', 'Budget Travel', 'Luxury', 'Solo Travel'],
  Fashion: ['Streetwear', 'Sustainable', 'Luxury', 'DIY'],
  Business: ['Startups', 'Marketing', 'Sales', 'Leadership'],
};

export default function CreateProjectScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [projectName, setProjectName] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [selectedSubNiche, setSelectedSubNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [userNiche, setUserNiche] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userProfileData = await AsyncStorage.getItem('userProfile');
      if (userProfileData) {
        const profile = JSON.parse(userProfileData);
        if (profile.niche) {
          setUserNiche(profile.niche);
          setSelectedNiche(profile.niche);
          if (profile.subNiche) {
            setSelectedSubNiche(profile.subNiche);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const validateForm = (): boolean => {
    if (!projectName.trim()) {
      Alert.alert('Validation Error', 'Project name is required');
      return false;
    }

    if (projectName.trim().length < 2 || projectName.trim().length > 100) {
      Alert.alert('Validation Error', 'Project name must be 2-100 characters');
      return false;
    }

    if (!selectedNiche) {
      Alert.alert('Validation Error', 'Please select a niche');
      return false;
    }

    if (!selectedSubNiche) {
      Alert.alert('Validation Error', 'Please select a sub-niche');
      return false;
    }

    return true;
  };

  const handleCreateProject = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const projectsJson = await AsyncStorage.getItem('projects');
      const projects: Project[] = projectsJson ? JSON.parse(projectsJson) : [];

      const newProject: Project = {
        id: `project_${Date.now()}`,
        name: projectName.trim(),
        niche: selectedNiche,
        subNiche: selectedSubNiche,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      };

      projects.push(newProject);
      await AsyncStorage.setItem('projects', JSON.stringify(projects));

      navigation.navigate('ProjectDashboard', { projectId: newProject.id });
    } catch (error) {
      console.error('Failed to create project:', error);
      Alert.alert('Error', 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableSubNiches = selectedNiche ? SUB_NICHES[selectedNiche] || [] : [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="folder-open-outline" size={48} color="#007AFF" />
          <Text style={styles.title}>Create New Project</Text>
          <Text style={styles.subtitle}>
            Set up a new project to organize your videos
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Name *</Text>
            <TextInput
              style={styles.input}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="e.g., Morning Yoga Series"
              placeholderTextColor="#999"
              maxLength={100}
              autoFocus
            />
            <Text style={styles.hint}>{projectName.length}/100 characters</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Niche *</Text>
            {userNiche ? (
              <View style={styles.inheritedNiche}>
                <Text style={styles.inheritedText}>
                  Using your profile niche: {userNiche}
                </Text>
                <TouchableOpacity onPress={() => setUserNiche('')}>
                  <Text style={styles.changeLink}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pickerContainer}>
                {NICHES.map((niche) => (
                  <TouchableOpacity
                    key={niche}
                    style={[
                      styles.pickerOption,
                      selectedNiche === niche && styles.pickerOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedNiche(niche);
                      setSelectedSubNiche('');
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        selectedNiche === niche && styles.pickerTextSelected,
                      ]}
                    >
                      {niche}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {selectedNiche && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sub-Niche *</Text>
              <View style={styles.pickerContainer}>
                {availableSubNiches.map((subNiche) => (
                  <TouchableOpacity
                    key={subNiche}
                    style={[
                      styles.pickerOption,
                      selectedSubNiche === subNiche && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setSelectedSubNiche(subNiche)}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        selectedSubNiche === subNiche && styles.pickerTextSelected,
                      ]}
                    >
                      {subNiche}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.createButton,
              loading && styles.createButtonDisabled,
            ]}
            onPress={handleCreateProject}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.createButtonText}>Create Project</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  inheritedNiche: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
  },
  inheritedText: {
    fontSize: 14,
    color: '#1976D2',
    flex: 1,
  },
  changeLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pickerText: {
    fontSize: 14,
    color: '#666',
  },
  pickerTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
