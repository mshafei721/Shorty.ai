import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { ExportArtifact, ShareOptions } from '../types';
import { createExportGateway } from '../gateway/ExportGateway';
import { shareVideo } from '../services/shareService';
import { showErrorDialog } from '../utils/errorHandler';
import { trackExportShareOpened, trackExportSuccess, trackExportFailed } from '../telemetry/events';

export interface ExportPanelProps {
  projectId: string;
  assetId: string;
  projectName: string;
  onClose?: () => void;
}

export function ExportPanel({ projectId, assetId, projectName, onClose }: ExportPanelProps) {
  const [artifact, setArtifact] = useState<ExportArtifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const gateway = createExportGateway();

  useEffect(() => {
    loadArtifact();
    trackExportShareOpened(projectId);
  }, [projectId, assetId]);

  async function loadArtifact() {
    try {
      setLoading(true);
      const data = await gateway.getLatestArtifact(projectId, assetId);
      setArtifact(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load export information');
    } finally {
      setLoading(false);
    }
  }

  async function handleShare(type: ShareOptions['type']) {
    if (!artifact || artifact.status !== 'ready' || !artifact.url) {
      Alert.alert('Not Ready', 'Video is not ready for export yet');
      return;
    }

    try {
      setSharing(true);

      const options: ShareOptions = {
        type,
        artifactUrl: artifact.url,
        projectName,
        assetId,
      };

      const result = await shareVideo(options);

      if (result.success) {
        await trackExportSuccess(projectId, type);

        const actionMessages: Record<string, string> = {
          shared: 'Video shared successfully!',
          saved: 'Video saved to Photos!',
          copied: 'Link copied to clipboard!',
          cancelled: 'Share cancelled',
        };

        Alert.alert('Success', actionMessages[result.action!] || 'Export completed');

        if (onClose) onClose();
      } else if (result.error) {
        await trackExportFailed(projectId, result.error.code);
        showErrorDialog(result.error, async (action) => {
          if (action.type === 'retry') {
            await handleShare(type);
          }
        });
      }
    } catch (error) {
      await trackExportFailed(projectId, 'UNKNOWN_ERROR');
      Alert.alert('Error', 'Failed to share video');
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading export info...</Text>
      </View>
    );
  }

  if (!artifact) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load export information</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadArtifact}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isReady = artifact.status === 'ready' && artifact.url;
  const isProcessing = artifact.status === 'processing' || artifact.status === 'pending';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Export Video</Text>

      {isProcessing && (
        <View style={styles.statusCard}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.statusText}>Processing video...</Text>
        </View>
      )}

      {artifact.status === 'failed' && (
        <View style={[styles.statusCard, styles.errorCard]}>
          <Text style={styles.errorText}>Processing failed</Text>
          <Text style={styles.errorMessage}>{artifact.error?.message || 'Unknown error'}</Text>
        </View>
      )}

      {isReady && (
        <>
          <View style={styles.infoCard}>
            <InfoRow label="Duration" value={`${artifact.durationSec}s`} />
            <InfoRow label="Size" value={formatBytes(artifact.sizeBytes || 0)} />
            {artifact.expiresAt && (
              <InfoRow label="Expires" value={formatExpiry(artifact.expiresAt)} />
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => handleShare('native')}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>📤 Share</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => handleShare('save_to_photos')}
            disabled={sharing}
          >
            <Text style={styles.buttonTextSecondary}>💾 Save to Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => handleShare('copy_link')}
            disabled={sharing}
          >
            <Text style={styles.buttonTextSecondary}>🔗 Copy Link</Text>
          </TouchableOpacity>
        </>
      )}

      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatExpiry(expiresAt: string): string {
  const expires = new Date(expiresAt);
  const now = new Date();
  const hoursLeft = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60));

  if (hoursLeft < 1) return 'Soon';
  if (hoursLeft < 24) return `${hoursLeft}h`;
  return `${Math.floor(hoursLeft / 24)}d`;
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  errorCard: {
    backgroundColor: '#FFE5E5',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    fontWeight: '600',
  },
  errorMessage: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  retryButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
});
