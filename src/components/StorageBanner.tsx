/**
 * Storage Banner Component
 *
 * Displays persistent banner when storage is low or critical.
 * Yellow warning for <2GB, Red critical for <500MB.
 *
 * @module components/StorageBanner
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import type { StorageStatus } from '../utils/storageGuards';

export interface StorageBannerProps {
  status: StorageStatus;
  onManageStorage?: () => void;
}

export function StorageBanner({ status, onManageStorage }: StorageBannerProps) {
  if (status.level === 'ok') {
    return null;
  }

  const isCritical = status.level === 'critical';

  const handleManageStorage = () => {
    if (onManageStorage) {
      onManageStorage();
    } else {
      // Open device settings (platform-specific)
      Linking.openSettings();
    }
  };

  return (
    <View style={[styles.banner, isCritical ? styles.bannerCritical : styles.bannerWarning]}>
      <View style={styles.content}>
        <Text style={styles.icon}>{isCritical ? '⚠️' : '⚡'}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isCritical ? 'Storage Critical' : 'Low Storage'}
          </Text>
          <Text style={styles.message}>
            {isCritical
              ? `Only ${Math.round(status.freeMB)} MB free. Recording disabled.`
              : `${status.freeGB.toFixed(1)} GB free. Free up space soon.`}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleManageStorage}>
        <Text style={styles.buttonText}>Manage</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
  },
  bannerWarning: {
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
  },
  bannerCritical: {
    backgroundColor: '#F8D7DA',
    borderBottomWidth: 1,
    borderBottomColor: '#F5C2C7',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
