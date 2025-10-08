import { MockExportGateway } from '../gateway/ExportGateway';

describe('MockExportGateway', () => {
  let gateway: MockExportGateway;

  beforeEach(() => {
    gateway = new MockExportGateway();
  });

  describe('getLatestArtifact', () => {
    it('should return ready artifact by default', async () => {
      const artifact = await gateway.getLatestArtifact('project-1', 'asset-1');

      expect(artifact.projectId).toBe('project-1');
      expect(artifact.assetId).toBe('asset-1');
      expect(artifact.status).toBe('ready');
      expect(artifact.url).toBeTruthy();
      expect(artifact.sizeBytes).toBeGreaterThan(0);
      expect(artifact.durationSec).toBeGreaterThan(0);
    });

    it('should return same artifact on subsequent calls', async () => {
      const artifact1 = await gateway.getLatestArtifact('project-1', 'asset-1');
      const artifact2 = await gateway.getLatestArtifact('project-1', 'asset-1');

      expect(artifact1.createdAt).toBe(artifact2.createdAt);
      expect(artifact1.url).toBe(artifact2.url);
    });

    it('should return different artifacts for different assets', async () => {
      const artifact1 = await gateway.getLatestArtifact('project-1', 'asset-1');
      const artifact2 = await gateway.getLatestArtifact('project-1', 'asset-2');

      expect(artifact1.assetId).toBe('asset-1');
      expect(artifact2.assetId).toBe('asset-2');
      expect(artifact1.url).not.toBe(artifact2.url);
    });
  });

  describe('ensureShareableUrl', () => {
    it('should return URL for ready artifact', async () => {
      const url = await gateway.ensureShareableUrl('project-1', 'asset-1');

      expect(url).toBeTruthy();
      expect(url).toContain('mock://export/');
    });

    it('should throw error for failed artifact', async () => {
      gateway.setArtifactStatus('project-1', 'asset-1', 'failed');

      await expect(
        gateway.ensureShareableUrl('project-1', 'asset-1')
      ).rejects.toThrow('Artifact processing failed');
    });

    it('should throw error for pending artifact', async () => {
      const artifact = await gateway.getLatestArtifact('project-1', 'asset-1');
      gateway.setArtifactStatus('project-1', 'asset-1', 'pending');

      await expect(
        gateway.ensureShareableUrl('project-1', 'asset-1')
      ).rejects.toThrow('Artifact not ready for sharing');
    });

    it('should throw error for processing artifact', async () => {
      gateway.setArtifactStatus('project-1', 'asset-1', 'processing');

      await expect(
        gateway.ensureShareableUrl('project-1', 'asset-1')
      ).rejects.toThrow('Artifact not ready for sharing');
    });
  });

  describe('setArtifactStatus', () => {
    it('should update artifact status', async () => {
      await gateway.getLatestArtifact('project-1', 'asset-1');

      gateway.setArtifactStatus('project-1', 'asset-1', 'processing');

      const artifact = await gateway.getLatestArtifact('project-1', 'asset-1');
      expect(artifact.status).toBe('processing');
    });

    it('should update artifact URL', async () => {
      await gateway.getLatestArtifact('project-1', 'asset-1');

      gateway.setArtifactStatus('project-1', 'asset-1', 'ready', 'custom://url.mp4');

      const artifact = await gateway.getLatestArtifact('project-1', 'asset-1');
      expect(artifact.url).toBe('custom://url.mp4');
    });

    it('should set readyAt timestamp when status becomes ready', async () => {
      await gateway.getLatestArtifact('project-1', 'asset-1');

      gateway.setArtifactStatus('project-1', 'asset-1', 'pending');
      const before = await gateway.getLatestArtifact('project-1', 'asset-1');

      gateway.setArtifactStatus('project-1', 'asset-1', 'ready');
      const after = await gateway.getLatestArtifact('project-1', 'asset-1');

      expect(after.readyAt).toBeTruthy();
      expect(new Date(after.readyAt!).getTime()).toBeGreaterThan(
        new Date(before.createdAt).getTime()
      );
    });
  });
});
