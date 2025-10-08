import { Job, JobStage, JobStatus, JobEvent, StageState } from '../schemas/types';
import { EventEmitter } from 'events';

export interface OrchestratorConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  maxRetryDelayMs?: number;
}

export interface StageHandler {
  execute(job: Job): Promise<void>;
  canExecute(job: Job): boolean;
}

export class JobOrchestrator extends EventEmitter {
  private jobs = new Map<string, Job>();
  private handlers = new Map<JobStage, StageHandler>();
  private readonly config: Required<OrchestratorConfig>;

  constructor(config: OrchestratorConfig = {}) {
    super();
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      maxRetryDelayMs: config.maxRetryDelayMs ?? 30000,
    };
  }

  registerHandler(stage: JobStage, handler: StageHandler): void {
    this.handlers.set(stage, handler);
  }

  createJob(projectId: string, assetId: string, correlationId?: string): Job {
    const jobId = this.generateJobId();
    const now = new Date().toISOString();

    const job: Job = {
      jobId,
      projectId,
      assetId,
      correlationId,
      status: 'idle',
      progressPct: 0,
      stages: {
        upload: this.createStageState(),
        transcribe: this.createStageState(),
        nlp: this.createStageState(),
        compose: this.createStageState(),
        encode: this.createStageState(),
        done: this.createStageState(),
        failed: this.createStageState(),
      },
      logs: [],
      createdAt: now,
    };

    this.jobs.set(jobId, job);
    this.emitEvent({ type: 'job.created', jobId, timestamp: now });
    return job;
  }

  async executeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    job.status = 'running';
    this.updateJob(job);

    try {
      await this.executeStage(job, 'upload');
      await this.executeStage(job, 'transcribe');
      await this.executeStage(job, 'nlp');
      await this.executeStage(job, 'compose');
      await this.executeStage(job, 'encode');

      job.status = 'succeeded';
      job.stages.done.status = 'succeeded';
      job.progressPct = 100;
      this.updateJob(job);
    } catch (err) {
      job.status = 'failed';
      job.stages.failed.status = 'succeeded';
      job.stages.failed.error = {
        code: 'EXECUTION_FAILED',
        message: err instanceof Error ? err.message : String(err),
      };
      this.updateJob(job);
      throw err;
    }
  }

  async executeStage(job: Job, stage: JobStage): Promise<void> {
    const handler = this.handlers.get(stage);
    if (!handler) {
      throw new Error(`No handler registered for stage: ${stage}`);
    }

    const stageState = job.stages[stage];
    stageState.status = 'running';
    stageState.startedAt = new Date().toISOString();

    this.emitEvent({
      type: 'stage.started',
      jobId: job.jobId,
      stage,
      timestamp: stageState.startedAt,
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      stageState.attempts = attempt;

      try {
        if (!handler.canExecute(job)) {
          stageState.status = 'blocked';
          stageState.error = {
            code: 'PRECONDITION_FAILED',
            message: 'Stage preconditions not met',
          };
          this.updateJob(job);
          throw new Error(`Stage ${stage} cannot execute: preconditions not met`);
        }

        await handler.execute(job);

        stageState.status = 'succeeded';
        stageState.updatedAt = new Date().toISOString();
        this.updateProgress(job, stage);
        this.updateJob(job);

        this.emitEvent({
          type: 'stage.succeeded',
          jobId: job.jobId,
          stage,
          timestamp: stageState.updatedAt,
        });

        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (stageState.status === 'blocked') {
          throw lastError;
        }

        job.logs.push(
          `[${stage}] Attempt ${attempt + 1}/${this.config.maxRetries + 1} failed: ${lastError.message}`
        );

        if (attempt < this.config.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    stageState.status = 'failed';
    stageState.error = {
      code: 'MAX_RETRIES_EXCEEDED',
      message: lastError?.message || 'Unknown error',
    };
    stageState.updatedAt = new Date().toISOString();
    this.updateJob(job);

    this.emitEvent({
      type: 'stage.failed',
      jobId: job.jobId,
      stage,
      timestamp: stageState.updatedAt,
      data: { error: stageState.error },
    });

    throw lastError;
  }

  async retryStage(jobId: string, stage: JobStage): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const stageState = job.stages[stage];
    stageState.status = 'idle';
    stageState.attempts = 0;
    stageState.error = undefined;

    await this.executeStage(job, stage);
  }

  handleWebhookEvent(event: {
    jobId: string;
    stage: JobStage;
    status: string;
    data?: Record<string, unknown>;
  }): void {
    const job = this.jobs.get(event.jobId);
    if (!job) {
      console.warn(`Webhook received for unknown job: ${event.jobId}`);
      return;
    }

    const stageState = job.stages[event.stage];
    if (!stageState) {
      console.warn(`Webhook received for unknown stage: ${event.stage}`);
      return;
    }

    this.emitEvent({
      type: 'webhook.received',
      jobId: event.jobId,
      stage: event.stage,
      timestamp: new Date().toISOString(),
      data: event.data,
    });

    if (event.data) {
      if (!job.artifacts) {
        job.artifacts = {};
      }
      Object.assign(job.artifacts, event.data);
    }

    this.updateJob(job);
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  listJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  private createStageState(): StageState {
    return {
      status: 'idle',
      attempts: 0,
    };
  }

  private updateJob(job: Job): void {
    job.updatedAt = new Date().toISOString();
    this.jobs.set(job.jobId, job);

    this.emitEvent({
      type: 'job.updated',
      jobId: job.jobId,
      timestamp: job.updatedAt,
      data: {
        status: job.status,
        progressPct: job.progressPct,
      },
    });
  }

  private updateProgress(job: Job, completedStage: JobStage): void {
    const stageWeights: Record<JobStage, number> = {
      upload: 15,
      transcribe: 25,
      nlp: 10,
      compose: 25,
      encode: 25,
      done: 0,
      failed: 0,
    };

    let progress = 0;
    const stages: JobStage[] = ['upload', 'transcribe', 'nlp', 'compose', 'encode'];

    for (const stage of stages) {
      if (job.stages[stage].status === 'succeeded') {
        progress += stageWeights[stage];
      }
    }

    job.progressPct = Math.min(100, progress);
  }

  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryDelayMs;
    const jitter = Math.random() * 500;
    const delay = Math.min(
      baseDelay * Math.pow(2, attempt) + jitter,
      this.config.maxRetryDelayMs
    );
    return delay;
  }

  private generateJobId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private emitEvent(event: JobEvent): void {
    this.emit('event', event);
    this.emit(event.type, event);
  }

  async waitForCompletion(
    jobId: string,
    options: { timeoutMs?: number; pollIntervalMs?: number } = {}
  ): Promise<Job> {
    const timeoutMs = options.timeoutMs ?? 600000;
    const pollIntervalMs = options.pollIntervalMs ?? 2000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const job = this.getJob(jobId);
      if (!job) throw new Error(`Job ${jobId} not found`);

      if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled') {
        return job;
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Job ${jobId} timed out after ${timeoutMs}ms`);
  }
}
