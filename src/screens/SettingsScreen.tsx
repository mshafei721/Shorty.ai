import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [nicheInfo, setNicheInfo] = useState<string>('');
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);
  const [totalVideos, setTotalVideos] = useState(0);
  const [storageUsedMB, setStorageUsedMB] = useState(0);
  const [freeSpaceMB, setFreeSpaceMB] = useState(0);

  useEffect(() => {
    loadUserInfo();
    loadStorageInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userProfileData = await AsyncStorage.getItem('userProfile');
      if (userProfileData) {
        const profile = JSON.parse(userProfileData);
        setNicheInfo(profile.niche || 'Not set');
      }

      const telemetryPref = await AsyncStorage.getItem('telemetryEnabled');
      setTelemetryEnabled(telemetryPref === 'true');
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      // Count videos from AsyncStorage
      const videosData = await AsyncStorage.getItem('videos');
      const videos = videosData ? JSON.parse(videosData) : [];
      setTotalVideos(videos.length);

      // Calculate storage used (estimate based on video count)
      // Actual implementation would sum file sizes from FileSystem
      const estimatedStorageMB = videos.length * 50; // ~50MB per video estimate
      setStorageUsedMB(estimatedStorageMB);

      // Get free disk space
      try {
        const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
        setFreeSpaceMB(Math.round(freeDiskStorage / (1024 * 1024)));
      } catch (err) {
        // FileSystem API not available or unsupported platform
        console.log('Free disk storage API not available:', err);
      }
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const handleTelemetryToggle = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('telemetryEnabled', value.toString());
      setTelemetryEnabled(value);
    } catch (error) {
      console.error('Failed to update telemetry setting:', error);
    }
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will clear your niche selection and return you to the onboarding flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userProfile');
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' }],
                })
              );
            } catch (error) {
              console.error('Failed to reset onboarding:', error);
              Alert.alert('Error', 'Failed to reset. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all projects, videos, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              await AsyncStorage.multiRemove(keys);
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' }],
                })
              );
            } catch (error) {
              console.error('Failed to clear data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const hasLowStorage = freeSpaceMB > 0 && freeSpaceMB < 500;

  return (
    <ScrollView style={styles.container}>
      {/* User Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Preferences</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Selected Niche</Text>
          <Text style={styles.infoValue}>{nicheInfo}</Text>
        </View>
        <View style={[styles.infoRow, styles.toggleRow]}>
          <View>
            <Text style={styles.infoLabel}>Telemetry</Text>
            <Text style={styles.infoSubtext}>Help improve the app</Text>
          </View>
          <Switch value={telemetryEnabled} onValueChange={handleTelemetryToggle} />
        </View>
      </View>

      {/* Storage Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Clips</Text>
          <Text style={styles.infoValue}>{totalVideos}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Storage Used</Text>
          <Text style={styles.infoValue}>{storageUsedMB} MB</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Free Space</Text>
          <Text style={[styles.infoValue, hasLowStorage && styles.warningText]}>
            {freeSpaceMB} MB {hasLowStorage && '⚠️'}
          </Text>
        </View>
        {hasLowStorage && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningBannerText}>
              Low storage space. Consider deleting old videos to free up space.
            </Text>
          </View>
        )}
      </View>

      {/* App Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>
            {Constants.expoConfig?.version || '0.2.0'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Build</Text>
          <Text style={styles.infoValue}>
            {Constants.expoConfig?.android?.versionCode ||
             Constants.expoConfig?.ios?.buildNumber || '1'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Expo SDK</Text>
          <Text style={styles.infoValue}>54</Text>
        </View>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL('https://shortyai.app/privacy')}
        >
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL('https://shortyai.app/terms')}
        >
          <Text style={styles.linkText}>Terms of Service</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleResetOnboarding}>
          <Text style={styles.actionButtonText}>Reset Onboarding</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleClearData}
        >
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
            Clear All Data
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#000',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  dangerButtonText: {
    color: '#fff',
  },
  toggleRow: {
    alignItems: 'center',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  warningText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningBannerText: {
    color: '#856404',
    fontSize: 14,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
  },
  chevron: {
    fontSize: 24,
    color: '#C7C7CC',
  },
});
