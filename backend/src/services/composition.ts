import axios from 'axios';
import { config } from '../config';
import type { SubtitleSegment } from '../types';

const SHOTSTACK_API_BASE = `https://api.shotstack.io/${config.shotstack.env}`;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 300;

interface ShotstackClip {
  asset: {
    type: string;
    src?: string;
  };
  start: number;
  length: number;
  fit?: string;
  scale?: number;
  position?: string;
}

interface ShotstackSubtitleClip {
  asset: {
    type: 'html';
    html: string;
    css: string;
    width: number;
    height: number;
  };
  start: number;
  length: number;
  position: string;
}

function buildSubtitleHTML(text: string): string {
  return `<div class="subtitle">${text}</div>`;
}

function buildSubtitleCSS(): string {
  return `
    .subtitle {
      font-family: 'Arial', sans-serif;
      font-size: 48px;
      font-weight: bold;
      color: #FFFFFF;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      padding: 12px 24px;
      background: rgba(0,0,0,0.6);
      border-radius: 8px;
      max-width: 90%;
      word-wrap: break-word;
    }
  `;
}

export async function createComposition(
  videoUrl: string,
  subtitles: SubtitleSegment[],
  videoDuration: number
): Promise<string> {
  const videoClip: ShotstackClip = {
    asset: {
      type: 'video',
      src: videoUrl,
    },
    start: 0,
    length: videoDuration,
    fit: 'cover',
    scale: 1,
  };

  const subtitleClips: ShotstackSubtitleClip[] = subtitles.map((segment) => ({
    asset: {
      type: 'html',
      html: buildSubtitleHTML(segment.text),
      css: buildSubtitleCSS(),
      width: 1080,
      height: 1920,
    },
    start: segment.start,
    length: segment.end - segment.start,
    position: 'bottom',
  }));

  const timeline = {
    tracks: [
      {
        clips: [videoClip],
      },
      {
        clips: subtitleClips,
      },
    ],
  };

  const output = {
    format: 'mp4',
    resolution: 'hd',
    aspectRatio: '9:16',
    size: {
      width: 1080,
      height: 1920,
    },
    fps: 30,
    quality: 'high',
  };

  const payload = {
    timeline,
    output,
  };

  const response = await axios.post(`${SHOTSTACK_API_BASE}/render`, payload, {
    headers: {
      'x-api-key': config.shotstack.apiKey,
      'content-type': 'application/json',
    },
  });

  return response.data.response.id;
}

export async function pollRenderStatus(renderId: string): Promise<string> {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    const response = await axios.get(`${SHOTSTACK_API_BASE}/render/${renderId}`, {
      headers: {
        'x-api-key': config.shotstack.apiKey,
      },
    });

    const { status, url, error } = response.data.response;

    if (status === 'done') {
      if (!url) {
        throw new Error('Render completed but no URL returned');
      }
      return url;
    }

    if (status === 'failed') {
      throw new Error(`Render failed: ${error || 'Unknown error'}`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    attempts++;
  }

  throw new Error('Render polling timeout');
}

export async function composeVideoWithSubtitles(
  videoUrl: string,
  subtitles: SubtitleSegment[],
  videoDuration: number
): Promise<string> {
  const renderId = await createComposition(videoUrl, subtitles, videoDuration);
  const outputUrl = await pollRenderStatus(renderId);
  return outputUrl;
}
