import { v4 as uuidv4 } from 'uuid';
import type { ProcessingJob, JobFeatures, JobStatus, UploadedVideo } from '../types';
import { transcribeVideo, generateSubtitles } from './transcription';
import { composeVideoWithSubtitles } from './composition';
import { deleteUploadedFile } from './upload';

const jobs = new Map<string, ProcessingJob>();

export function createJob(videoId: string, features: JobFeatures): ProcessingJob {
  const job: ProcessingJob = {
    id: uuidv4(),
    videoId,
    status: 'queued',
    progress: 0,
    requestedFeatures: features,
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    retries: 0,
  };

  jobs.set(job.id, job);
  return job;
}

export function getJob(jobId: string): ProcessingJob | undefined {
  return jobs.get(jobId);
}

export function getAllJobs(): ProcessingJob[] {
  return Array.from(jobs.values());
}

export function updateJobStatus(jobId: string, status: JobStatus, progress: number): void {
  const job = jobs.get(jobId);
  if (job) {
    job.status = status;
    job.progress = progress;
    if (status === 'complete' || status === 'failed' || status === 'cancelled') {
      job.completedAt = new Date().toISOString();
    }
  }
}

export function setJobError(jobId: string, error: string): void {
  const job = jobs.get(jobId);
  if (job) {
    job.error = error;
    job.status = 'failed';
    job.completedAt = new Date().toISOString();
  }
}

export function cancelJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (job && job.status !== 'complete' && job.status !== 'failed') {
    job.status = 'cancelled';
    job.completedAt = new Date().toISOString();
    return true;
  }
  return false;
}

export async function processJob(jobId: string, video: UploadedVideo): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    updateJobStatus(jobId, 'processing', 10);

    const transcription = await transcribeVideo(video.storedPath);
    job.transcriptionId = transcription.id;
    updateJobStatus(jobId, 'processing', 40);

    if (job.status === 'cancelled') {
      await deleteUploadedFile(video.storedPath);
      return;
    }

    const subtitles = generateSubtitles(transcription.words);
    updateJobStatus(jobId, 'processing', 50);

    if (job.requestedFeatures.subtitles) {
      const composedUrl = await composeVideoWithSubtitles(
        `file://${video.storedPath}`,
        subtitles,
        transcription.duration
      );
      job.outputUrl = composedUrl;
      updateJobStatus(jobId, 'processing', 90);
    }

    updateJobStatus(jobId, 'complete', 100);

    setTimeout(() => {
      deleteUploadedFile(video.storedPath).catch(console.error);
    }, 5000);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    setJobError(jobId, errorMessage);
    await deleteUploadedFile(video.storedPath).catch(console.error);
  }
}

export function clearCompletedJobs(olderThanMs: number): number {
  const now = Date.now();
  let cleared = 0;

  for (const [id, job] of jobs.entries()) {
    if (job.completedAt) {
      const completedAt = new Date(job.completedAt).getTime();
      if (now - completedAt > olderThanMs) {
        jobs.delete(id);
        cleared++;
      }
    }
  }

  return cleared;
}
