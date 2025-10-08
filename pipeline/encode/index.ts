import * as crypto from 'crypto';

export interface EncodeProfile {
  codec: 'h264' | 'h265';
  width: number;
  height: number;
  bitrate?: number;
  fps?: number;
}

export interface MuxAdapter {
  submitEncode(srcUrl: string, profile: EncodeProfile): Promise<{ encodeId: string }>;
  pollEncode(encodeId: string): Promise<{
    status: 'processing' | 'ready' | 'failed';
    assetUrl?: string;
    checksum?: string;
    playbackId?: string;
  }>;
}

export class MuxEncodingAdapter implements MuxAdapter {
  private readonly tokenId: string;
  private readonly tokenSecret: string;
  private readonly baseUrl = 'https://api.mux.com';

  constructor(config: { tokenId: string; tokenSecret: string }) {
    this.tokenId = config.tokenId;
    this.tokenSecret = config.tokenSecret;
  }

  async submitEncode(srcUrl: string, profile: EncodeProfile): Promise<{ encodeId: string }> {
    const auth = this.generateAuth();

    const response = await fetch(`${this.baseUrl}/video/v1/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        input: [{ url: srcUrl }],
        playback_policy: ['public'],
        mp4_support: 'standard',
        encoding_tier: 'baseline',
        video_quality: this.mapProfile(profile),
        max_resolution_tier: this.getResolutionTier(profile),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mux encode submission failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    return { encodeId: data.data.id };
  }

  async pollEncode(encodeId: string): Promise<{
    status: 'processing' | 'ready' | 'failed';
    assetUrl?: string;
    checksum?: string;
    playbackId?: string;
  }> {
    const auth = this.generateAuth();

    const response = await fetch(`${this.baseUrl}/video/v1/assets/${encodeId}`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });

    if (!response.ok) {
      throw new Error(`Mux poll failed: ${response.status}`);
    }

    const data = await response.json();
    const asset = data.data;

    const status = this.normalizeStatus(asset.status);

    if (status === 'ready') {
      const playbackId = asset.playback_ids?.[0]?.id;
      const assetUrl = playbackId
        ? `https://stream.mux.com/${playbackId}.m3u8`
        : undefined;
      const mp4Url = asset.static_renditions?.files?.find(
        (f: any) => f.name === 'high.mp4'
      )?.url;

      const checksum = asset.mp4_support === 'standard'
        ? await this.calculateRemoteChecksum(mp4Url || assetUrl!)
        : undefined;

      return {
        status,
        assetUrl: mp4Url || assetUrl,
        playbackId,
        checksum,
      };
    }

    return { status };
  }

  async verifyChecksum(url: string, expectedChecksum: string): Promise<boolean> {
    const actualChecksum = await this.calculateRemoteChecksum(url);
    return actualChecksum === expectedChecksum;
  }

  private generateAuth(): string {
    const credentials = `${this.tokenId}:${this.tokenSecret}`;
    return Buffer.from(credentials).toString('base64');
  }

  private mapProfile(profile: EncodeProfile): string {
    if (profile.width <= 640) return 'basic';
    if (profile.width <= 1280) return 'plus';
    return 'max';
  }

  private getResolutionTier(profile: EncodeProfile): string {
    const maxDimension = Math.max(profile.width, profile.height);

    if (maxDimension <= 480) return '480p';
    if (maxDimension <= 720) return '720p';
    if (maxDimension <= 1080) return '1080p';
    if (maxDimension <= 1920) return '1080p';
    if (maxDimension <= 1440) return '1440p';
    return '2160p';
  }

  private normalizeStatus(muxStatus: string): 'processing' | 'ready' | 'failed' {
    const statusMap: Record<string, 'processing' | 'ready' | 'failed'> = {
      preparing: 'processing',
      processing: 'processing',
      ready: 'ready',
      errored: 'failed',
    };
    return statusMap[muxStatus] || 'processing';
  }

  private async calculateRemoteChecksum(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch asset for checksum: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const hash = crypto.createHash('md5');
    hash.update(Buffer.from(buffer));
    return hash.digest('hex');
  }
}

export class EncodingService {
  private adapter: MuxAdapter;

  constructor(adapter: MuxAdapter) {
    this.adapter = adapter;
  }

  async encodeVideo(
    srcUrl: string,
    profile: EncodeProfile = {
      codec: 'h264',
      width: 1080,
      height: 1920,
      bitrate: 10000000,
      fps: 30,
    }
  ): Promise<{ encodeId: string }> {
    return this.adapter.submitEncode(srcUrl, profile);
  }

  async pollUntilReady(
    encodeId: string,
    options: {
      maxAttempts?: number;
      intervalMs?: number;
    } = {}
  ): Promise<{
    status: 'ready' | 'failed';
    assetUrl?: string;
    checksum?: string;
    playbackId?: string;
  }> {
    const maxAttempts = options.maxAttempts ?? 120;
    const intervalMs = options.intervalMs ?? 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.adapter.pollEncode(encodeId);

      if (result.status === 'ready' || result.status === 'failed') {
        return result as { status: 'ready' | 'failed'; assetUrl?: string; checksum?: string; playbackId?: string };
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Encoding timed out after ${maxAttempts} attempts`);
  }

  async encodeAndWait(
    srcUrl: string,
    profile?: EncodeProfile,
    pollOptions?: { maxAttempts?: number; intervalMs?: number }
  ): Promise<{
    status: 'ready' | 'failed';
    assetUrl?: string;
    checksum?: string;
    playbackId?: string;
  }> {
    const { encodeId } = await this.encodeVideo(srcUrl, profile);
    return this.pollUntilReady(encodeId, pollOptions);
  }
}
