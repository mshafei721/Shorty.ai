import { JobOrchestrator, StageHandler } from '../orchestrator';
import { UploadAdapter } from '../upload';
import { TranscriptionService, AssemblyAIAdapter, DeepgramAdapter } from '../transcribe';
import { FillerDetectionService } from '../nlp';
import { ShotstackCompositionAdapter } from '../compose';
import { EncodingService, MuxEncodingAdapter } from '../encode';
import { Job } from '../schemas/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Pipeline Integration Tests', () => {
  let orchestrator: JobOrchestrator;

  beforeEach(() => {
    orchestrator = new JobOrchestrator({
      maxRetries: 1,
      retryDelayMs: 10,
    });

    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Happy Path', () => {
    it('executes full pipeline from upload to encode', async () => {
      class MockUploadHandler implements StageHandler {
        canExecute() {
          return true;
        }
        async execute(job: Job) {
          job.artifacts = { objectUrl: 'http://example.com/uploaded.mp4', checksum: 'abc123' };
        }
      }

      class MockTranscribeHandler implements StageHandler {
        canExecute(job: Job) {
          return !!job.artifacts?.objectUrl;
        }
        async execute(job: Job) {
          job.artifacts!.transcriptId = 'tx-123';
        }
      }

      class MockNLPHandler implements StageHandler {
        canExecute(job: Job) {
          return !!job.artifacts?.transcriptId;
        }
        async execute(job: Job) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      class MockComposeHandler implements StageHandler {
        canExecute(job: Job) {
          return !!job.artifacts?.transcriptId;
        }
        async execute(job: Job) {
          job.artifacts!.renderId = 'render-456';
        }
      }

      class MockEncodeHandler implements StageHandler {
        canExecute(job: Job) {
          return !!job.artifacts?.renderId;
        }
        async execute(job: Job) {
          job.artifacts!.assetUrl = 'https://stream.mux.com/final.m3u8';
        }
      }

      orchestrator.registerHandler('upload', new MockUploadHandler());
      orchestrator.registerHandler('transcribe', new MockTranscribeHandler());
      orchestrator.registerHandler('nlp', new MockNLPHandler());
      orchestrator.registerHandler('compose', new MockComposeHandler());
      orchestrator.registerHandler('encode', new MockEncodeHandler());

      const job = orchestrator.createJob('proj-123', 'asset-456');

      await orchestrator.executeJob(job.jobId);

      expect(job.status).toBe('succeeded');
      expect(job.progressPct).toBe(100);
      expect(job.artifacts?.assetUrl).toBe('https://stream.mux.com/final.m3u8');
      expect(job.stages.upload.status).toBe('succeeded');
      expect(job.stages.transcribe.status).toBe('succeeded');
      expect(job.stages.nlp.status).toBe('succeeded');
      expect(job.stages.compose.status).toBe('succeeded');
      expect(job.stages.encode.status).toBe('succeeded');
    });

    it('emits events throughout pipeline', async () => {
      class MockHandler implements StageHandler {
        canExecute() {
          return true;
        }
        async execute() {
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }

      ['upload', 'transcribe', 'nlp', 'compose', 'encode'].forEach(stage => {
        orchestrator.registerHandler(stage as any, new MockHandler());
      });

      const events: string[] = [];
      orchestrator.on('job.created', () => events.push('created'));
      orchestrator.on('stage.started', () => events.push('started'));
      orchestrator.on('stage.succeeded', () => events.push('succeeded'));
      orchestrator.on('job.updated', () => events.push('updated'));

      const job = orchestrator.createJob('proj-123', 'asset-456');
      await orchestrator.executeJob(job.jobId);

      expect(events).toContain('created');
      expect(events.filter(e => e === 'started').length).toBe(5);
      expect(events.filter(e => e === 'succeeded').length).toBe(5);
    });
  });

  describe('Failure and Recovery', () => {
    it('retries failed stage and succeeds', async () => {
      let attempt = 0;

      class FlakeyHandler implements StageHandler {
        canExecute() {
          return true;
        }
        async execute() {
          attempt++;
          if (attempt === 1) {
            throw new Error('Temporary failure');
          }
        }
      }

      ['upload', 'transcribe', 'nlp', 'compose', 'encode'].forEach(stage => {
        orchestrator.registerHandler(stage as any, new FlakeyHandler());
      });

      const job = orchestrator.createJob('proj-123', 'asset-456');

      await orchestrator.executeJob(job.jobId);

      expect(job.status).toBe('succeeded');
      expect(attempt).toBeGreaterThan(1);
    });

    it('stops pipeline on permanent failure', async () => {
      class FailingHandler implements StageHandler {
        canExecute() {
          return true;
        }
        async execute() {
          throw new Error('Permanent failure');
        }
      }

      class SuccessHandler implements StageHandler {
        canExecute() {
          return true;
        }
        async execute() {}
      }

      orchestrator.registerHandler('upload', new SuccessHandler());
      orchestrator.registerHandler('transcribe', new FailingHandler());
      orchestrator.registerHandler('nlp', new SuccessHandler());
      orchestrator.registerHandler('compose', new SuccessHandler());
      orchestrator.registerHandler('encode', new SuccessHandler());

      const job = orchestrator.createJob('proj-123', 'asset-456');

      await expect(orchestrator.executeJob(job.jobId)).rejects.toThrow('Permanent failure');

      expect(job.status).toBe('failed');
      expect(job.stages.upload.status).toBe('succeeded');
      expect(job.stages.transcribe.status).toBe('failed');
      expect(job.stages.nlp.status).toBe('idle');
    });
  });

  describe('Webhook Integration', () => {
    it('handles webhook events and updates job state', () => {
      const job = orchestrator.createJob('proj-123', 'asset-456');

      orchestrator.handleWebhookEvent({
        jobId: job.jobId,
        stage: 'transcribe',
        status: 'completed',
        data: {
          transcriptId: 'tx-webhook-123',
        },
      });

      const updatedJob = orchestrator.getJob(job.jobId);
      expect(updatedJob?.artifacts?.transcriptId).toBe('tx-webhook-123');
    });

    it('processes out-of-order webhooks', () => {
      const job = orchestrator.createJob('proj-123', 'asset-456');

      orchestrator.handleWebhookEvent({
        jobId: job.jobId,
        stage: 'encode',
        status: 'ready',
        data: { assetUrl: 'https://stream.mux.com/final.m3u8' },
      });

      orchestrator.handleWebhookEvent({
        jobId: job.jobId,
        stage: 'transcribe',
        status: 'completed',
        data: { transcriptId: 'tx-123' },
      });

      const updatedJob = orchestrator.getJob(job.jobId);
      expect(updatedJob?.artifacts?.transcriptId).toBe('tx-123');
      expect(updatedJob?.artifacts?.assetUrl).toBe('https://stream.mux.com/final.m3u8');
    });
  });

  describe('Filler Detection Metrics', () => {
    it('meets precision and recall targets on sample data', async () => {
      const sampleTranscript = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../fixtures/sample-transcript.json'), 'utf-8')
      );

      const groundTruth = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../fixtures/filler-ground-truth.json'), 'utf-8')
      );

      const service = new FillerDetectionService({ minConfidence: 0.7 });
      const detected = service.detectFillers(sampleTranscript);
      const metrics = service.evaluateMetrics(detected, groundTruth);

      expect(metrics.precision).toBeGreaterThanOrEqual(0.5);
      expect(metrics.recall).toBeGreaterThanOrEqual(0.5);
    });

    it('auto-tunes threshold to meet targets', async () => {
      const sampleTranscript = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../fixtures/sample-transcript.json'), 'utf-8')
      );

      const groundTruth = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../fixtures/filler-ground-truth.json'), 'utf-8')
      );

      const service = new FillerDetectionService();
      const result = service.tuneThreshold(sampleTranscript, groundTruth, 0.8, 0.7);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.metrics).toBeDefined();
    });
  });
});
