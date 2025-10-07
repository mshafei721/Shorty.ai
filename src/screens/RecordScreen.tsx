import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  AppStateStatus,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  requestCameraPermissions,
  checkCameraPermissions,
  PermissionResult,
} from '../utils/permissions';
import { PermissionModal } from '../components/PermissionModal';
import { PermissionBanner } from '../components/PermissionBanner';

type NavigationProp = StackNavigationProp<any>;

export default function RecordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [permissionStatus, setPermissionStatus] = useState<PermissionResult>('denied');
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  const checkPermissions = async () => {
    const status = await checkCameraPermissions();
    setPermissionStatus(status);

    if (status === 'denied') {
      setShowBanner(true);
    } else if (status === 'blocked') {
      setShowModal(true);
    }
  };

  const requestPermissions = async () => {
    const status = await requestCameraPermissions();
    setPermissionStatus(status);

    if (status === 'denied') {
      setShowBanner(true);
    } else if (status === 'blocked') {
      setShowModal(true);
    } else if (status === 'granted') {
      setShowBanner(false);
      setShowModal(false);
    }
  };

  useEffect(() => {
    const initializePermissions = async () => {
      setIsCheckingPermissions(true);
      const status = await checkCameraPermissions();
      setPermissionStatus(status);

      if (status === 'denied' || status === 'blocked') {
        await requestPermissions();
      }
      setIsCheckingPermissions(false);
    };

    initializePermissions();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      await checkPermissions();
    }
  };

  const handleModalCancel = () => {
    setShowModal(false);
    navigation.goBack();
  };

  const handleBannerPress = async () => {
    setShowBanner(false);
    await requestPermissions();
  };

  const handleBannerDismiss = () => {
    setShowBanner(false);
  };

  const handleTestPermissions = () => {
    Alert.alert(
      'Permissions Test',
      'Camera and microphone permissions are granted!',
      [{ text: 'OK', style: 'default' }]
    );
  };

  if (isCheckingPermissions) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PermissionBanner
        visible={showBanner}
        onPress={handleBannerPress}
        onDismiss={handleBannerDismiss}
      />

      <PermissionModal
        visible={showModal}
        onCancel={handleModalCancel}
      />

      {permissionStatus === 'granted' ? (
        <View style={styles.content}>
          <Text style={styles.placeholderText}>
            Camera ready. Recording UI coming in B2.
          </Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestPermissions}
          >
            <Text style={styles.testButtonText}>Test Permissions</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.placeholderText}>
            Camera permissions required to continue.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
  testButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
