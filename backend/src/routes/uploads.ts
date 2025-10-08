import { Router, Request, Response } from 'express';
import { upload, processUploadedFile } from '../services/upload';
import { registerUploadedVideo } from './jobs';

const router = Router();

router.post('/', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'NO_FILE',
          message: 'No video file provided',
        },
      });
    }

    const video = await processUploadedFile(req.file);
    registerUploadedVideo(video);

    res.status(201).json({
      video: {
        id: video.id,
        originalName: video.originalName,
        sizeBytes: video.sizeBytes,
        uploadedAt: video.uploadedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    res.status(500).json({
      error: {
        code: 'UPLOAD_FAILED',
        message,
      },
    });
  }
});

export default router;
