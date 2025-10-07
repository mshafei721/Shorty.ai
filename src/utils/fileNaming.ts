const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RAW_VIDEO_PATTERN = /^raw_([0-9a-f-]{36})_(\d+)\.mp4$/i;
const PROCESSED_VIDEO_PATTERN = /^processed_([0-9a-f-]{36})_(\d+)\.mp4$/i;

export interface ParsedVideoFilename {
  type: 'raw' | 'processed';
  id: string;
  timestamp: number;
}

export function validateUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

export function generateRawVideoFilename(projectId: string): string {
  if (!validateUUID(projectId)) {
    throw new Error(`Invalid projectId UUID: ${projectId}`);
  }
  const timestamp = Date.now();
  return `raw_${projectId}_${timestamp}.mp4`;
}

export function generateProcessedVideoFilename(videoId: string): string {
  if (!validateUUID(videoId)) {
    throw new Error(`Invalid videoId UUID: ${videoId}`);
  }
  const timestamp = Date.now();
  return `processed_${videoId}_${timestamp}.mp4`;
}

export function parseVideoFilename(filename: string): ParsedVideoFilename | null {
  const rawMatch = filename.match(RAW_VIDEO_PATTERN);
  if (rawMatch) {
    return {
      type: 'raw',
      id: rawMatch[1],
      timestamp: parseInt(rawMatch[2], 10),
    };
  }

  const processedMatch = filename.match(PROCESSED_VIDEO_PATTERN);
  if (processedMatch) {
    return {
      type: 'processed',
      id: processedMatch[1],
      timestamp: parseInt(processedMatch[2], 10),
    };
  }

  return null;
}
