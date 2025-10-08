import { ExportArtifact, ExportGateway } from '../types';

const MOCK_ARTIFACT_DELAY_MS = 1500;
const MOCK_URL_GENERATION_DELAY_MS = 800;

export class MockExportGateway implements ExportGateway {
  private artifacts = new Map<string, ExportArtifact>();

  async getLatestArtifact(projectId: string, assetId: string): Promise<ExportArtifact> {
    await this.delay(MOCK_ARTIFACT_DELAY_MS);

    const key = `${projectId}_${assetId}`;
    let artifact = this.artifacts.get(key);

    if (!artifact) {
      artifact = this.createMockArtifact(projectId, assetId);
      this.artifacts.set(key, artifact);
    }

    return { ...artifact };
  }

  async ensureShareableUrl(projectId: string, assetId: string): Promise<string> {
    await this.delay(MOCK_URL_GENERATION_DELAY_MS);

    const artifact = await this.getLatestArtifact(projectId, assetId);

    if (artifact.status === 'failed') {
      throw new Error('Artifact processing failed');
    }

    if (artifact.status !== 'ready' || !artifact.url) {
      throw new Error('Artifact not ready for sharing');
    }

    return artifact.url;
  }

  setArtifactStatus(
    projectId: string,
    assetId: string,
    status: ExportArtifact['status'],
    url?: string
  ): void {
    const key = `${projectId}_${assetId}`;
    const artifact = this.artifacts.get(key);

    if (artifact) {
      artifact.status = status;
      if (url) artifact.url = url;
      if (status === 'ready') artifact.readyAt = new Date().toISOString();
    }
  }

  private createMockArtifact(projectId: string, assetId: string): ExportArtifact {
    const now = new Date();
    const readyAt = new Date(now.getTime() + 3000);
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return {
      assetId,
      projectId,
      url: `mock://export/${assetId}.mp4`,
      status: 'ready',
      createdAt: now.toISOString(),
      readyAt: readyAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      sizeBytes: 15728640,
      durationSec: 45,
      error: null,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function createExportGateway(): ExportGateway {
  return new MockExportGateway();
}
