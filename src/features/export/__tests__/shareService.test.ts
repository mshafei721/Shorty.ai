import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import { shareVideo } from '../services/shareService';
import { ShareOptions } from '../types';

jest.mock('expo-sharing');
jest.mock('expo-media-library');
jest.mock('expo-clipboard');

describe('shareService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('native share', () => {
    it('should share video using native sheet', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      const options: ShareOptions = {
        type: 'native',
        artifactUrl: 'file:///video.mp4',
        projectName: 'Test Project',
        assetId: 'asset-123',
      };

      const result = await shareVideo(options);

      expect(result.success).toBe(true);
      expect(result.action).toBe('shared');
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        'file:///video.mp4',
        expect.objectContaining({
          mimeType: 'video/mp4',
          dialogTitle: 'Share Test Project',
        })
      );
    });

    it('should handle share cancellation', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockRejectedValue(
        new Error('User cancelled share')
      );

      const options: ShareOptions = {
        type: 'native',
        artifactUrl: 'file:///video.mp4',
        assetId: 'asset-123',
      };

      const result = await shareVideo(options);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SHARE_CANCELLED');
    });

    it('should fail if sharing not available', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      const options: ShareOptions = {
        type: 'native',
        artifactUrl: 'file:///video.mp4',
        assetId: 'asset-123',
      };

      const result = await shareVideo(options);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('should fail if artifact not local', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);

      const options: ShareOptions = {
        type: 'native',
        artifactUrl: 'https://remote.com/video.mp4',
        assetId: 'asset-123',
      };

      const result = await shareVideo(options);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ASSET_NOT_READY');
    });
  });

  describe('save to photos', () => {
    it('should save video to camera roll', async () => {
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (MediaLibrary.createAssetAsync as jest.Mock).mockResolvedValue({
        id: 'asset-id',
      });

      const options: ShareOptions = {
        type: 'save_to_photos',
        artifactUrl: 'file:///video.mp4',
        assetId: 'asset-123',
      };

      const result = await shareVideo(options);

      expect(result.success).toBe(true);
      expect(result.action).toBe('saved');
      expect(MediaLibrary.createAssetAsync).toHaveBeenCalledWith('file:///video.mp4');
    });

    it('should handle permission denial', async () => {
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const options: ShareOptions = {
        type: 'save_to_photos',
        artifactUrl: 'file:///video.mp4',
        assetId: 'asset-123',
      };

      const result = await shareVideo(options);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSION_DENIED');
    });

    it('should handle storage full error', async () => {
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (MediaLibrary.createAssetAsync as jest.Mock).mockRejectedValue(
        new Error('Insufficient storage space')
      );

      const options: ShareOptions = {
        type: 'save_to_photos',
        artifactUrl: 'file:///video.mp4',
        assetId: 'asset-123',
      };

      const result = await shareVideo(options);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STORAGE_FULL');
    });
  });

  describe('copy link', () => {
    it('should copy link to clipboard', async () => {
      (Clipboard.setStringAsync as jest.Mock).mockResolvedValue(undefined);

      const options: ShareOptions = {
        type: 'copy_link',
        artifactUrl: 'https://share.shortyai.com/video.mp4',
        assetId: 'asset-123',
      };

      const result = await shareVideo(options);

      expect(result.success).toBe(true);
      expect(result.action).toBe('copied');
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
        'https://share.shortyai.com/video.mp4'
      );
    });

    it('should handle clipboard errors', async () => {
      (Clipboard.setStringAsync as jest.Mock).mockRejectedValue(
        new Error('Clipboard access denied')
      );

      const options: ShareOptions = {
        type: 'copy_link',
        artifactUrl: 'https://share.shortyai.com/video.mp4',
        assetId: 'asset-123',
      };

      const result = await shareVideo(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
