import { JobOrchestrator, StageHandler } from '../index';
import { Job, JobStage } from '../../schemas/types';

describe('JobOrchestrator', () => {
  let orchestrator: JobOrchestrator;

  beforeEach(() => {
    orchestrator = new JobOrchestrator({
      maxRetries: 2,
      retryDelayMs: 10,
      maxRetryDelayMs: 100,
    });
  });

  describe('createJob', () => {
    it('creates job with initial state', () => {
      const job = orchestrator.createJob('proj-123', 'asset-456', 'corr-789');

      expect(job.jobId).toBeDefined();
      expect(job.projectId).toBe('proj-123');
      expect(job.assetId).toBe('asset-456');
      expect(job.correlationId).toBe('corr-789');
      expect(job.status).toBe('idle');
      expect(job.progressPct).toBe(0);
      expect(job.stages.upload.status).toBe('idle');
    });

    it('emits job.created event', done => {
      orchestrator.once('job.created', event => {
        expect(event.type).toBe('job.created');
        expect(event.jobId).toBeDefined();
        done();
      });

      orchestrator.createJob('proj-123', 'asset-456');
    });
  });

  describe('executeStage', () => {
    let mockHandler: jest.Mocked<StageHandler>;
    let job: Job;

    beforeEach(() => {
      mockHandler = {
        execute: jest.fn().mockResolvedValue(undefined),
        canExecute: jest.fn().mockReturnValue(true),
      };

      orchestrator.registerHandler('upload', mockHandler);
      job = orchestrator.createJob('proj-123', 'asset-456');
    });

    it('executes stage successfully', async () => {
      await orchestrator.executeStage(job, 'upload');

      expect(mockHandler.execute).toHaveBeenCalledWith(job);
      expect(job.stages.upload.status).toBe('succeeded');
      expect(job.stages.upload.attempts).toBe(0);
    });

    it('updates progress on success', async () => {
      await orchestrator.executeStage(job, 'upload');

      expect(job.progressPct).toBeGreaterThan(0);
    });

    it('emits stage events', done => {
      const events: string[] = [];

      orchestrator.on('stage.started', () => events.push('started'));
      orchestrator.on('stage.succeeded', () => events.push('succeeded'));

      orchestrator.executeStage(job, 'upload').then(() => {
        expect(events).toEqual(['started', 'succeeded']);
        done();
      });
    });

    it('retries on failure', async () => {
      mockHandler.execute
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce(undefined);

      await orchestrator.executeStage(job, 'upload');

      expect(mockHandler.execute).toHaveBeenCalledTimes(3);
      expect(job.stages.upload.status).toBe('succeeded');
    });

    it('fails after max retries', async () => {
      mockHandler.execute.mockRejectedValue(new Error('Persistent error'));

      await expect(orchestrator.executeStage(job, 'upload')).rejects.toThrow('Persistent error');

      expect(mockHandler.execute).toHaveBeenCalledTimes(3);
      expect(job.stages.upload.status).toBe('failed');
      expect(job.stages.upload.error).toBeDefined();
      expect(job.stages.upload.error?.code).toBe('MAX_RETRIES_EXCEEDED');
    });

    it('checks preconditions before execution', async () => {
      mockHandler.canExecute.mockReturnValue(false);

      await expect(orchestrator.executeStage(job, 'upload')).rejects.toThrow(
        'preconditions not met'
      );

      expect(job.stages.upload.status).toBe('blocked');
    });

    it('logs retry attempts', async () => {
      mockHandler.execute
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce(undefined);

      await orchestrator.executeStage(job, 'upload');

      expect(job.logs.length).toBeGreaterThan(0);
      expect(job.logs[0]).toContain('Attempt 1');
    });
  });

  describe('executeJob', () => {
    beforeEach(() => {
      const stages: JobStage[] = ['upload', 'transcribe', 'nlp', 'compose', 'encode'];

      stages.forEach(stage => {
        const handler: StageHandler = {
          execute: jest.fn().mockResolvedValue(undefined),
          canExecute: jest.fn().mockReturnValue(true),
        };
        orchestrator.registerHandler(stage, handler);
      });
    });

    it('executes all stages in sequence', async () => {
      const job = orchestrator.createJob('proj-123', 'asset-456');

      await orchestrator.executeJob(job.jobId);

      expect(job.status).toBe('succeeded');
      expect(job.stages.done.status).toBe('succeeded');
      expect(job.progressPct).toBe(100);
    });

    it('stops on stage failure', async () => {
      const failingHandler: StageHandler = {
        execute: jest.fn().mockRejectedValue(new Error('Stage failed')),
        canExecute: jest.fn().mockReturnValue(true),
      };
      orchestrator.registerHandler('transcribe', failingHandler);

      const job = orchestrator.createJob('proj-123', 'asset-456');

      await expect(orchestrator.executeJob(job.jobId)).rejects.toThrow('Stage failed');

      expect(job.status).toBe('failed');
      expect(job.stages.failed.status).toBe('succeeded');
    });
  });

  describe('retryStage', () => {
    let mockHandler: jest.Mocked<StageHandler>;
    let job: Job;

    beforeEach(() => {
      mockHandler = {
        execute: jest.fn().mockResolvedValue(undefined),
        canExecute: jest.fn().mockReturnValue(true),
      };

      orchestrator.registerHandler('upload', mockHandler);
      job = orchestrator.createJob('proj-123', 'asset-456');
    });

    it('resets stage state and retries', async () => {
      mockHandler.execute.mockRejectedValue(new Error('Fail'));

      await expect(orchestrator.executeStage(job, 'upload')).rejects.toThrow('Fail');

      expect(job.stages.upload.status).toBe('failed');

      mockHandler.execute.mockResolvedValue(undefined);

      await orchestrator.retryStage(job.jobId, 'upload');

      expect(job.stages.upload.status).toBe('succeeded');
      expect(job.stages.upload.attempts).toBe(0);
    });
  });

  describe('handleWebhookEvent', () => {
    let job: Job;

    beforeEach(() => {
      job = orchestrator.createJob('proj-123', 'asset-456');
    });

    it('processes webhook and updates job', done => {
      orchestrator.once('webhook.received', event => {
        expect(event.jobId).toBe(job.jobId);
        expect(event.stage).toBe('transcribe');
        done();
      });

      orchestrator.handleWebhookEvent({
        jobId: job.jobId,
        stage: 'transcribe',
        status: 'completed',
        data: { transcriptId: 'tx-123' },
      });

      expect(job.artifacts?.transcriptId).toBe('tx-123');
    });

    it('handles unknown job gracefully', () => {
      expect(() => {
        orchestrator.handleWebhookEvent({
          jobId: 'unknown-job',
          stage: 'upload',
          status: 'completed',
        });
      }).not.toThrow();
    });
  });

  describe('waitForCompletion', () => {
    it('resolves when job succeeds', async () => {
      const handler: StageHandler = {
        execute: jest.fn().mockResolvedValue(undefined),
        canExecute: jest.fn().mockReturnValue(true),
      };

      ['upload', 'transcribe', 'nlp', 'compose', 'encode'].forEach(stage => {
        orchestrator.registerHandler(stage as JobStage, handler);
      });

      const job = orchestrator.createJob('proj-123', 'asset-456');

      setTimeout(() => orchestrator.executeJob(job.jobId), 50);

      const result = await orchestrator.waitForCompletion(job.jobId, {
        timeoutMs: 5000,
        pollIntervalMs: 50,
      });

      expect(result.status).toBe('succeeded');
    });

    it('times out after specified duration', async () => {
      const job = orchestrator.createJob('proj-123', 'asset-456');

      await expect(
        orchestrator.waitForCompletion(job.jobId, {
          timeoutMs: 100,
          pollIntervalMs: 10,
        })
      ).rejects.toThrow('timed out');
    });
  });

  describe('listJobs', () => {
    it('returns all created jobs', () => {
      const job1 = orchestrator.createJob('proj-1', 'asset-1');
      const job2 = orchestrator.createJob('proj-2', 'asset-2');

      const jobs = orchestrator.listJobs();

      expect(jobs).toHaveLength(2);
      expect(jobs.map(j => j.jobId)).toEqual([job1.jobId, job2.jobId]);
    });
  });
});
