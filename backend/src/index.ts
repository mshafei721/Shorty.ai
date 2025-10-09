import express from 'express';
import cors from 'cors';
import { config } from './config';
import uploadsRouter from './routes/uploads';
import jobsRouter from './routes/jobs';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.server.nodeEnv,
  });
});

app.use('/uploads', uploadsRouter);
app.use('/jobs', jobsRouter);

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    },
  });
});

const server = app.listen(config.server.port, () => {
  console.log(`[Server] Listening on port ${config.server.port}`);
  console.log(`[Server] Environment: ${config.server.nodeEnv}`);
  console.log(`[Server] Health check: http://localhost:${config.server.port}/health`);
});

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[Server] Process terminated');
    process.exit(0);
  });
});

export default app;
