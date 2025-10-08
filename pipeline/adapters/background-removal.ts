export interface BackgroundRemovalConfig {
  enabled: boolean;
  provider?: 'runwayml' | 'unscreen';
  apiKey?: string;
}

export interface BackgroundRemovalAdapter {
  removeBackground(videoUrl: string): Promise<{ processedUrl: string }>;
  isEnabled(): boolean;
}

export class BackgroundRemovalStub implements BackgroundRemovalAdapter {
  private readonly config: BackgroundRemovalConfig;

  constructor(config: BackgroundRemovalConfig) {
    this.config = config;
  }

  async removeBackground(videoUrl: string): Promise<{ processedUrl: string }> {
    if (!this.config.enabled) {
      throw new Error('Background removal is disabled via feature flag');
    }

    console.warn('Background removal is stubbed - returning original URL');
    return { processedUrl: videoUrl };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }
}
