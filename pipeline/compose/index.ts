import { NormalizedTranscript, FillerSpan } from '../schemas/types';

export interface TimelineInput {
  transcript: NormalizedTranscript;
  fillers: FillerSpan[];
  brand: {
    introUrl?: string;
    outroUrl?: string;
  };
  captions: boolean;
  videoUrl: string;
}

export interface ShotstackAdapter {
  createTimeline(input: TimelineInput): Promise<{ timelineId: string }>;
  renderTimeline(timelineId: string): Promise<{ renderId: string }>;
  pollRender(renderId: string): Promise<{
    status: 'queued' | 'rendering' | 'done' | 'failed';
    artifactUrl?: string;
    progress?: number;
  }>;
}

interface ShotstackClip {
  asset: {
    type: 'video' | 'html' | 'image';
    src?: string;
    html?: string;
    width?: number;
    height?: number;
  };
  start: number;
  length: number;
  offset?: number;
  fit?: 'cover' | 'crop' | 'none';
  position?: 'center' | 'top' | 'bottom';
}

interface ShotstackTrack {
  clips: ShotstackClip[];
}

interface ShotstackTimeline {
  tracks: ShotstackTrack[];
  background: string;
}

export class ShotstackCompositionAdapter implements ShotstackAdapter {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.shotstack.io/v1';

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  async createTimeline(input: TimelineInput): Promise<{ timelineId: string }> {
    const timeline = this.buildTimeline(input);

    const response = await fetch(`${this.baseUrl}/timelines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({ timeline }),
    });

    if (!response.ok) {
      throw new Error(`Shotstack timeline creation failed: ${response.status}`);
    }

    const data = await response.json();
    return { timelineId: data.id };
  }

  async renderTimeline(timelineId: string): Promise<{ renderId: string }> {
    const response = await fetch(`${this.baseUrl}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        timeline: timelineId,
        output: {
          format: 'mp4',
          resolution: 'hd',
          size: {
            width: 1080,
            height: 1920,
          },
          fps: 30,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Shotstack render request failed: ${response.status}`);
    }

    const data = await response.json();
    return { renderId: data.response.id };
  }

  async pollRender(renderId: string): Promise<{
    status: 'queued' | 'rendering' | 'done' | 'failed';
    artifactUrl?: string;
    progress?: number;
  }> {
    const response = await fetch(`${this.baseUrl}/render/${renderId}`, {
      headers: { 'x-api-key': this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`Shotstack poll failed: ${response.status}`);
    }

    const data = await response.json();
    const status = this.normalizeStatus(data.response.status);

    return {
      status,
      artifactUrl: data.response.url,
      progress: this.calculateProgress(data.response.status),
    };
  }

  private buildTimeline(input: TimelineInput): ShotstackTimeline {
    const tracks: ShotstackTrack[] = [];
    const videoDuration = this.calculateDuration(input.transcript);

    const videoTrack: ShotstackTrack = {
      clips: this.buildVideoClips(input),
    };
    tracks.push(videoTrack);

    if (input.captions) {
      const captionTrack: ShotstackTrack = {
        clips: this.buildCaptionClips(input.transcript, input.fillers),
      };
      tracks.push(captionTrack);
    }

    if (input.brand.introUrl || input.brand.outroUrl) {
      const brandTrack: ShotstackTrack = {
        clips: this.buildBrandClips(input.brand, videoDuration),
      };
      tracks.push(brandTrack);
    }

    return {
      tracks,
      background: '#000000',
    };
  }

  private buildVideoClips(input: TimelineInput): ShotstackClip[] {
    const clips: ShotstackClip[] = [];
    const fillerSet = new Set(
      input.fillers
        .filter(f => f.label === 'filler')
        .map(f => `${f.startMs}-${f.endMs}`)
    );

    let currentStart = 0;
    let outputTime = 0;

    for (const filler of input.fillers.filter(f => f.label === 'filler')) {
      if (filler.startMs > currentStart) {
        const length = (filler.startMs - currentStart) / 1000;
        clips.push({
          asset: {
            type: 'video',
            src: input.videoUrl,
          },
          start: outputTime,
          length,
          offset: currentStart / 1000,
          fit: 'crop',
          position: 'center',
        });
        outputTime += length;
      }
      currentStart = filler.endMs;
    }

    const totalDuration = this.calculateDuration(input.transcript);
    if (currentStart < totalDuration) {
      const length = (totalDuration - currentStart) / 1000;
      clips.push({
        asset: {
          type: 'video',
          src: input.videoUrl,
        },
        start: outputTime,
        length,
        offset: currentStart / 1000,
        fit: 'crop',
        position: 'center',
      });
    }

    return clips;
  }

  private buildCaptionClips(
    transcript: NormalizedTranscript,
    fillers: FillerSpan[]
  ): ShotstackClip[] {
    return transcript.segments.map(segment => ({
      asset: {
        type: 'html',
        html: this.generateCaptionHtml(segment.text),
        width: 1080,
        height: 200,
      },
      start: segment.startMs / 1000,
      length: (segment.endMs - segment.startMs) / 1000,
      position: 'bottom',
    }));
  }

  private buildBrandClips(
    brand: { introUrl?: string; outroUrl?: string },
    videoDuration: number
  ): ShotstackClip[] {
    const clips: ShotstackClip[] = [];

    if (brand.introUrl) {
      clips.push({
        asset: {
          type: 'video',
          src: brand.introUrl,
        },
        start: 0,
        length: 2,
        fit: 'crop',
      });
    }

    if (brand.outroUrl) {
      clips.push({
        asset: {
          type: 'video',
          src: brand.outroUrl,
        },
        start: videoDuration / 1000,
        length: 2,
        fit: 'crop',
      });
    }

    return clips;
  }

  private generateCaptionHtml(text: string): string {
    return `
      <div style="
        font-family: Arial, sans-serif;
        font-size: 48px;
        font-weight: bold;
        color: white;
        text-align: center;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        padding: 20px;
        background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
      ">
        ${this.escapeHtml(text)}
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  private calculateDuration(transcript: NormalizedTranscript): number {
    if (transcript.tokens.length === 0) return 0;
    return transcript.tokens[transcript.tokens.length - 1].endMs;
  }

  private normalizeStatus(
    shotstackStatus: string
  ): 'queued' | 'rendering' | 'done' | 'failed' {
    const statusMap: Record<string, 'queued' | 'rendering' | 'done' | 'failed'> = {
      queued: 'queued',
      fetching: 'rendering',
      rendering: 'rendering',
      saving: 'rendering',
      done: 'done',
      failed: 'failed',
    };
    return statusMap[shotstackStatus] || 'queued';
  }

  private calculateProgress(shotstackStatus: string): number {
    const progressMap: Record<string, number> = {
      queued: 10,
      fetching: 30,
      rendering: 60,
      saving: 90,
      done: 100,
      failed: 0,
    };
    return progressMap[shotstackStatus] || 0;
  }
}
