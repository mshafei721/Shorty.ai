import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';
import { ShareOptions, ShareResult, ExportError } from '../types';
import { createExportError } from '../utils/errorHandler';

export async function shareVideo(options: ShareOptions): Promise<ShareResult> {
  try {
    switch (options.type) {
      case 'native':
        return await shareNative(options);
      case 'save_to_photos':
        return await saveToPhotos(options);
      case 'copy_link':
        return await copyLink(options);
      default:
        throw new Error('Invalid share type');
    }
  } catch (error) {
    return {
      success: false,
      error: handleShareError(error),
    };
  }
}

async function shareNative(options: ShareOptions): Promise<ShareResult> {
  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    return {
      success: false,
      error: createExportError(
        'UNKNOWN_ERROR',
        'Native sharing is not available on this device'
      ),
    };
  }

  if (!options.artifactUrl.startsWith('file://')) {
    return {
      success: false,
      error: createExportError(
        'ASSET_NOT_READY',
        'Artifact must be downloaded locally before sharing'
      ),
    };
  }

  try {
    await Sharing.shareAsync(options.artifactUrl, {
      mimeType: 'video/mp4',
      dialogTitle: options.projectName ? `Share ${options.projectName}` : 'Share Video',
      UTI: 'public.mpeg-4',
    });

    return {
      success: true,
      action: 'shared',
    };
  } catch (error: any) {
    if (error?.message?.includes('cancelled')) {
      return {
        success: false,
        error: createExportError('SHARE_CANCELLED', 'User cancelled share'),
      };
    }
    throw error;
  }
}

async function saveToPhotos(options: ShareOptions): Promise<ShareResult> {
  const { status } = await MediaLibrary.requestPermissionsAsync();

  if (status !== 'granted') {
    return {
      success: false,
      error: createExportError(
        'PERMISSION_DENIED',
        'Media library permission not granted'
      ),
    };
  }

  if (!options.artifactUrl.startsWith('file://')) {
    return {
      success: false,
      error: createExportError(
        'ASSET_NOT_READY',
        'Artifact must be downloaded locally before saving'
      ),
    };
  }

  try {
    await MediaLibrary.createAssetAsync(options.artifactUrl);

    return {
      success: true,
      action: 'saved',
    };
  } catch (error: any) {
    if (error?.message?.includes('storage')) {
      return {
        success: false,
        error: createExportError('STORAGE_FULL', 'Insufficient storage space'),
      };
    }
    throw error;
  }
}

async function copyLink(options: ShareOptions): Promise<ShareResult> {
  try {
    await Clipboard.setStringAsync(options.artifactUrl);

    return {
      success: true,
      action: 'copied',
    };
  } catch (error) {
    throw new Error('Failed to copy link to clipboard');
  }
}

function handleShareError(error: unknown): ExportError {
  if (error instanceof Error) {
    if (error.message.includes('offline') || error.message.includes('network')) {
      return createExportError('NETWORK_OFFLINE', error.message);
    }
    if (error.message.includes('permission')) {
      return createExportError('PERMISSION_DENIED', error.message);
    }
    if (error.message.includes('storage')) {
      return createExportError('STORAGE_FULL', error.message);
    }
    return createExportError('UNKNOWN_ERROR', error.message);
  }
  return createExportError('UNKNOWN_ERROR', String(error));
}
