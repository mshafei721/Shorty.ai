/**
 * Video Processing Service
 *
 * Handles video upload, processing job creation, polling, and download
 * Integrates with backend API for automated video editing features.
 *
 * @module services/videoProcessing
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_M2_BASE_URL || 'http://localhost:3000';

export interface FeatureSelections {
  videoId: string;
  subtitles: boolean;
  backgroundChange: { enabled: boolean; presetId: string | null };
  backgroundMusic: { enabled: boolean; trackId: string | null; volume: number };
  introOutro: { enabled: boolean; templateId: string | null };
  fillerWordRemoval: boolean;
}

export interface ProcessingJob {
  id: string;
  videoId: string;
  status: 'idle' | 'uploading' | 'queued' | 'processing' | 'complete' | 'failed' | 'cancelled';
  progress: number;
  requestedFeatures: FeatureSelections;
  startedAt: string;
  completedAt: string | null;
  error: { code: string; message: string } | null;
  retries: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload video file to backend
 */
export async function uploadVideo(
  videoUri: string,
  projectId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ uploadId: string; url: string }> {
  try {
    const formData = new FormData();
    formData.append('video', {
      uri: videoUri,
      type: 'video/mp4',
      name: `video_${projectId}_${Date.now()}.mp4`,
    } as any);
    formData.append('projectId', projectId);

    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      uploadId: data.uploadId || data.id,
      url: data.url || data.videoUrl,
    };
  } catch (error) {
    console.error('Video upload error:', error);
    throw error;
  }
}

/**
 * Create processing job with feature selections
 */
export async function createProcessingJob(
  videoId: string,
  features: FeatureSelections
): Promise<ProcessingJob> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId,
        features,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Job creation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Job creation error:', error);
    throw error;
  }
}

/**
 * Poll job status with exponential backoff
 */
export async function pollJobStatus(
  jobId: string,
  onUpdate: (job: ProcessingJob) => void,
  options?: {
    interval?: number;
    maxAttempts?: number;
    maxDuration?: number;
  }
): Promise<ProcessingJob> {
  const interval = options?.interval || 2000; // 2 seconds
  const maxAttempts = options?.maxAttempts || 600; // 20 minutes at 2s intervals
  const maxDuration = options?.maxDuration || 1200000; // 20 minutes

  let attempts = 0;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        attempts++;

        // Check timeout
        if (Date.now() - startTime > maxDuration) {
          reject(new Error('Polling timeout: Maximum duration exceeded'));
          return;
        }

        if (attempts > maxAttempts) {
          reject(new Error('Polling timeout: Maximum attempts exceeded'));
          return;
        }

        // Fetch job status
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const job: ProcessingJob = await response.json();
        onUpdate(job);

        // Check terminal states
        if (job.status === 'complete') {
          resolve(job);
          return;
        }

        if (job.status === 'failed') {
          reject(new Error(job.error?.message || 'Processing failed'));
          return;
        }

        if (job.status === 'cancelled') {
          reject(new Error('Job was cancelled'));
          return;
        }

        // Continue polling
        setTimeout(poll, interval);
      } catch (error) {
        // Retry on network errors with exponential backoff
        if (attempts < 3) {
          const backoffDelay = interval * Math.pow(2, attempts - 1);
          console.warn(`Poll error, retrying in ${backoffDelay}ms:`, error);
          setTimeout(poll, backoffDelay);
        } else {
          reject(error);
        }
      }
    };

    poll();
  });
}

/**
 * Download processed video
 */
export async function downloadProcessedVideo(
  jobId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/downloads/${jobId}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Download failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.url || data.downloadUrl;
  } catch (error) {
    console.error('Video download error:', error);
    throw error;
  }
}

/**
 * Cancel processing job
 */
export async function cancelProcessingJob(jobId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cancel failed: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error('Job cancellation error:', error);
    throw error;
  }
}

/**
 * Exponential backoff retry wrapper
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}
