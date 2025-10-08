import { ExportError, ExportErrorCode, RecoveryAction } from '../types';
import { Linking, Alert } from 'react-native';

export function createExportError(
  code: ExportErrorCode,
  technicalMessage: string
): ExportError {
  const errorMap: Record<ExportErrorCode, { userMessage: string; actions: RecoveryAction[] }> = {
    NETWORK_OFFLINE: {
      userMessage: 'No internet connection. Your action will be retried when you\'re back online.',
      actions: [
        { type: 'dismiss', label: 'OK' },
        { type: 'retry', label: 'Retry Now' },
      ],
    },
    ASSET_NOT_READY: {
      userMessage: 'Your video is still processing. Please wait a moment and try again.',
      actions: [
        { type: 'dismiss', label: 'OK' },
        { type: 'retry', label: 'Check Again' },
      ],
    },
    ASSET_EXPIRED: {
      userMessage: 'This video has expired. Please re-process it to export.',
      actions: [
        { type: 'dismiss', label: 'OK' },
        { type: 'report_issue', label: 'Report Issue' },
      ],
    },
    PERMISSION_DENIED: {
      userMessage: 'Permission denied. Please grant access in Settings to continue.',
      actions: [
        { type: 'open_settings', label: 'Open Settings', handler: openAppSettings },
        { type: 'dismiss', label: 'Cancel' },
      ],
    },
    STORAGE_FULL: {
      userMessage: 'Not enough storage space. Please free up space and try again.',
      actions: [
        { type: 'clear_cache', label: 'Clear Cache' },
        { type: 'dismiss', label: 'Cancel' },
      ],
    },
    SHARE_CANCELLED: {
      userMessage: 'Share cancelled.',
      actions: [
        { type: 'dismiss', label: 'OK' },
      ],
    },
    UNKNOWN_ERROR: {
      userMessage: 'An unexpected error occurred. Please try again.',
      actions: [
        { type: 'retry', label: 'Retry' },
        { type: 'report_issue', label: 'Report Issue' },
        { type: 'dismiss', label: 'Cancel' },
      ],
    },
  };

  const config = errorMap[code];

  return {
    code,
    message: technicalMessage,
    userMessage: config.userMessage,
    recoveryActions: config.actions,
  };
}

async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (error) {
    Alert.alert('Error', 'Could not open settings');
  }
}

export function showErrorDialog(error: ExportError, onAction?: (action: RecoveryAction) => void): void {
  const buttons = error.recoveryActions.map(action => ({
    text: action.label,
    onPress: async () => {
      if (action.handler) {
        await action.handler();
      }
      if (onAction) {
        onAction(action);
      }
    },
    style: action.type === 'dismiss' ? 'cancel' : 'default',
  }));

  Alert.alert('Export Error', error.userMessage, buttons as any);
}
