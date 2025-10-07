import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createVideoMetadata,
  getVideoMetadata,
  listVideoMetadata,
  updateVideoMetadata,
  deleteVideoMetadata,
  clearProjectMetadata,
  getMetadataCount,
  VideoMetadata,
} from '../videoMetadata';

describe('videoMetadata', () => {
  const mockProjectId = 'project-123';
  const mockAssetId = 'asset-456';

  const mockMetadata: VideoMetadata = {
    assetId: mockAssetId,
    projectId: mockProjectId,
    scriptId: 'script-789',
    filePath: '/videos/raw/project-123/video.mp4',
    width: 1080,
    height: 1920,
    fps: 30,
    durationMs: 30000,
    sizeBytes: 5000000,
    createdAt: '2025-10-07T10:00:00.000Z',
    processingStatus: 'raw',
    notes: 'Test video',
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('createVideoMetadata', () => {
    it('creates new metadata record', async () => {
      await createVideoMetadata(mockMetadata);

      const key = `shortyai:videoMeta:${mockProjectId}:${mockAssetId}`;
      const stored = await AsyncStorage.getItem(key);

      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(mockMetadata);
    });

    it('creates index entry', async () => {
      await createVideoMetadata(mockMetadata);

      const indexKey = `shortyai:videoMeta:index:${mockProjectId}`;
      const index = await AsyncStorage.getItem(indexKey);

      expect(index).not.toBeNull();
      expect(JSON.parse(index!)).toEqual([mockAssetId]);
    });

    it('does not duplicate index entries', async () => {
      await createVideoMetadata(mockMetadata);
      await createVideoMetadata(mockMetadata); // Create again

      const indexKey = `shortyai:videoMeta:index:${mockProjectId}`;
      const index = await AsyncStorage.getItem(indexKey);

      expect(JSON.parse(index!)).toEqual([mockAssetId]);
    });

    it('handles multiple assets in same project', async () => {
      const asset1 = { ...mockMetadata, assetId: 'asset-1' };
      const asset2 = { ...mockMetadata, assetId: 'asset-2' };

      await createVideoMetadata(asset1);
      await createVideoMetadata(asset2);

      const indexKey = `shortyai:videoMeta:index:${mockProjectId}`;
      const index = await AsyncStorage.getItem(indexKey);

      expect(JSON.parse(index!)).toEqual(['asset-1', 'asset-2']);
    });

    it('throws error on storage failure', async () => {
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Storage error'));

      await expect(createVideoMetadata(mockMetadata)).rejects.toThrow(
        'Failed to save video metadata'
      );
    });
  });

  describe('getVideoMetadata', () => {
    beforeEach(async () => {
      await createVideoMetadata(mockMetadata);
    });

    it('retrieves existing metadata', async () => {
      const result = await getVideoMetadata(mockProjectId, mockAssetId);

      expect(result).toEqual(mockMetadata);
    });

    it('returns null for non-existent metadata', async () => {
      const result = await getVideoMetadata(mockProjectId, 'non-existent');

      expect(result).toBeNull();
    });

    it('returns null on storage error', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage error'));

      const result = await getVideoMetadata(mockProjectId, mockAssetId);

      expect(result).toBeNull();
    });
  });

  describe('listVideoMetadata', () => {
    it('returns empty array when no metadata exists', async () => {
      const result = await listVideoMetadata(mockProjectId);

      expect(result).toEqual([]);
    });

    it('lists all metadata for a project', async () => {
      const asset1 = { ...mockMetadata, assetId: 'asset-1' };
      const asset2 = { ...mockMetadata, assetId: 'asset-2' };

      await createVideoMetadata(asset1);
      await createVideoMetadata(asset2);

      const result = await listVideoMetadata(mockProjectId);

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([asset1, asset2]));
    });

    it('only returns metadata for specified project', async () => {
      const project1Asset = { ...mockMetadata, projectId: 'project-1', assetId: 'asset-1' };
      const project2Asset = { ...mockMetadata, projectId: 'project-2', assetId: 'asset-2' };

      await createVideoMetadata(project1Asset);
      await createVideoMetadata(project2Asset);

      const result = await listVideoMetadata('project-1');

      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('project-1');
    });

    it('filters out deleted metadata', async () => {
      const asset1 = { ...mockMetadata, assetId: 'asset-1' };
      const asset2 = { ...mockMetadata, assetId: 'asset-2' };

      await createVideoMetadata(asset1);
      await createVideoMetadata(asset2);
      await deleteVideoMetadata(mockProjectId, 'asset-1');

      const result = await listVideoMetadata(mockProjectId);

      expect(result).toHaveLength(1);
      expect(result[0].assetId).toBe('asset-2');
    });

    it('returns empty array on storage error', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage error'));

      const result = await listVideoMetadata(mockProjectId);

      expect(result).toEqual([]);
    });
  });

  describe('updateVideoMetadata', () => {
    beforeEach(async () => {
      await createVideoMetadata(mockMetadata);
    });

    it('updates metadata fields', async () => {
      await updateVideoMetadata(mockProjectId, mockAssetId, {
        processingStatus: 'processed',
        notes: 'Updated notes',
      });

      const updated = await getVideoMetadata(mockProjectId, mockAssetId);

      expect(updated?.processingStatus).toBe('processed');
      expect(updated?.notes).toBe('Updated notes');
    });

    it('preserves immutable fields', async () => {
      await updateVideoMetadata(mockProjectId, mockAssetId, {
        assetId: 'new-id', // Should not change
        projectId: 'new-project', // Should not change
        createdAt: '2025-01-01T00:00:00.000Z', // Should not change
        processingStatus: 'processed',
      } as any);

      const updated = await getVideoMetadata(mockProjectId, mockAssetId);

      expect(updated?.assetId).toBe(mockAssetId);
      expect(updated?.projectId).toBe(mockProjectId);
      expect(updated?.createdAt).toBe(mockMetadata.createdAt);
      expect(updated?.processingStatus).toBe('processed');
    });

    it('throws error for non-existent metadata', async () => {
      await expect(
        updateVideoMetadata(mockProjectId, 'non-existent', { notes: 'Test' })
      ).rejects.toThrow('Video metadata not found');
    });

    it('throws error on storage failure', async () => {
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Storage error'));

      await expect(
        updateVideoMetadata(mockProjectId, mockAssetId, { notes: 'Test' })
      ).rejects.toThrow('Failed to update video metadata');
    });
  });

  describe('deleteVideoMetadata', () => {
    beforeEach(async () => {
      await createVideoMetadata(mockMetadata);
    });

    it('removes metadata record', async () => {
      await deleteVideoMetadata(mockProjectId, mockAssetId);

      const result = await getVideoMetadata(mockProjectId, mockAssetId);

      expect(result).toBeNull();
    });

    it('removes from index', async () => {
      await deleteVideoMetadata(mockProjectId, mockAssetId);

      const indexKey = `shortyai:videoMeta:index:${mockProjectId}`;
      const index = await AsyncStorage.getItem(indexKey);

      expect(JSON.parse(index!)).toEqual([]);
    });

    it('only removes specified asset from index', async () => {
      const asset2 = { ...mockMetadata, assetId: 'asset-2' };
      await createVideoMetadata(asset2);

      await deleteVideoMetadata(mockProjectId, mockAssetId);

      const indexKey = `shortyai:videoMeta:index:${mockProjectId}`;
      const index = await AsyncStorage.getItem(indexKey);

      expect(JSON.parse(index!)).toEqual(['asset-2']);
    });

    it('throws error on storage failure', async () => {
      jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('Storage error'));

      await expect(deleteVideoMetadata(mockProjectId, mockAssetId)).rejects.toThrow(
        'Failed to delete video metadata'
      );
    });
  });

  describe('clearProjectMetadata', () => {
    it('removes all metadata for a project', async () => {
      const asset1 = { ...mockMetadata, assetId: 'asset-1' };
      const asset2 = { ...mockMetadata, assetId: 'asset-2' };

      await createVideoMetadata(asset1);
      await createVideoMetadata(asset2);

      await clearProjectMetadata(mockProjectId);

      const result = await listVideoMetadata(mockProjectId);

      expect(result).toEqual([]);
    });

    it('does not affect other projects', async () => {
      const project1Asset = { ...mockMetadata, projectId: 'project-1', assetId: 'asset-1' };
      const project2Asset = { ...mockMetadata, projectId: 'project-2', assetId: 'asset-2' };

      await createVideoMetadata(project1Asset);
      await createVideoMetadata(project2Asset);

      await clearProjectMetadata('project-1');

      const project1Result = await listVideoMetadata('project-1');
      const project2Result = await listVideoMetadata('project-2');

      expect(project1Result).toEqual([]);
      expect(project2Result).toHaveLength(1);
    });

    it('throws error on storage failure', async () => {
      await createVideoMetadata(mockMetadata);
      jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('Storage error'));

      await expect(clearProjectMetadata(mockProjectId)).rejects.toThrow(
        'Failed to clear project metadata'
      );
    });
  });

  describe('getMetadataCount', () => {
    it('returns 0 when no metadata exists', async () => {
      const count = await getMetadataCount(mockProjectId);

      expect(count).toBe(0);
    });

    it('returns correct count', async () => {
      const asset1 = { ...mockMetadata, assetId: 'asset-1' };
      const asset2 = { ...mockMetadata, assetId: 'asset-2' };
      const asset3 = { ...mockMetadata, assetId: 'asset-3' };

      await createVideoMetadata(asset1);
      await createVideoMetadata(asset2);
      await createVideoMetadata(asset3);

      const count = await getMetadataCount(mockProjectId);

      expect(count).toBe(3);
    });

    it('returns 0 on storage error', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage error'));

      const count = await getMetadataCount(mockProjectId);

      expect(count).toBe(0);
    });
  });
});
