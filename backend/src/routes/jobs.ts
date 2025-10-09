import { Router, Request, Response } from 'express';
import {
  createJob,
  getJob,
  getAllJobs,
  cancelJob,
  processJob,
} from '../services/jobOrchestrator';
import { fileExists } from '../services/upload';
import type { JobFeatures, UploadedVideo } from '../types';

const router = Router();

const uploadedVideos = new Map<string, UploadedVideo>();

export function registerUploadedVideo(video: UploadedVideo): void {
  uploadedVideos.set(video.id, video);
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { videoId, features } = req.body as { videoId: string; features: JobFeatures };

    if (!videoId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_VIDEO_ID',
          message: 'videoId is required',
        },
      });
    }

    const video = uploadedVideos.get(videoId);
    if (!video) {
      return res.status(404).json({
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: `Video ${videoId} not found`,
        },
      });
    }

    const exists = await fileExists(video.storedPath);
    if (!exists) {
      return res.status(404).json({
        error: {
          code: 'VIDEO_FILE_NOT_FOUND',
          message: 'Video file no longer exists',
        },
      });
    }

    const job = createJob(videoId, features || { subtitles: true, fillerWordRemoval: false });

    processJob(job.id, video).catch((error) => {
      console.error(`Job ${job.id} processing error:`, error);
    });

    return res.status(201).json({
      job: {
        id: job.id,
        videoId: job.videoId,
        status: job.status,
        progress: job.progress,
        requestedFeatures: job.requestedFeatures,
        startedAt: job.startedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Job creation failed';
    return res.status(500).json({
      error: {
        code: 'JOB_CREATION_FAILED',
        message,
      },
    });
  }
});

router.get('/:jobId', (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Job ${jobId} not found`,
        },
      });
    }

    return res.json({
      job: {
        id: job.id,
        videoId: job.videoId,
        status: job.status,
        progress: job.progress,
        requestedFeatures: job.requestedFeatures,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
        outputUrl: job.outputUrl,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get job';
    return res.status(500).json({
      error: {
        code: 'GET_JOB_FAILED',
        message,
      },
    });
  }
});

router.get('/', (_req: Request, res: Response) => {
  try {
    const allJobs = getAllJobs();
    res.json({
      jobs: allJobs.map((job) => ({
        id: job.id,
        videoId: job.videoId,
        status: job.status,
        progress: job.progress,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list jobs';
    res.status(500).json({
      error: {
        code: 'LIST_JOBS_FAILED',
        message,
      },
    });
  }
});

router.post('/:jobId/cancel', (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const cancelled = cancelJob(jobId);

    if (!cancelled) {
      return res.status(400).json({
        error: {
          code: 'CANNOT_CANCEL',
          message: 'Job cannot be cancelled (already completed or not found)',
        },
      });
    }

    return res.json({
      message: 'Job cancelled successfully',
      jobId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel job';
    return res.status(500).json({
      error: {
        code: 'CANCEL_FAILED',
        message,
      },
    });
  }
});

export default router;
