import { Camera, CameraPermissionStatus } from 'expo-camera';
import { Audio, PermissionStatus } from 'expo-av';
import { Linking, Platform } from 'react-native';

export type PermissionResult = 'granted' | 'denied' | 'blocked';

export async function requestCameraPermissions(): Promise<PermissionResult> {
  try {
    const cameraResult = await Camera.requestCameraPermissionsAsync();
    const audioResult = await Audio.requestPermissionsAsync();

    if (cameraResult.status === 'granted' && audioResult.status === 'granted') {
      return 'granted';
    }

    if (cameraResult.canAskAgain === false || audioResult.canAskAgain === false) {
      return 'blocked';
    }

    return 'denied';
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return 'denied';
  }
}

export async function checkCameraPermissions(): Promise<PermissionResult> {
  try {
    const cameraResult = await Camera.getCameraPermissionsAsync();
    const audioResult = await Audio.getPermissionsAsync();

    if (cameraResult.status === 'granted' && audioResult.status === 'granted') {
      return 'granted';
    }

    if (cameraResult.canAskAgain === false || audioResult.canAskAgain === false) {
      return 'blocked';
    }

    return 'denied';
  } catch (error) {
    console.error('Error checking camera permissions:', error);
    return 'denied';
  }
}

export async function openDeviceSettings(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('Failed to open device settings:', error);
    throw new Error('Unable to open settings. Please open Settings app manually and enable camera and microphone permissions for Shorty.ai');
  }
}
