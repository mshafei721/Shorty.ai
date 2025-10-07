const mockOpenURL = jest.fn();
const mockOpenSettings = jest.fn();
const mockRequestCameraPermissions = jest.fn();
const mockGetCameraPermissions = jest.fn();
const mockRequestAudioPermissions = jest.fn();
const mockGetAudioPermissions = jest.fn();

let mockPlatformOS = 'ios';

jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: () => mockRequestCameraPermissions(),
    getCameraPermissionsAsync: () => mockGetCameraPermissions(),
  },
}));

jest.mock('expo-audio', () => ({
  requestRecordingPermissionsAsync: () => mockRequestAudioPermissions(),
  getRecordingPermissionsAsync: () => mockGetAudioPermissions(),
}));

jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
  },
  Linking: {
    openURL: (...args: any[]) => mockOpenURL(...args),
    openSettings: (...args: any[]) => mockOpenSettings(...args),
  },
}));

import {
  requestCameraPermissions,
  checkCameraPermissions,
  openDeviceSettings,
} from '../permissions';

type PermissionResponse = {
  status: string;
  canAskAgain: boolean;
  granted: boolean;
  expires: string;
};

describe('permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformOS = 'ios';
  });

  describe('requestCameraPermissions', () => {
    it('returns granted when both camera and audio permissions are granted', async () => {
      const grantedResponse: PermissionResponse = {
        status: 'granted',
        canAskAgain: true,
        granted: true,
        expires: 'never',
      };

      mockRequestCameraPermissions.mockResolvedValue(grantedResponse);
      mockRequestAudioPermissions.mockResolvedValue(grantedResponse);

      const result = await requestCameraPermissions();
      expect(result).toBe('granted');
      expect(mockRequestCameraPermissions).toHaveBeenCalled();
      expect(mockRequestAudioPermissions).toHaveBeenCalled();
    });

    it('returns denied when camera permission is denied but can ask again', async () => {
      const cameraResponse: PermissionResponse = {
        status: 'denied',
        canAskAgain: true,
        granted: false,
        expires: 'never',
      };
      const audioResponse: PermissionResponse = {
        status: 'granted',
        canAskAgain: true,
        granted: true,
        expires: 'never',
      };

      mockRequestCameraPermissions.mockResolvedValue(cameraResponse);
      mockRequestAudioPermissions.mockResolvedValue(audioResponse);

      const result = await requestCameraPermissions();
      expect(result).toBe('denied');
    });

    it('returns denied when audio permission is denied but can ask again', async () => {
      const cameraResponse: PermissionResponse = {
        status: 'granted',
        canAskAgain: true,
        granted: true,
        expires: 'never',
      };
      const audioResponse: PermissionResponse = {
        status: 'denied',
        canAskAgain: true,
        granted: false,
        expires: 'never',
      };

      mockRequestCameraPermissions.mockResolvedValue(cameraResponse);
      mockRequestAudioPermissions.mockResolvedValue(audioResponse);

      const result = await requestCameraPermissions();
      expect(result).toBe('denied');
    });

    it('returns blocked when camera permission cannot ask again', async () => {
      const cameraResponse: PermissionResponse = {
        status: 'denied',
        canAskAgain: false,
        granted: false,
        expires: 'never',
      };
      const audioResponse: PermissionResponse = {
        status: 'granted',
        canAskAgain: true,
        granted: true,
        expires: 'never',
      };

      mockRequestCameraPermissions.mockResolvedValue(cameraResponse);
      mockRequestAudioPermissions.mockResolvedValue(audioResponse);

      const result = await requestCameraPermissions();
      expect(result).toBe('blocked');
    });

    it('returns blocked when audio permission cannot ask again', async () => {
      const cameraResponse: PermissionResponse = {
        status: 'granted',
        canAskAgain: true,
        granted: true,
        expires: 'never',
      };
      const audioResponse: PermissionResponse = {
        status: 'denied',
        canAskAgain: false,
        granted: false,
        expires: 'never',
      };

      mockRequestCameraPermissions.mockResolvedValue(cameraResponse);
      mockRequestAudioPermissions.mockResolvedValue(audioResponse);

      const result = await requestCameraPermissions();
      expect(result).toBe('blocked');
    });

    it('returns denied on error', async () => {
      mockRequestCameraPermissions.mockRejectedValue(
        new Error('Permission error')
      );

      const result = await requestCameraPermissions();
      expect(result).toBe('denied');
    });
  });

  describe('checkCameraPermissions', () => {
    it('returns granted when both permissions are granted', async () => {
      const grantedResponse: PermissionResponse = {
        status: 'granted',
        canAskAgain: true,
        granted: true,
        expires: 'never',
      };

      mockGetCameraPermissions.mockResolvedValue(grantedResponse);
      mockGetAudioPermissions.mockResolvedValue(grantedResponse);

      const result = await checkCameraPermissions();
      expect(result).toBe('granted');
      expect(mockGetCameraPermissions).toHaveBeenCalled();
      expect(mockGetAudioPermissions).toHaveBeenCalled();
    });

    it('returns denied when permissions are denied but can ask again', async () => {
      const deniedResponse: PermissionResponse = {
        status: 'denied',
        canAskAgain: true,
        granted: false,
        expires: 'never',
      };

      mockGetCameraPermissions.mockResolvedValue(deniedResponse);
      mockGetAudioPermissions.mockResolvedValue(deniedResponse);

      const result = await checkCameraPermissions();
      expect(result).toBe('denied');
    });

    it('returns blocked when camera permission cannot ask again', async () => {
      const blockedResponse: PermissionResponse = {
        status: 'denied',
        canAskAgain: false,
        granted: false,
        expires: 'never',
      };
      const grantedResponse: PermissionResponse = {
        status: 'granted',
        canAskAgain: true,
        granted: true,
        expires: 'never',
      };

      mockGetCameraPermissions.mockResolvedValue(blockedResponse);
      mockGetAudioPermissions.mockResolvedValue(grantedResponse);

      const result = await checkCameraPermissions();
      expect(result).toBe('blocked');
    });

    it('returns denied on error', async () => {
      mockGetCameraPermissions.mockRejectedValue(
        new Error('Check permission error')
      );

      const result = await checkCameraPermissions();
      expect(result).toBe('denied');
    });
  });

  describe('openDeviceSettings', () => {
    it('opens app-settings: on iOS', async () => {
      mockPlatformOS = 'ios';
      mockOpenURL.mockResolvedValue(undefined);

      await openDeviceSettings();
      expect(mockOpenURL).toHaveBeenCalledWith('app-settings:');
    });

    it('opens settings on Android', async () => {
      mockPlatformOS = 'android';
      mockOpenSettings.mockResolvedValue(undefined);

      await openDeviceSettings();
      expect(mockOpenSettings).toHaveBeenCalled();
    });

    it('throws error when opening settings fails', async () => {
      mockPlatformOS = 'ios';
      mockOpenURL.mockRejectedValue(new Error('Failed to open'));

      await expect(openDeviceSettings()).rejects.toThrow(
        'Unable to open settings. Please open Settings app manually and enable camera and microphone permissions for Shorty.ai'
      );
    });
  });
});
